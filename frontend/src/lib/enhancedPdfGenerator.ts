import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from './types';

/**
 * Enhanced PDF Generator with logos, custom fonts, and professional styling
 * Matches the production Node.js PDF generation script
 */

// Helper to convert image URL to base64
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', url, error);
    return null;
  }
}

// Helper to get project logo from downloaded images
async function getProjectLogo(slug: string): Promise<string | null> {
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  
  for (const ext of extensions) {
    try {
      const logoUrl = `/img/projects/${slug}.${ext}`;
      const base64 = await urlToBase64(logoUrl);
      if (base64) return base64;
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

// Helper to format date
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Helper to capitalize
function capitalize(s: string): string {
  return s && s[0].toUpperCase() + s.slice(1).toLowerCase();
}

export async function generateEnhancedAuditPDF(project: Project) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 40;
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docTime = today.toISOString().split('T')[0].replace(/-/g, '');

  // Front page
  try {
    const frontPageBg = await urlToBase64('/pdf-assets/logos/front9.png');
    if (frontPageBg) doc.addImage(frontPageBg, 'PNG', 0, 0, pageWidth, pageHeight);
  } catch {}
  doc.setFontSize(27);
  doc.setTextColor(255, 255, 255);
  doc.text(`${project.name} ${capitalize(project.platform || 'Token')}`, 75, 210, { maxWidth: 350 });
  doc.setFontSize(12);
  doc.setTextColor(214, 221, 224);
  doc.text(formattedDate, 75, 300);
  doc.text(`Audit Status: ${project.published ? 'Published' : 'Draft'}`, 75, 320);
  const projectLogo = await getProjectLogo(project.slug);
  if (projectLogo && !projectLogo.includes('svg')) {
    try { doc.addImage(projectLogo, 'PNG', 430, 185, 100, 100, undefined, 'FAST'); } catch {}
  }

  // Page 2: Risk Analysis + Project Info
  doc.addPage(); currentY = 60;
  try {
    const cfgLogo = await urlToBase64('/pdf-assets/logos/CFG-Logo-red-black-FULL.png');
    if (cfgLogo) doc.addImage(cfgLogo, 'PNG', pageWidth - 150, 20, 120, 30);
  } catch {}
  doc.setFontSize(20); doc.setTextColor(30, 30, 30); doc.text('RISK ANALYSIS', 60, currentY); currentY += 10;
  doc.setDrawColor(239, 68, 68); doc.setLineWidth(2); doc.line(60, currentY, 160, currentY); currentY += 30;
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Project Information', 60, currentY); currentY += 10;
  const projectInfo = [
    ['Name', project.name], ['Symbol', project.symbol], ['Decimals', project.decimals?.toString() || ''], ['Total Supply', project.supply],
    ['Platform', project.platform || 'Binance Smart Chain'], ['Contract Address', project.contract_info?.contract_address || 'N/A'],
    ['Compiler', project.contract_info?.contract_compiler || 'N/A'], ['License', project.contract_info?.contract_license || 'N/A'],
    ['Audit Tool Version', project.auditToolVersion || ''], ['Audit Edition', project.auditEdition || ''], ['Payment Hash', project.paymentHash || '']
  ];
  autoTable(doc, { startY: currentY, head: [['Property', 'Value']], body: projectInfo, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 }, tableWidth: 'auto' });
  currentY = (doc as any).lastAutoTable.finalY + 30;
  if (project.description) {
    doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Description', 60, currentY); currentY += 15;
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    const splitDescription = doc.splitTextToSize(project.description, pageWidth - 120);
    doc.text(splitDescription, 60, currentY); currentY += (splitDescription.length * 12) + 20;
  }
  if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }

  // Timeline Section
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Timeline', 60, currentY); currentY += 15;
  const timeline = [
    ['Audit Request', project.timeline?.audit_request || ''],
    ['Onboarding Process', project.timeline?.onboarding_process || ''],
    ['Audit Preview', project.timeline?.audit_preview || ''],
    ['Audit Release', project.timeline?.audit_release || '']
  ];
  autoTable(doc, { startY: currentY, head: [['Step', 'Date']], body: timeline, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 } });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // KYC Section
  if ((project as any).isKYC) {
    if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
    doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('KYC Information', 60, currentY); currentY += 15;
    const kycInfo = [
      ['KYC Verified', 'Yes'],
      ['KYC URL', project.kycURL || ''],
      ['KYC Score', project.kycScore?.toString() || ''],
    ];
    autoTable(doc, { startY: currentY, head: [['Field', 'Value']], body: kycInfo, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 } });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Token Distribution Section (Only show if tokenDistributionEnabled is true)
  if ((project as any).tokenDistributionEnabled && project.tokenDistribution && project.tokenDistribution.distributions?.length) {
    if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
    doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Token Distribution', 60, currentY); currentY += 15;
    const distTable = project.tokenDistribution.distributions.map(d => [d.name, d.amount, d.description]);
    autoTable(doc, { startY: currentY, head: [['Name', 'Amount', 'Description']], body: distTable, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 } });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // SWC Checks Section - DEPRECATED: SWC checks are no longer used
  // Keeping comment for backward compatibility reference

  // Advanced Metadata Section
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Advanced Metadata', 60, currentY); currentY += 15;
  const advMeta = [
    ['Graph', project.isGraph ? 'Yes' : 'No'], ['Inheritance', project.isInheritance ? 'Yes' : 'No'], ['EVM Contract', project.isEVMContract ? 'Yes' : 'No'],
    ['Solana', project.isSolana ? 'Yes' : 'No'], ['NFT', project.isNFT ? 'Yes' : 'No'], ['Token', project.isToken ? 'Yes' : 'No'], ['Staking', project.isStaking ? 'Yes' : 'No'], ['Other', project.isOther ? 'Yes' : 'No']
  ];
  autoTable(doc, { startY: currentY, head: [['Field', 'Value']], body: advMeta, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 } });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Score History & Audit Confidence
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Score History & Audit Confidence', 60, currentY); currentY += 15;
  if (project.score_history?.data?.length) {
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    doc.text(`Score History: ${project.score_history.data.join(', ')}`, 60, currentY); currentY += 15;
    doc.text(`Current Score: ${project.score_history.current}`, 60, currentY); currentY += 15;
  }
  if (project.audit_confidence) {
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    doc.text(`Audit Confidence: ${project.audit_confidence}`, 60, currentY); currentY += 15;
    // Draw stars for confidence
    const confStars = { 'Low': 1, 'Medium': 2, 'High': 3 }[project.audit_confidence] || 2;
    for (let i = 0; i < confStars; i++) {
      doc.setFillColor(239, 68, 68); doc.circle(120 + i * 20, currentY, 7, 'F');
    }
    currentY += 20;
  }

  // File a Report Section
  doc.setFontSize(14); doc.setTextColor(239, 68, 68); doc.text('Found an issue? File a report at https://audit.cfg.ninja/report', 60, currentY); currentY += 30;

  // Findings Summary Table
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Findings Summary', 60, currentY); currentY += 15;
  const findingsSummary = [
    ['Critical', project.critical?.found || 0, project.critical?.pending || 0, project.critical?.resolved || 0],
    ['High/Major', project.major?.found || 0, project.major?.pending || 0, project.major?.resolved || 0],
    ['Medium', project.medium?.found || 0, project.medium?.pending || 0, project.medium?.resolved || 0],
    ['Low/Minor', project.minor?.found || 0, project.minor?.pending || 0, project.minor?.resolved || 0],
    ['Informational', project.informational?.found || 0, project.informational?.pending || 0, project.informational?.resolved || 0]
  ];
  autoTable(doc, { startY: currentY, head: [['Severity', 'Found', 'Pending', 'Resolved']], body: findingsSummary, theme: 'grid', headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 } });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Detailed CFG Findings - Only show findings that are NOT "Pass" or "Not Detected"
  const activeFindings = (project.cfg_findings || []).filter(f => 
    f.status && !['Pass', 'Not Detected'].includes(f.status)
  );
  
  if (activeFindings.length > 0) {
    if (currentY > pageHeight - 100) { doc.addPage(); currentY = 60; }
    doc.setFontSize(18); doc.setTextColor(0, 0, 0); doc.text('Detailed Findings', 60, currentY); currentY += 10;
    doc.setDrawColor(239, 68, 68); doc.setLineWidth(2); doc.line(60, currentY, 200, currentY); currentY += 25;
    
    for (const finding of activeFindings) {
      if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
      
      // Finding header with ID and title
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
      doc.text(`${finding.id}: ${finding.title}`, 60, currentY); currentY += 18;
      
      // Severity badge
      const severityColors: Record<string, number[]> = { 
        'Critical': [220, 38, 38], 
        'High': [249, 115, 22], 
        'Medium': [234, 179, 8], 
        'Low': [34, 197, 94], 
        'Informational': [156, 163, 175] 
      };
      const color = severityColors[finding.severity] || [156, 163, 175];
      doc.setFillColor(color[0], color[1], color[2]); 
      doc.roundedRect(60, currentY, 80, 16, 3, 3, 'F');
      doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); 
      doc.text(finding.severity, 70, currentY + 11); currentY += 22;
      
      // Status and Location
      doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal'); 
      doc.text(`Status: ${finding.status}`, 60, currentY);
      if (finding.location) doc.text(`Location: ${finding.location}`, 200, currentY);
      if (finding.category) doc.text(`Category: ${finding.category}`, 350, currentY);
      currentY += 15;
      
      // Description
      if (finding.description) { 
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text('Description:', 70, currentY); currentY += 12;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60); 
        const splitDesc = doc.splitTextToSize(finding.description, pageWidth - 140); 
        doc.text(splitDesc, 70, currentY); 
        currentY += (splitDesc.length * 11) + 10; 
      }
      
      // Recommendation
      if (finding.recommendation) { 
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
        doc.text('Recommendation:', 70, currentY); currentY += 12; 
        doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60); 
        const splitRec = doc.splitTextToSize(finding.recommendation, pageWidth - 140); 
        doc.text(splitRec, 70, currentY); 
        currentY += (splitRec.length * 11) + 10; 
      }
      
      // Alleviation/Mitigation
      if (finding.alleviation) { 
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
        doc.text('Mitigation:', 70, currentY); currentY += 12; 
        doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60); 
        const splitMit = doc.splitTextToSize(finding.alleviation, pageWidth - 140); 
        doc.text(splitMit, 70, currentY); 
        currentY += (splitMit.length * 11) + 10; 
      }
      
      // Divider
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.5); 
      doc.line(60, currentY, pageWidth - 60, currentY); currentY += 15;
    }
  } else {
    // If no active findings, show a message
    if (currentY > pageHeight - 100) { doc.addPage(); currentY = 60; }
    doc.setFontSize(16); doc.setTextColor(34, 197, 94); 
    doc.text('✓ No Critical Findings Detected', 60, currentY); 
    doc.setFontSize(12); doc.setTextColor(100, 100, 100);
    currentY += 20;
    doc.text('All CFG security checks passed successfully.', 60, currentY);
    currentY += 30;
  }

  // Contract Overview
  if (currentY > pageHeight - 200) { doc.addPage(); currentY = 60; }
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Contract Overview', 60, currentY); currentY += 15;
  const contractOverview = [
    ['Honeypot', project.overview?.honeypot ? 'Yes ⚠️' : 'No ✓'], ['Hidden Owner', project.overview?.hidden_owner ? 'Yes ⚠️' : 'No ✓'],
    ['Mint Function', project.overview?.mint ? 'Yes ⚠️' : 'No ✓'], ['Blacklist', project.overview?.blacklist ? 'Yes ⚠️' : 'No ✓'],
    ['Whitelist', project.overview?.whitelist ? 'Yes' : 'No'], ['Proxy', project.overview?.proxy_check ? 'Yes ⚠️' : 'No ✓'],
    ['Buy Tax', `${project.overview?.buy_tax || 0}%`], ['Sell Tax', `${project.overview?.sell_tax || 0}%`]
  ];
  autoTable(doc, { startY: currentY, head: [['Check', 'Result']], body: contractOverview, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 9 }, margin: { left: 60, right: 60 } });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Social Links
  const socialLinks = [
    ['Website', project.socials?.website || 'N/A'], ['Telegram', project.socials?.telegram || 'N/A'], ['Twitter', project.socials?.twitter || 'N/A'], ['GitHub', project.socials?.github || 'N/A']
  ].filter(([_, value]) => value !== 'N/A');
  if (socialLinks.length > 0) {
    if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
    doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Social Links', 60, currentY); currentY += 15;
    autoTable(doc, { startY: currentY, head: [['Platform', 'Link']], body: socialLinks, theme: 'grid', headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 8 }, margin: { left: 60, right: 60 } });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(`Generated by CFG Ninja Audit Portal - ${formattedDate}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }
  doc.save(`${docTime}_CFGNINJA_${project.slug}_Audit.pdf`);
}

/**
 * Generate PDF and return as Blob (for GitHub upload)
 */
export async function generateEnhancedAuditPDFBlob(project: Project): Promise<Blob> {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Reuse the same generation logic but return blob
  const formattedDate = formatDate(new Date().toISOString());
  const docTime = new Date().toISOString().slice(0, 8).replace(/-/g, '');

  // Load logos
  const cfgLogo = await urlToBase64('/img/cfg-ninja-logo.png');
  const projectLogo = await getProjectLogo(project.slug);

  // Header with gradient background and logos
  let currentY = 80;
  doc.setFillColor(26, 35, 126);
  doc.rect(0, 0, pageWidth, 120, 'F');

  // CFG Logo (left side)
  if (cfgLogo) {
    try {
      doc.addImage(cfgLogo, 'PNG', 40, 30, 60, 60);
    } catch (error) {
      console.error('Failed to add CFG logo:', error);
    }
  }

  // Title (center)
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART CONTRACT AUDIT REPORT', pageWidth / 2, 60, { align: 'center' });

  // Project Logo (right side)
  if (projectLogo) {
    try {
      doc.addImage(projectLogo, 'PNG', pageWidth - 100, 30, 60, 60);
    } catch (error) {
      console.error('Failed to add project logo:', error);
    }
  }

  // Project Name
  doc.setFontSize(18);
  doc.text(project.name || 'N/A', pageWidth / 2, 95, { align: 'center' });

  currentY = 140;

  // Audit Information
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Information', 60, currentY);
  currentY += 20;

  const auditInfo = [
    ['Project', project.name || 'N/A'],
    ['Symbol', project.symbol || 'N/A'],
    ['Platform', project.platform || 'N/A'],
    ['Contract Address', project.contract_info?.contract_address || 'N/A'],
    ['Audit Date', formatDate(project.timeline?.audit_release)],
    ['Auditor', 'CFG Ninja'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Property', 'Value']],
    body: auditInfo,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Audit Scores
  if (currentY > pageHeight - 200) {
    doc.addPage();
    currentY = 60;
  }

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Audit Scores', 60, currentY);
  currentY += 20;

  const securityScore = project.securityScore || project.scores?.security || 0;
  const auditorScore = project.auditorScore || project.scores?.auditor || 0;

  // Security Score with visual bar
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Score:', 60, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(securityScore >= 75 ? [34, 197, 94] : securityScore >= 50 ? [234, 179, 8] : [239, 68, 68]);
  doc.text(`${securityScore}/100`, 160, currentY);

  // Score bar
  const barWidth = 200;
  const barHeight = 15;
  const barX = 240;
  const barY = currentY - 10;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.rect(barX, barY, barWidth, barHeight);
  const fillWidth = (securityScore / 100) * barWidth;
  doc.setFillColor(securityScore >= 75 ? [34, 197, 94] : securityScore >= 50 ? [234, 179, 8] : [239, 68, 68]);
  doc.rect(barX, barY, fillWidth, barHeight, 'F');

  currentY += 30;

  // Auditor Score with visual bar
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Auditor Score:', 60, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(auditorScore >= 75 ? [34, 197, 94] : auditorScore >= 50 ? [234, 179, 8] : [239, 68, 68]);
  doc.text(`${auditorScore}/100`, 160, currentY);

  const auditorFillWidth = (auditorScore / 100) * barWidth;
  doc.setDrawColor(220, 220, 220);
  doc.rect(barX, currentY - 10, barWidth, barHeight);
  doc.setFillColor(auditorScore >= 75 ? [34, 197, 94] : auditorScore >= 50 ? [234, 179, 8] : [239, 68, 68]);
  doc.rect(barX, currentY - 10, auditorFillWidth, barHeight, 'F');

  currentY += 40;

  // Findings Summary
  if (currentY > pageHeight - 250) {
    doc.addPage();
    currentY = 60;
  }

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Findings Summary', 60, currentY);
  currentY += 15;

  const findingsSummary = [
    ['Critical', project.critical?.found || 0, project.critical?.pending || 0, project.critical?.resolved || 0],
    ['High', project.major?.found || 0, project.major?.pending || 0, project.major?.resolved || 0],
    ['Medium', project.medium?.found || 0, project.medium?.pending || 0, project.medium?.resolved || 0],
    ['Low', project.minor?.found || 0, project.minor?.pending || 0, project.minor?.resolved || 0],
    ['Informational', project.informational?.found || 0, project.informational?.pending || 0, project.informational?.resolved || 0],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Severity', 'Found', 'Pending', 'Resolved']],
    body: findingsSummary,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // CFG Findings Details
  const cfgFindings = project.cfg_findings || [];
  const activeFindings = cfgFindings.filter((f: any) => f.status === 'Detected' || f.status === 'Fail');

  if (activeFindings.length > 0) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 60;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Detailed Findings', 60, currentY);
    currentY += 20;

    for (const finding of activeFindings) {
      if (currentY > pageHeight - 200) {
        doc.addPage();
        currentY = 60;
      }

      // Severity badge
      const severityColor =
        finding.severity === 'Critical' ? [220, 38, 38] :
        finding.severity === 'High' ? [234, 88, 12] :
        finding.severity === 'Medium' ? [234, 179, 8] :
        finding.severity === 'Low' ? [59, 130, 246] : [107, 114, 128];

      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.roundedRect(60, currentY - 10, 60, 18, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.severity, 90, currentY + 2, { align: 'center' });

      currentY += 20;

      // Finding title
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.title || finding.name || 'Untitled Finding', 60, currentY);
      currentY += 15;

      // Description
      if (finding.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const splitDesc = doc.splitTextToSize(finding.description, pageWidth - 120);
        doc.text(splitDesc, 60, currentY);
        currentY += splitDesc.length * 11 + 10;
      }

      // Mitigation
      if (finding.alleviation || finding.mitigation) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Mitigation:', 60, currentY);
        currentY += 12;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const splitMit = doc.splitTextToSize(finding.alleviation || finding.mitigation, pageWidth - 120);
        doc.text(splitMit, 60, currentY);
        currentY += splitMit.length * 11 + 10;
      }

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(60, currentY, pageWidth - 60, currentY);
      currentY += 15;
    }
  } else {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 60;
    }
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('✓ No Critical Findings Detected', 60, currentY);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    currentY += 20;
    doc.text('All CFG security checks passed successfully.', 60, currentY);
    currentY += 30;
  }

  // Contract Overview
  if (currentY > pageHeight - 200) {
    doc.addPage();
    currentY = 60;
  }

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Contract Overview', 60, currentY);
  currentY += 15;

  const contractOverview = [
    ['Honeypot', project.overview?.honeypot ? 'Yes ⚠️' : 'No ✓'],
    ['Hidden Owner', project.overview?.hidden_owner ? 'Yes ⚠️' : 'No ✓'],
    ['Mint Function', project.overview?.mint ? 'Yes ⚠️' : 'No ✓'],
    ['Blacklist', project.overview?.blacklist ? 'Yes ⚠️' : 'No ✓'],
    ['Whitelist', project.overview?.whitelist ? 'Yes' : 'No'],
    ['Proxy', project.overview?.proxy_check ? 'Yes ⚠️' : 'No ✓'],
    ['Buy Tax', `${project.overview?.buy_tax || 0}%`],
    ['Sell Tax', `${project.overview?.sell_tax || 0}%`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Check', 'Result']],
    body: contractOverview,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Social Links
  const socialLinks = [
    ['Website', project.socials?.website || 'N/A'],
    ['Telegram', project.socials?.telegram || 'N/A'],
    ['Twitter', project.socials?.twitter || 'N/A'],
    ['GitHub', project.socials?.github || 'N/A'],
  ].filter(([_, value]) => value !== 'N/A');

  if (socialLinks.length > 0) {
    if (currentY > pageHeight - 150) {
      doc.addPage();
      currentY = 60;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Social Links', 60, currentY);
    currentY += 15;

    autoTable(doc, {
      startY: currentY,
      head: [['Platform', 'Link']],
      body: socialLinks,
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 60, right: 60 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by CFG Ninja Audit Portal - ${formattedDate}`, pageWidth / 2, pageHeight - 20, {
      align: 'center',
    });
  }

  // Return as Blob instead of saving
  return doc.output('blob');
}
