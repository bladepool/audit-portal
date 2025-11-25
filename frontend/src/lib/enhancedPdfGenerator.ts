import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from './types';

// Type definition for autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: any;
  }
}

// Font cache to avoid reloading fonts on every PDF generation
let fontsLoaded = false;

// Load custom fonts into jsPDF
async function loadCustomFonts(doc: jsPDF): Promise<void> {
  if (fontsLoaded) return; // Only load once per session
  
  try {
    // Load RedHatDisplay-Bold (primary font)
    const redHatBoldResponse = await fetch('/pdf-assets/fonts/RedHatDisplay-Bold.ttf');
    const redHatBoldBuffer = await redHatBoldResponse.arrayBuffer();
    const redHatBoldBase64 = btoa(
      new Uint8Array(redHatBoldBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Load Montserrat-SemiBold (secondary font)
    const montserratSemiBoldResponse = await fetch('/pdf-assets/fonts/MONTSERRAT-SEMIBOLD.OTF');
    const montserratSemiBoldBuffer = await montserratSemiBoldResponse.arrayBuffer();
    const montserratSemiBoldBase64 = btoa(
      new Uint8Array(montserratSemiBoldBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Register fonts with jsPDF
    doc.addFileToVFS('RedHatDisplay-Bold.ttf', redHatBoldBase64);
    doc.addFont('RedHatDisplay-Bold.ttf', 'RedHatDisplay', 'bold');
    
    doc.addFileToVFS('MONTSERRAT-SEMIBOLD.OTF', montserratSemiBoldBase64);
    doc.addFont('MONTSERRAT-SEMIBOLD.OTF', 'Montserrat', 'semibold');
    
    fontsLoaded = true;
    console.log('✓ Custom fonts loaded successfully');
  } catch (error) {
    console.warn('Failed to load custom fonts, falling back to default:', error);
    // Continue with default fonts if custom fonts fail to load
  }
}

/**
 * Enhanced PDF Generator with logos, custom fonts, and professional styling
 * Matches the production Node.js PDF generation script
 */

// Icon cache to avoid redundant base64 conversions
const iconCache: Map<string, string | null> = new Map();

// Helper to convert image URL to base64 with caching
async function urlToBase64(url: string): Promise<string | null> {
  // Check cache first
  if (iconCache.has(url)) {
    return iconCache.get(url) || null;
  }
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Cache the result
    iconCache.set(url, base64);
    return base64;
  } catch (error) {
    console.error('Failed to load image:', url, error);
    iconCache.set(url, null); // Cache failures too
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

// Helper to check if there's enough space on page for section header
function checkPageSpace(doc: jsPDF, currentY: number, requiredSpace: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY > pageHeight - requiredSpace) {
    doc.addPage();
    return 60; // Reset to top of new page
  }
  return currentY;
}

// Pre-load all common icons for better performance
async function preloadIcons(): Promise<Record<string, string | null>> {
  const iconPaths = [
    '/pdf-assets/symbols/critical.png',
    '/pdf-assets/symbols/high.png',
    '/pdf-assets/symbols/medium.png',
    '/pdf-assets/symbols/low.png',
    '/pdf-assets/symbols/info.png',
    '/pdf-assets/symbols/pending.png',
    '/pdf-assets/symbols/resolved.png',
    '/pdf-assets/symbols/ack.png',
    '/pdf-assets/symbols/pass4.png',
    '/pdf-assets/symbols/fail4.png'
  ];
  
  const icons: Record<string, string | null> = {};
  await Promise.all(
    iconPaths.map(async (path) => {
      const iconName = path.split('/').pop()?.replace('.png', '') || '';
      icons[iconName] = await urlToBase64(path);
    })
  );
  
  return icons;
}

export async function generateEnhancedAuditPDF(project: Project) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 40;
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docTime = today.toISOString().split('T')[0].replace(/-/g, '');

  // Load custom fonts (cached after first load)
  await loadCustomFonts(doc);

  // Pre-load all icons for better performance
  const icons = await preloadIcons();

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

  // Page 2: Executive Summary
  doc.addPage(); currentY = 60;
  try {
    const badgeLogo = await urlToBase64('/pdf-assets/logos/verified-badge-CFG.png');
    if (badgeLogo) doc.addImage(badgeLogo, 'PNG', 430, 70, 80, 80);
  } catch {}
  
  // Red accent line on right
  doc.setDrawColor(237, 36, 40);
  doc.setLineWidth(6);
  doc.line(pageWidth - 3, 60, pageWidth - 3, 160);
  
  doc.setFontSize(15); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Executive Summary', 60, currentY); currentY += 25;
  
  // Type, Ecosystem, Language row
  doc.setFontSize(10); doc.setTextColor(158, 159, 163); doc.setFont('Montserrat', 'semibold');
  doc.text('TYPES', 62, currentY);
  doc.text('ECOSYSTEM', 202, currentY);
  doc.text('LANGUAGE', 352, currentY);
  currentY += 15;
  
  doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text((project as any).type || 'Token', 62, currentY);
  doc.text(project.platform || 'Binance Smart Chain', 202, currentY);
  doc.text(project.contract_info?.contract_language || 'Solidity', 352, currentY);
  currentY += 30;
  
  // Audit scores section
  doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Audit Scores', 60, currentY); currentY += 20;
  
  const scoreData = [
    ['Owner Score', (project as any).ownerScore?.toString() || '0'],
    ['Social Score', (project as any).socialScore?.toString() || '0'],
    ['Security Score', (project as any).securityScore?.toString() || '0'],
    ['Auditor Score', (project as any).auditorScore?.toString() || '0'],
    ['Overall Score', project.audit_score?.toString() || '0']
  ];
  
  autoTable(doc, {
    startY: currentY,
    body: scoreData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 5 },
    margin: { left: 60, right: 60 }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;
  
  // Audit Confidence
  doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Audit Confidence', 60, currentY); currentY += 15;
  doc.setFontSize(10); doc.setTextColor(60, 60, 60); doc.setFont('Montserrat', 'semibold');
  doc.text(project.audit_confidence || 'Medium', 60, currentY); currentY += 30;
  
  // Issues Classification Table
  doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Issues Classification', 60, currentY); currentY += 20;
  
  // Load severity icons
  const criticalIcon = await urlToBase64('/pdf-assets/symbols/critical.png');
  const highIcon = await urlToBase64('/pdf-assets/symbols/high.png');
  const mediumIcon = await urlToBase64('/pdf-assets/symbols/medium.png');
  const lowIcon = await urlToBase64('/pdf-assets/symbols/low.png');
  const infoIcon = await urlToBase64('/pdf-assets/symbols/info.png');
  
  const classificationData = [
    ['Critical', 'Danger or Potential Problems.'],
    ['High', 'Be Careful or Fail test.'],
    ['Medium', 'Improve is needed.'],
    ['Low', 'Pass, Not-Detected or Safe Item.'],
    ['Informational', 'Function Detected']
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [['Classification', 'Description']],
    body: classificationData,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 370 }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 0) {
        const icons = [criticalIcon, highIcon, mediumIcon, lowIcon, infoIcon];
        const icon = icons[data.row.index];
        if (icon) {
          doc.addImage(icon, 'PNG', data.cell.x + 4, data.cell.y + 12.5, 10, 10);
        }
      }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Page 3: Risk Analysis + Project Info
  doc.addPage(); currentY = 60;
  try {
    const cfgLogo = await urlToBase64('/pdf-assets/logos/CFG-Logo-red-black-FULL.png');
    if (cfgLogo) doc.addImage(cfgLogo, 'PNG', pageWidth - 150, 20, 120, 30);
  } catch {}
  doc.setFontSize(20); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold'); 
  doc.text('RISK ANALYSIS', 60, currentY); currentY += 10;
  doc.setDrawColor(237, 36, 40); doc.setLineWidth(2); doc.line(60, currentY, 160, currentY); currentY += 20;
  
  // Subtitle with project name
  doc.setFontSize(10); doc.setTextColor(158, 159, 163); doc.setFont('Montserrat', 'semibold');
  doc.text(`${project.name}.`, 60, currentY); currentY += 30;
  
  // Project Information with enhanced layout
  doc.setFillColor(239, 246, 255);
  doc.rect(0, currentY - 10, pageWidth, 40, 'F');
  doc.setFontSize(16); doc.setTextColor(29, 78, 216); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Project Information', 60, currentY + 10); currentY += 45;
  
  const projectInfo = [
    ['Project Name', project.name],
    ['Token Symbol', project.symbol],
    ['Decimals', project.decimals?.toString() || 'N/A'],
    ['Total Supply', project.supply || 'N/A'],
    ['Blockchain Platform', project.platform || 'Binance Smart Chain'],
    ['Contract Address', project.contract_info?.contract_address || 'N/A'],
    ['Owner Address', project.ownerAddress || 'N/A'],
    ['Contract Verified', project.contract_info?.contract_verified ? 'Yes \u2713' : 'No'],
    ['Compiler Version', project.contract_info?.contract_compiler || 'N/A'],
    ['License', project.contract_info?.contract_license || 'N/A']
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [['Property', 'Value']],
    body: projectInfo,
    theme: 'striped',
    headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 60, right: 60 },
    columnStyles: {
      0: { cellWidth: 180, fontStyle: 'bold', textColor: [55, 65, 81] },
      1: { cellWidth: 310, textColor: [75, 85, 99] }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;
  if (project.description) {
    doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.text('Description', 60, currentY); currentY += 15;
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    const splitDescription = doc.splitTextToSize(project.description, pageWidth - 120);
    doc.text(splitDescription, 60, currentY); currentY += (splitDescription.length * 12) + 20;
  }
  if (currentY > pageHeight - 200) { doc.addPage(); currentY = 60; }

  // Timeline Section with enhanced formatting
  doc.setFillColor(243, 244, 246);
  doc.rect(0, currentY - 10, pageWidth, 40, 'F');
  doc.setFontSize(16); doc.setTextColor(55, 65, 81); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Audit Timeline', 60, currentY + 10); currentY += 45;
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === '') return 'Pending';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };
  
  const timeline = [
    ['Audit Request', formatDate(project.timeline?.audit_request)],
    ['Onboarding Process', formatDate(project.timeline?.onboarding_process)],
    ['Audit Preview', formatDate(project.timeline?.audit_preview)],
    ['Audit Release', formatDate(project.timeline?.audit_release)]
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [['Milestone', 'Date']],
    body: timeline,
    theme: 'striped',
    headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 60, right: 60 },
    columnStyles: {
      0: { cellWidth: 200, fontStyle: 'bold' },
      1: { cellWidth: 290 }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // KYC Section with enhanced details
  if ((project as any).isKYC || project.kycScore || project.kycURL) {
    if (currentY > pageHeight - 200) { doc.addPage(); currentY = 60; }
    
    doc.setFillColor(236, 253, 245);
    doc.rect(0, currentY - 10, pageWidth, 40, 'F');
    doc.setFontSize(16); doc.setTextColor(21, 128, 61); doc.setFont('RedHatDisplay', 'bold');
    doc.text('✓ KYC Verification', 60, currentY + 10); currentY += 45;
    
    const kycInfo = [
      ['Status', (project as any).isKYC ? 'Verified' : 'Not Verified'],
      ['KYC Vendor', project.kycVendor || 'N/A'],
      ['KYC Score', project.kycScore ? `${project.kycScore}/100` : 'N/A'],
      ['Verification URL', project.kycURL || project.kycUrl || 'N/A'],
    ];
    
    if (project.kycScoreNotes) {
      kycInfo.push(['Notes', project.kycScoreNotes]);
    }
    
    // Load KYC status icon
    const kycIcon = (project as any).isKYC 
      ? await urlToBase64('/pdf-assets/symbols/pass4.png')
      : await urlToBase64('/pdf-assets/symbols/fail4.png');
    
    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Details']],
      body: kycInfo,
      theme: 'grid',
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 60, right: 60 },
      columnStyles: {
        0: { cellWidth: 150, fontStyle: 'bold' },
        1: { cellWidth: 340 }
      },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.row.index === 0 && data.column.index === 1 && kycIcon) {
          doc.addImage(kycIcon, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
        }
      }
    });
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

  // Findings Summary Table with visual header
  doc.setFillColor(254, 242, 242);
  doc.rect(0, currentY - 10, pageWidth, 40, 'F');
  doc.setFontSize(16); doc.setTextColor(220, 38, 38); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Findings Summary', 60, currentY + 10); currentY += 45;
  
  // Use pre-loaded icons for findings summary
  const criticalIconFS = icons.critical;
  const highIconFS = icons.high;
  const mediumIconFS = icons.medium;
  const lowIconFS = icons.low;
  const infoIconFS = icons.info;
  
  const findingsSummary = [
    ['Critical', project.critical?.found || 0, project.critical?.pending || 0, project.critical?.resolved || 0],
    ['High/Major', project.major?.found || 0, project.major?.pending || 0, project.major?.resolved || 0],
    ['Medium', project.medium?.found || 0, project.medium?.pending || 0, project.medium?.resolved || 0],
    ['Low/Minor', project.minor?.found || 0, project.minor?.pending || 0, project.minor?.resolved || 0],
    ['Informational', project.informational?.found || 0, project.informational?.pending || 0, project.informational?.resolved || 0]
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [['Severity', 'Found', 'Pending', 'Resolved']],
    body: findingsSummary,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 0) {
        const icons = [criticalIconFS, highIconFS, mediumIconFS, lowIconFS, infoIconFS];
        const icon = icons[data.row.index];
        if (icon) {
          doc.addImage(icon, 'PNG', data.cell.x + 4, data.cell.y + 8, 10, 10);
        }
      }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Detailed CFG Findings - Group by category and severity
  const activeFindings = (project.cfg_findings || []).filter(f => 
    f.status && !['Pass', 'Not Detected'].includes(f.status)
  );
  
  if (activeFindings.length > 0) {
    if (currentY > pageHeight - 100) { doc.addPage(); currentY = 60; }
    
    // Header with enhanced styling
    doc.setFillColor(254, 242, 242);
    doc.rect(0, currentY - 10, pageWidth, 50, 'F');
    doc.setFontSize(18); doc.setTextColor(220, 38, 38); doc.setFont('RedHatDisplay', 'bold');
    doc.text('Detailed Security Findings', 60, currentY + 15); currentY += 40;
    
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont('Montserrat', 'semibold');
    doc.text(`Total Active Issues: ${activeFindings.length}`, 60, currentY); currentY += 25;
    
    // Group findings by severity for better organization
    const findingsBySeverity = {
      'Critical': activeFindings.filter(f => f.severity === 'Critical'),
      'High': activeFindings.filter(f => f.severity === 'High'),
      'Medium': activeFindings.filter(f => f.severity === 'Medium'),
      'Low': activeFindings.filter(f => f.severity === 'Low'),
      'Informational': activeFindings.filter(f => f.severity === 'Informational')
    };
    
    for (const [severity, findings] of Object.entries(findingsBySeverity)) {
      if (findings.length === 0) continue;
      
      // Severity section header
      if (currentY > pageHeight - 100) { doc.addPage(); currentY = 60; }
      
      const severityColors: Record<string, number[]> = {
        'Critical': [220, 38, 38],
        'High': [249, 115, 22],
        'Medium': [234, 179, 8],
        'Low': [34, 197, 94],
        'Informational': [156, 163, 175]
      };
      const color = severityColors[severity] || [156, 163, 175];
      
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(60, currentY, 150, 20, 3, 3, 'F');
      doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.setFont('RedHatDisplay', 'bold');
      doc.text(`${severity} Issues (${findings.length})`, 70, currentY + 14);
      currentY += 30;
      
      for (const finding of findings) {
      if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
      
      // Priority indicator for Critical/High findings
      const isPriority = severity === 'Critical' || severity === 'High';
      if (isPriority) {
        const priorityColor = severity === 'Critical' ? [220, 38, 38] : [249, 115, 22];
        // Left border highlight
        doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        doc.rect(55, currentY - 5, 4, 90, 'F');
        // Priority badge
        doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        doc.roundedRect(pageWidth - 100, currentY - 3, 35, 14, 2, 2, 'F');
        doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont('RedHatDisplay', 'bold');
        doc.text('URGENT', pageWidth - 92, currentY + 6);
      }
      
      // Finding header with ID and title
      doc.setFontSize(12); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0); 
      doc.text(`${finding.id}: ${finding.title}`, 65, currentY); currentY += 18;
      
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
      doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('RedHatDisplay', 'bold'); 
      doc.text(finding.severity, 70, currentY + 11); currentY += 22;
      
      // Status with icon and Location
      doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.setFont('Montserrat', 'semibold');
      
      // Load and display status icon
      let statusIcon: string | null = null;
      if (finding.status === 'Detected' || finding.status === 'Fail') {
        statusIcon = await urlToBase64('/pdf-assets/symbols/pending.png');
      } else if (finding.status === 'Pass' || finding.status === 'Not Detected') {
        statusIcon = await urlToBase64('/pdf-assets/symbols/resolved.png');
      } else if (finding.status === 'Acknowledge') {
        statusIcon = await urlToBase64('/pdf-assets/symbols/ack.png');
      }
      
      if (statusIcon) {
        doc.addImage(statusIcon, 'PNG', 60, currentY - 3, 10, 10);
        doc.text(`Status: ${finding.status}`, 75, currentY);
      } else {
        doc.text(`Status: ${finding.status}`, 60, currentY);
      }
      
      if (finding.location) doc.text(`Location: ${finding.location}`, 200, currentY);
      if (finding.category) doc.text(`Category: ${finding.category}`, 350, currentY);
      currentY += 15;
      
      // Description
      if (finding.description) { 
        doc.setFontSize(9); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text('Description:', 70, currentY); currentY += 12;
        doc.setFont('Montserrat', 'semibold'); doc.setTextColor(60, 60, 60); 
        const splitDesc = doc.splitTextToSize(finding.description, pageWidth - 140); 
        doc.text(splitDesc, 70, currentY); 
        currentY += (splitDesc.length * 11) + 10; 
      }
      
      // Recommendation
      if (finding.recommendation) { 
        doc.setFontSize(9); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0); 
        doc.text('Recommendation:', 70, currentY); currentY += 12; 
        doc.setFont('Montserrat', 'semibold'); doc.setTextColor(60, 60, 60); 
        const splitRec = doc.splitTextToSize(finding.recommendation, pageWidth - 140); 
        doc.text(splitRec, 70, currentY); 
        currentY += (splitRec.length * 11) + 10; 
      }
      
      // Alleviation/Mitigation
      if (finding.alleviation) { 
        doc.setFontSize(9); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0); 
        doc.text('Mitigation:', 70, currentY); currentY += 12; 
        doc.setFont('Montserrat', 'semibold'); doc.setTextColor(60, 60, 60); 
        const splitMit = doc.splitTextToSize(finding.alleviation, pageWidth - 140); 
        doc.text(splitMit, 70, currentY); 
        currentY += (splitMit.length * 11) + 10; 
      }
      
      // Divider
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.5); 
      doc.line(60, currentY, pageWidth - 60, currentY); currentY += 15;
    }
      
      // Space between severity sections
      currentY += 10;
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

  // Contract Overview with icons and visual header
  if (currentY > pageHeight - 200) { doc.addPage(); currentY = 60; }
  
  doc.setFillColor(240, 249, 255);
  doc.rect(0, currentY - 10, pageWidth, 40, 'F');
  doc.setFontSize(16); doc.setTextColor(30, 58, 138); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Contract Overview', 60, currentY + 10); currentY += 45;
  
  // Load pass/fail icons for contract overview
  const passIconOverview = await urlToBase64('/pdf-assets/symbols/pass4.png');
  const failIconOverview = await urlToBase64('/pdf-assets/symbols/fail4.png');
  
  const contractOverview = [
    ['Honeypot', project.overview?.honeypot ? 'FAIL' : 'PASS'],
    ['Hidden Owner', project.overview?.hidden_owner ? 'FAIL' : 'PASS'],
    ['Mint Function', project.overview?.mint ? 'FAIL' : 'PASS'],
    ['Blacklist', project.overview?.blacklist ? 'WARN' : 'PASS'],
    ['Whitelist', project.overview?.whitelist ? 'PRESENT' : 'NONE'],
    ['Proxy', project.overview?.proxy_check ? 'WARN' : 'PASS'],
    ['Buy Tax', `${project.overview?.buy_tax || 0}%`],
    ['Sell Tax', `${project.overview?.sell_tax || 0}%`]
  ];
  
  autoTable(doc, {
    startY: currentY,
    body: contractOverview,
    theme: 'striped',
    styles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
    columnStyles: {
      0: { cellWidth: 200, fontStyle: 'bold' },
      1: { cellWidth: 290 }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 1) {
        const status = data.cell.text[0];
        if (status === 'PASS' && passIconOverview) {
          doc.addImage(passIconOverview, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
        } else if ((status === 'FAIL' || status === 'WARN') && failIconOverview) {
          doc.addImage(failIconOverview, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
        }
      }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Call Graph Section (from Solidity Metrics)
  if (project.isGraph && project.graph_url) {
    const graphImage = await urlToBase64(project.graph_url);
    if (graphImage) {
      // Check if we need a new page
      if (currentY > pageHeight - 500) {
        doc.addPage();
        currentY = 60;
      }
      
      // Section header with visual styling
      doc.setFillColor(254, 249, 235);
      doc.rect(0, currentY - 10, pageWidth, 40, 'F');
      doc.setFontSize(16);
      doc.setTextColor(146, 64, 14);
      doc.setFont('RedHatDisplay', 'bold');
      doc.text('Call Graph Analysis', 60, currentY + 10);
      currentY += 45;
      
      // Add explanatory text
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('Montserrat', 'semibold');
      doc.text('Generated using Solidity Metrics - Visual representation of function call relationships', 60, currentY);
      currentY += 20;
      
      // Insert graph image
      try {
        const imgWidth = pageWidth - 120;
        const imgHeight = 400;
        doc.addImage(graphImage, 'PNG', 60, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 30;
      } catch (error) {
        console.error('Failed to add graph image:', error);
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text('⚠ Failed to load call graph image', 60, currentY);
        currentY += 20;
      }
    }
  }

  // Inheritance Diagram Section (from Solidity Metrics)
  if (project.isInheritance && project.inheritance_url) {
    const inheritanceImage = await urlToBase64(project.inheritance_url);
    if (inheritanceImage) {
      // Check if we need a new page
      if (currentY > pageHeight - 500) {
        doc.addPage();
        currentY = 60;
      }
      
      // Section header with visual styling
      doc.setFillColor(243, 232, 255);
      doc.rect(0, currentY - 10, pageWidth, 40, 'F');
      doc.setFontSize(16);
      doc.setTextColor(107, 33, 168);
      doc.setFont('RedHatDisplay', 'bold');
      doc.text('Contract Inheritance Diagram', 60, currentY + 10);
      currentY += 45;
      
      // Add explanatory text
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('Montserrat', 'semibold');
      doc.text('Generated using Solidity Metrics - Visual representation of contract inheritance structure', 60, currentY);
      currentY += 20;
      
      // Insert inheritance image
      try {
        const imgWidth = pageWidth - 120;
        const imgHeight = 400;
        doc.addImage(inheritanceImage, 'PNG', 60, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 30;
      } catch (error) {
        console.error('Failed to add inheritance image:', error);
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text('⚠ Failed to load inheritance diagram', 60, currentY);
        currentY += 20;
      }
    }
  }

  // Token Distribution Section with visual header
  if (project.tokenDistribution?.distributions && project.tokenDistribution.distributions.length > 0) {
    if (currentY > pageHeight - 250) { doc.addPage(); currentY = 60; }
    
    doc.setFillColor(236, 253, 245);
    doc.rect(0, currentY - 10, pageWidth, 40, 'F');
    doc.setFontSize(16); doc.setTextColor(21, 128, 61); doc.setFont('RedHatDisplay', 'bold');
    doc.text('Token Distribution', 60, currentY + 10); currentY += 45;
    
    const distributionData = project.tokenDistribution.distributions.map(dist => [
      dist.name,
      dist.amount,
      dist.description || ''
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Amount', 'Description']],
      body: distributionData,
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 60, right: 60 },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: 'bold' },
        1: { cellWidth: 100 },
        2: { cellWidth: 260 }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 20;
    
    // Liquidity Lock Information
    if (project.tokenDistribution.isLiquidityLock) {
      doc.setFontSize(12); doc.setTextColor(34, 197, 94); doc.setFont('RedHatDisplay', 'bold');
      doc.text('✓ Liquidity Locked', 60, currentY); currentY += 15;
      
      doc.setFontSize(9); doc.setTextColor(60, 60, 60); doc.setFont('Montserrat', 'semibold');
      if (project.tokenDistribution.lockLocation) {
        doc.text(`Location: ${project.tokenDistribution.lockLocation}`, 60, currentY); currentY += 12;
      }
      if (project.tokenDistribution.lockAmount) {
        doc.text(`Amount: ${project.tokenDistribution.lockAmount}`, 60, currentY); currentY += 12;
      }
      if (project.tokenDistribution.liquidityLockLink) {
        doc.setTextColor(59, 130, 246);
        doc.text(`View Lock: ${project.tokenDistribution.liquidityLockLink}`, 60, currentY); currentY += 15;
      }
    } else {
      doc.setFontSize(12); doc.setTextColor(239, 68, 68); doc.setFont('RedHatDisplay', 'bold');
      doc.text('⚠ Liquidity Not Locked', 60, currentY); currentY += 15;
    }
    currentY += 15;
  }

  // Social Links - Enhanced with platform icons
  const socialLinks = [
    ['Website', project.socials?.website || 'N/A'], 
    ['Telegram', project.socials?.telegram || 'N/A'], 
    ['Twitter', project.socials?.twitter || 'N/A'], 
    ['GitHub', project.socials?.github || 'N/A']
  ].filter(([_, value]) => value !== 'N/A');
  
  if (socialLinks.length > 0) {
    if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
    
    // Section header with visual styling
    doc.setFillColor(245, 247, 250);
    doc.rect(0, currentY - 10, pageWidth, 40, 'F');
    doc.setFontSize(16); doc.setTextColor(71, 85, 105); doc.setFont('RedHatDisplay', 'bold');
    doc.text('Social & Community Links', 60, currentY + 10); 
    currentY += 45;
    
    // Platform icons mapping
    const platformIcons: Record<string, string> = {
      'Website': '🌐',
      'Telegram': '📱',
      'Twitter': '🐦',
      'GitHub': '⚙️'
    };
    
    // Enhanced table with icons
    autoTable(doc, { 
      startY: currentY, 
      head: [['Platform', 'Link']], 
      body: socialLinks.map(([platform, link]) => [
        `${platformIcons[platform] || '•'} ${platform}`, 
        link
      ]), 
      theme: 'striped',
      headStyles: { 
        fillColor: [71, 85, 105], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 10,
        halign: 'left'
      }, 
      bodyStyles: { 
        fontSize: 8,
        textColor: [60, 60, 60]
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold' },
        1: { cellWidth: 'auto', textColor: [37, 99, 235] }
      },
      margin: { left: 60, right: 60 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Footer with page numbers on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i); 
    doc.setFontSize(8); 
    doc.setTextColor(150, 150, 150);
    // Center footer text
    doc.text(`Generated by CFG Ninja Audit Portal - ${formattedDate}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    // Page number on the right
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 20, { align: 'right' });
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
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Load custom fonts (cached after first load)
  await loadCustomFonts(doc);

  // Pre-load all icons for better performance
  const iconsBlob = await preloadIcons();

  // Front page
  try {
    const frontPageBg = await urlToBase64('/pdf-assets/logos/front9.png');
    if (frontPageBg) {
      doc.addImage(frontPageBg, 'PNG', 0, 0, pageWidth, pageHeight);
    }
  } catch (error) {
    console.error('Failed to load front page background:', error);
  }
  
  doc.setFontSize(27);
  doc.setTextColor(255, 255, 255);
  doc.text(`${project.name} ${capitalize(project.platform || 'Token')}`, 75, 210, { maxWidth: 350 });
  doc.setFontSize(12);
  doc.setTextColor(214, 221, 224);
  doc.text(formattedDate, 75, 300);
  doc.text(`Audit Status: ${project.published ? 'Published' : 'Draft'}`, 75, 320);
  
  const projectLogoFront = await getProjectLogo(project.slug);
  if (projectLogoFront && !projectLogoFront.includes('svg')) {
    try {
      doc.addImage(projectLogoFront, 'PNG', 430, 185, 100, 100, undefined, 'FAST');
    } catch (error) {
      console.error('Failed to add project logo on front page:', error);
    }
  }

  // Page 2: Executive Summary
  doc.addPage();
  let currentY = 60;
  try {
    const badgeLogo = await urlToBase64('/pdf-assets/logos/verified-badge-CFG.png');
    if (badgeLogo) doc.addImage(badgeLogo, 'PNG', 430, 70, 80, 80);
  } catch {}
  
  // Red accent line on right
  doc.setDrawColor(237, 36, 40);
  doc.setLineWidth(6);
  doc.line(pageWidth - 3, 60, pageWidth - 3, 160);
  
  doc.setFontSize(15); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Executive Summary', 60, currentY); currentY += 25;
  
  // Type, Ecosystem, Language row
  doc.setFontSize(10); doc.setTextColor(158, 159, 163); doc.setFont('Montserrat', 'semibold');
  doc.text('TYPES', 62, currentY);
  doc.text('ECOSYSTEM', 202, currentY);
  doc.text('LANGUAGE', 352, currentY);
  currentY += 15;
  
  doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text((project as any).type || 'Token', 62, currentY);
  doc.text(project.platform || 'Binance Smart Chain', 202, currentY);
  doc.text(project.contract_info?.contract_language || 'Solidity', 352, currentY);
  currentY += 30;
  
  // Audit scores section with visual bars
  doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Audit Scores', 60, currentY); currentY += 20;
  
  const scores = [
    { label: 'Owner Score', value: (project as any).ownerScore || 0 },
    { label: 'Social Score', value: (project as any).socialScore || 0 },
    { label: 'Security Score', value: (project as any).securityScore || 0 },
    { label: 'Auditor Score', value: (project as any).auditorScore || 0 },
    { label: 'Overall Score', value: project.audit_score || 0 }
  ];
  
  const scoreBarWidth = 200;
  const scoreBarHeight = 12;
  
  for (const score of scores) {
    // Label
    doc.setFontSize(10); doc.setTextColor(60, 60, 60); doc.setFont('Montserrat', 'semibold');
    doc.text(score.label, 60, currentY);
    
    // Score value
    const scoreColor = score.value >= 75 ? [34, 197, 94] : score.value >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]); doc.setFont('RedHatDisplay', 'bold');
    doc.text(`${score.value}/100`, 180, currentY);
    
    // Background bar
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(1);
    doc.rect(240, currentY - 8, scoreBarWidth, scoreBarHeight);
    
    // Fill bar
    const fillWidth = (score.value / 100) * scoreBarWidth;
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.rect(240, currentY - 8, fillWidth, scoreBarHeight, 'F');
    
    currentY += 20;
  }
  
  currentY += 10;
  
  // Audit Confidence
  doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Audit Confidence', 60, currentY); currentY += 15;
  doc.setFontSize(10); doc.setTextColor(60, 60, 60); doc.setFont('Montserrat', 'semibold');
  doc.text(project.audit_confidence || 'Medium', 60, currentY); currentY += 20;
  
  // Audit Metadata (if available)
  if (project.auditToolVersion || project.auditEdition) {
    doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.setFont('Montserrat', 'semibold');
    if (project.auditToolVersion) {
      doc.text(`Tool Version: ${project.auditToolVersion}`, 60, currentY); currentY += 12;
    }
    if (project.auditEdition) {
      doc.text(`Edition: ${project.auditEdition}`, 60, currentY); currentY += 12;
    }
  }
  
  currentY += 18;

  // Issues Classification Table
  doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Issues Classification', 60, currentY); currentY += 20;

  // Load severity icons
  const criticalIcon = await urlToBase64('/pdf-assets/symbols/critical.png');
  const highIcon = await urlToBase64('/pdf-assets/symbols/high.png');
  const mediumIcon = await urlToBase64('/pdf-assets/symbols/medium.png');
  const lowIcon = await urlToBase64('/pdf-assets/symbols/low.png');
  const infoIcon = await urlToBase64('/pdf-assets/symbols/info.png');

  const classificationData = [
    ['Critical', 'Danger or Potential Problems.'],
    ['High', 'Be Careful or Fail test.'],
    ['Medium', 'Improve is needed.'],
    ['Low', 'Pass, Not-Detected or Safe Item.'],
    ['Informational', 'Function Detected']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Classification', 'Description']],
    body: classificationData,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 60, right: 60 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 370 }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 0) {
        const icons = [criticalIcon, highIcon, mediumIcon, lowIcon, infoIcon];
        const icon = icons[data.row.index];
        if (icon) {
          doc.addImage(icon, 'PNG', data.cell.x + 4, data.cell.y + 12.5, 10, 10);
        }
      }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // GoPlus Risk Assessment
  if (project.overview) {
    if (currentY > pageHeight - 200) { doc.addPage(); currentY = 60; }
    
    doc.setFontSize(12); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
    doc.text('GoPlus Security Assessment', 60, currentY); currentY += 20;

    // Load pass/fail icons
    const passIconBlob = await urlToBase64('/pdf-assets/symbols/pass4.png');
    const failIconBlob = await urlToBase64('/pdf-assets/symbols/fail4.png');

    const riskDataBlob = [
      ['Honeypot', project.overview.honeypot ? 'FAIL' : 'PASS'],
      ['Hidden Owner', project.overview.hidden_owner ? 'FAIL' : 'PASS'],
      ['Trading Cooldown', project.overview.trading_cooldown ? 'FAIL' : 'PASS'],
      ['Mint Function', project.overview.mint ? 'FAIL' : 'PASS'],
      ['Proxy Contract', project.overview.proxy_check ? 'WARN' : 'PASS'],
      ['Blacklist', project.overview.blacklist ? 'WARN' : 'PASS']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Risk Check', 'Status']],
      body: riskDataBlob,
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 60, right: 60 },
      columnStyles: {
        0: { cellWidth: 350 },
        1: { cellWidth: 140 }
      },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 1) {
          const status = data.cell.text[0];
          if (status === 'PASS' && passIconBlob) {
            doc.addImage(passIconBlob, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
          } else if ((status === 'FAIL' || status === 'WARN') && failIconBlob) {
            doc.addImage(failIconBlob, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
          }
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Tax Information
    if (project.overview.buy_tax !== undefined || project.overview.sell_tax !== undefined) {
      doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.setFont('RedHatDisplay', 'bold');
      doc.text('Tax Information', 60, currentY); currentY += 15;
      
      doc.setFontSize(9); doc.setTextColor(60, 60, 60); doc.setFont('Montserrat', 'semibold');
      doc.text(`Buy Tax: ${project.overview.buy_tax || 0}%`, 60, currentY);
      doc.text(`Sell Tax: ${project.overview.sell_tax || 0}%`, 200, currentY);
      currentY += 30;
    }
  }

  // Page 3: Audit Information with header
  doc.addPage();
  currentY = 80;
  doc.setFillColor(26, 35, 126);
  doc.rect(0, 0, pageWidth, 120, 'F');

  // CFG Logo (left side)
  const cfgLogo = await urlToBase64('/pdf-assets/logos/CFG-Logo-red-black-FULL.png');
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
  doc.setFont('RedHatDisplay', 'bold');
  doc.text('SMART CONTRACT AUDIT REPORT', pageWidth / 2, 60, { align: 'center' });

  // Project Logo (right side)
  const projectLogo = await getProjectLogo(project.slug);
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
  doc.setFont('RedHatDisplay', 'bold');
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

  const securityScore = project.securityScore || (project as any).scores?.security || 0;
  const auditorScore = project.auditorScore || (project as any).scores?.auditor || 0;

  // Security Score with visual bar
  doc.setFontSize(12);
  doc.setFont('RedHatDisplay', 'bold');
  doc.text('Security Score:', 60, currentY);
  doc.setFont('Montserrat', 'semibold');
  const secColor = securityScore >= 75 ? [34, 197, 94] : securityScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(secColor[0], secColor[1], secColor[2]);
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
  const fillColor = securityScore >= 75 ? [34, 197, 94] : securityScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.rect(barX, barY, fillWidth, barHeight, 'F');

  currentY += 30;

  // Auditor Score with visual bar
  doc.setTextColor(0, 0, 0);
  doc.setFont('RedHatDisplay', 'bold');
  doc.text('Auditor Score:', 60, currentY);
  doc.setFont('Montserrat', 'semibold');
  const audColor = auditorScore >= 75 ? [34, 197, 94] : auditorScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(audColor[0], audColor[1], audColor[2]);
  doc.text(`${auditorScore}/100`, 160, currentY);

  const auditorFillWidth = (auditorScore / 100) * barWidth;
  doc.setDrawColor(220, 220, 220);
  doc.rect(barX, currentY - 10, barWidth, barHeight);
  const audFillColor = auditorScore >= 75 ? [34, 197, 94] : auditorScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(audFillColor[0], audFillColor[1], audFillColor[2]);
  doc.rect(barX, currentY - 10, auditorFillWidth, barHeight, 'F');

  currentY += 40;

  // Findings Summary
  if (currentY > pageHeight - 250) {
    doc.addPage();
    currentY = 60;
  }

  // Findings Summary with visual header
  doc.setFillColor(254, 242, 242);
  doc.rect(0, currentY - 10, pageWidth, 40, 'F');
  doc.setFontSize(16); doc.setTextColor(220, 38, 38); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Findings Summary', 60, currentY + 10); currentY += 45;

  // Use pre-loaded icons for findings summary in blob
  const criticalIconFSBlob = iconsBlob.critical;
  const highIconFSBlob = iconsBlob.high;
  const mediumIconFSBlob = iconsBlob.medium;
  const lowIconFSBlob = iconsBlob.low;
  const infoIconFSBlob = iconsBlob.info;

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
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 0) {
        const icons = [criticalIconFSBlob, highIconFSBlob, mediumIconFSBlob, lowIconFSBlob, infoIconFSBlob];
        const icon = icons[data.row.index];
        if (icon) {
          doc.addImage(icon, 'PNG', data.cell.x + 4, data.cell.y + 8, 10, 10);
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Detailed CFG Findings - Group by severity (blob function)
  const cfgFindings = project.cfg_findings || [];
  const activeFindingsBlob = cfgFindings.filter((f: any) => 
    f.status && !['Pass', 'Not Detected'].includes(f.status)
  );

  if (activeFindingsBlob.length > 0) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 60;
    }

    // Header with enhanced styling
    doc.setFillColor(254, 242, 242);
    doc.rect(0, currentY - 10, pageWidth, 50, 'F');
    doc.setFontSize(18); doc.setTextColor(220, 38, 38); doc.setFont('RedHatDisplay', 'bold');
    doc.text('Detailed Security Findings', 60, currentY + 15); currentY += 40;
    
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont('Montserrat', 'semibold');
    doc.text(`Total Active Issues: ${activeFindingsBlob.length}`, 60, currentY); currentY += 25;
    
    // Group findings by severity for better organization
    const findingsBySeverityBlob = {
      'Critical': activeFindingsBlob.filter((f: any) => f.severity === 'Critical'),
      'High': activeFindingsBlob.filter((f: any) => f.severity === 'High'),
      'Medium': activeFindingsBlob.filter((f: any) => f.severity === 'Medium'),
      'Low': activeFindingsBlob.filter((f: any) => f.severity === 'Low'),
      'Informational': activeFindingsBlob.filter((f: any) => f.severity === 'Informational')
    };
    
    for (const [severity, findings] of Object.entries(findingsBySeverityBlob)) {
      if (findings.length === 0) continue;
      
      // Severity section header
      if (currentY > pageHeight - 100) { doc.addPage(); currentY = 60; }
      
      const severityColorsBlob: Record<string, number[]> = {
        'Critical': [220, 38, 38],
        'High': [249, 115, 22],
        'Medium': [234, 179, 8],
        'Low': [34, 197, 94],
        'Informational': [156, 163, 175]
      };
      const colorBlob = severityColorsBlob[severity] || [156, 163, 175];
      
      doc.setFillColor(colorBlob[0], colorBlob[1], colorBlob[2]);
      doc.roundedRect(60, currentY, 150, 20, 3, 3, 'F');
      doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.setFont('RedHatDisplay', 'bold');
      doc.text(`${severity} Issues (${findings.length})`, 70, currentY + 14);
      currentY += 30;
      
      for (const finding of findings) {
        if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
        
        // Priority indicator for Critical/High findings
        const isPriorityBlob = severity === 'Critical' || severity === 'High';
        if (isPriorityBlob) {
          const priorityColorBlob = severity === 'Critical' ? [220, 38, 38] : [249, 115, 22];
          // Left border highlight
          doc.setFillColor(priorityColorBlob[0], priorityColorBlob[1], priorityColorBlob[2]);
          doc.rect(55, currentY - 5, 4, 90, 'F');
          // Priority badge
          doc.setFillColor(priorityColorBlob[0], priorityColorBlob[1], priorityColorBlob[2]);
          doc.roundedRect(pageWidth - 100, currentY - 3, 35, 14, 2, 2, 'F');
          doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont('RedHatDisplay', 'bold');
          doc.text('URGENT', pageWidth - 92, currentY + 6);
        }
        
        // Finding header with ID and title
        doc.setFontSize(12); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0); 
        doc.text(`${finding.id}: ${finding.title}`, 65, currentY); currentY += 18;
        
        // Severity badge
        const severityColorsBlob2: Record<string, number[]> = { 
          'Critical': [220, 38, 38], 
          'High': [249, 115, 22], 
          'Medium': [234, 179, 8], 
          'Low': [34, 197, 94], 
          'Informational': [156, 163, 175] 
        };
        const colorBlob2 = severityColorsBlob2[finding.severity] || [156, 163, 175];
        doc.setFillColor(colorBlob2[0], colorBlob2[1], colorBlob2[2]); 
        doc.roundedRect(60, currentY, 80, 16, 3, 3, 'F');
        doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('RedHatDisplay', 'bold'); 
        doc.text(finding.severity, 70, currentY + 11); currentY += 22;
        
        // Status with icon and Location
        doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.setFont('Montserrat', 'semibold');
        
        // Load and display status icon
        let statusIconBlob: string | null = null;
        if (finding.status === 'Detected' || finding.status === 'Fail') {
          statusIconBlob = await urlToBase64('/pdf-assets/symbols/pending.png');
        } else if (finding.status === 'Pass' || finding.status === 'Not Detected') {
          statusIconBlob = await urlToBase64('/pdf-assets/symbols/resolved.png');
        } else if (finding.status === 'Acknowledge') {
          statusIconBlob = await urlToBase64('/pdf-assets/symbols/ack.png');
        }
        
        if (statusIconBlob) {
          doc.addImage(statusIconBlob, 'PNG', 60, currentY - 3, 10, 10);
          doc.text(`Status: ${finding.status}`, 75, currentY);
        } else {
          doc.text(`Status: ${finding.status}`, 60, currentY);
        }
        
        if (finding.location) doc.text(`Location: ${finding.location}`, 200, currentY);
        if (finding.category) doc.text(`Category: ${finding.category}`, 350, currentY);
        currentY += 15;
        
        // Description
        if (finding.description) { 
          doc.setFontSize(9); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0);
          doc.text('Description:', 70, currentY); currentY += 12;
          doc.setFont('Montserrat', 'semibold'); doc.setTextColor(60, 60, 60); 
          const splitDesc = doc.splitTextToSize(finding.description, pageWidth - 140); 
          doc.text(splitDesc, 70, currentY); 
          currentY += (splitDesc.length * 11) + 10; 
        }
        
        // Recommendation
        if (finding.recommendation) { 
          doc.setFontSize(9); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0); 
          doc.text('Recommendation:', 70, currentY); currentY += 12; 
          doc.setFont('Montserrat', 'semibold'); doc.setTextColor(60, 60, 60); 
          const splitRec = doc.splitTextToSize(finding.recommendation, pageWidth - 140); 
          doc.text(splitRec, 70, currentY); 
          currentY += (splitRec.length * 11) + 10; 
        }
        
        // Mitigation
        if (finding.alleviation) { 
          doc.setFontSize(9); doc.setFont('RedHatDisplay', 'bold'); doc.setTextColor(0, 0, 0); 
          doc.text('Mitigation:', 70, currentY); currentY += 12; 
          doc.setFont('Montserrat', 'semibold'); doc.setTextColor(60, 60, 60); 
          const splitMit = doc.splitTextToSize(finding.alleviation, pageWidth - 140); 
          doc.text(splitMit, 70, currentY); 
          currentY += (splitMit.length * 11) + 10; 
        }
        
        // Divider
        doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.5); 
        doc.line(60, currentY, pageWidth - 60, currentY); currentY += 15;
      }
      
      // Space between severity sections
      currentY += 10;
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

  // Contract Overview with icons and visual header
  if (currentY > pageHeight - 200) {
    doc.addPage();
    currentY = 60;
  }

  doc.setFillColor(240, 249, 255);
  doc.rect(0, currentY - 10, pageWidth, 40, 'F');
  doc.setFontSize(16); doc.setTextColor(30, 58, 138); doc.setFont('RedHatDisplay', 'bold');
  doc.text('Contract Overview', 60, currentY + 10); currentY += 45;

  // Load pass/fail icons for contract overview
  const passIconOverviewBlob = await urlToBase64('/pdf-assets/symbols/pass4.png');
  const failIconOverviewBlob = await urlToBase64('/pdf-assets/symbols/fail4.png');

  const contractOverview = [
    ['Honeypot', project.overview?.honeypot ? 'FAIL' : 'PASS'],
    ['Hidden Owner', project.overview?.hidden_owner ? 'FAIL' : 'PASS'],
    ['Mint Function', project.overview?.mint ? 'FAIL' : 'PASS'],
    ['Blacklist', project.overview?.blacklist ? 'WARN' : 'PASS'],
    ['Whitelist', project.overview?.whitelist ? 'PRESENT' : 'NONE'],
    ['Proxy', project.overview?.proxy_check ? 'WARN' : 'PASS'],
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
    columnStyles: {
      0: { cellWidth: 200, fontStyle: 'bold' },
      1: { cellWidth: 290 }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 1) {
        const status = data.cell.text[0];
        if (status === 'PASS' && passIconOverviewBlob) {
          doc.addImage(passIconOverviewBlob, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
        } else if ((status === 'FAIL' || status === 'WARN') && failIconOverviewBlob) {
          doc.addImage(failIconOverviewBlob, 'PNG', data.cell.x + 4, data.cell.y + 8, 12, 12);
        }
      }
    },
    margin: { left: 60, right: 60 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Call Graph Section (from Solidity Metrics) - Blob
  if (project.isGraph && project.graph_url) {
    const graphImageBlob = await urlToBase64(project.graph_url);
    if (graphImageBlob) {
      // Check if we need a new page
      if (currentY > pageHeight - 500) {
        doc.addPage();
        currentY = 60;
      }
      
      // Section header with visual styling
      doc.setFillColor(254, 249, 235);
      doc.rect(0, currentY - 10, pageWidth, 40, 'F');
      doc.setFontSize(16);
      doc.setTextColor(146, 64, 14);
      doc.setFont('RedHatDisplay', 'bold');
      doc.text('Call Graph Analysis', 60, currentY + 10);
      currentY += 45;
      
      // Add explanatory text
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('Montserrat', 'semibold');
      doc.text('Generated using Solidity Metrics - Visual representation of function call relationships', 60, currentY);
      currentY += 20;
      
      // Insert graph image
      try {
        const imgWidth = pageWidth - 120;
        const imgHeight = 400;
        doc.addImage(graphImageBlob, 'PNG', 60, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 30;
      } catch (error) {
        console.error('Failed to add graph image:', error);
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text('\u26a0 Failed to load call graph image', 60, currentY);
        currentY += 20;
      }
    }
  }

  // Inheritance Diagram Section (from Solidity Metrics) - Blob
  if (project.isInheritance && project.inheritance_url) {
    const inheritanceImageBlob = await urlToBase64(project.inheritance_url);
    if (inheritanceImageBlob) {
      // Check if we need a new page
      if (currentY > pageHeight - 500) {
        doc.addPage();
        currentY = 60;
      }
      
      // Section header with visual styling
      doc.setFillColor(243, 232, 255);
      doc.rect(0, currentY - 10, pageWidth, 40, 'F');
      doc.setFontSize(16);
      doc.setTextColor(107, 33, 168);
      doc.setFont('RedHatDisplay', 'bold');
      doc.text('Contract Inheritance Diagram', 60, currentY + 10);
      currentY += 45;
      
      // Add explanatory text
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('Montserrat', 'semibold');
      doc.text('Generated using Solidity Metrics - Visual representation of contract inheritance structure', 60, currentY);
      currentY += 20;
      
      // Insert inheritance image
      try {
        const imgWidth = pageWidth - 120;
        const imgHeight = 400;
        doc.addImage(inheritanceImageBlob, 'PNG', 60, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 30;
      } catch (error) {
        console.error('Failed to add inheritance image:', error);
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text('\u26a0 Failed to load inheritance diagram', 60, currentY);
        currentY += 20;
      }
    }
  }

  // Token Distribution Section in blob with visual header
  if (project.tokenDistribution?.distributions && project.tokenDistribution.distributions.length > 0) {
    if (currentY > pageHeight - 250) { doc.addPage(); currentY = 60; }
    
    doc.setFillColor(236, 253, 245);
    doc.rect(0, currentY - 10, pageWidth, 40, 'F');
    doc.setFontSize(16); doc.setTextColor(21, 128, 61); doc.setFont('RedHatDisplay', 'bold');
    doc.text('Token Distribution', 60, currentY + 10); currentY += 45;
    
    const distributionDataBlob = project.tokenDistribution.distributions.map(dist => [
      dist.name,
      dist.amount,
      dist.description || ''
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Amount', 'Description']],
      body: distributionDataBlob,
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 60, right: 60 },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: 'bold' },
        1: { cellWidth: 100 },
        2: { cellWidth: 260 }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 20;
    
    // Liquidity Lock Information
    if (project.tokenDistribution.isLiquidityLock) {
      doc.setFontSize(12); doc.setTextColor(34, 197, 94); doc.setFont('RedHatDisplay', 'bold');
      doc.text('✓ Liquidity Locked', 60, currentY); currentY += 15;
      
      doc.setFontSize(9); doc.setTextColor(60, 60, 60); doc.setFont('Montserrat', 'semibold');
      if (project.tokenDistribution.lockLocation) {
        doc.text(`Location: ${project.tokenDistribution.lockLocation}`, 60, currentY); currentY += 12;
      }
      if (project.tokenDistribution.lockAmount) {
        doc.text(`Amount: ${project.tokenDistribution.lockAmount}`, 60, currentY); currentY += 12;
      }
      if (project.tokenDistribution.liquidityLockLink) {
        doc.setTextColor(59, 130, 246);
        doc.text(`View Lock: ${project.tokenDistribution.liquidityLockLink}`, 60, currentY); currentY += 15;
      }
    } else {
      doc.setFontSize(12); doc.setTextColor(239, 68, 68); doc.setFont('RedHatDisplay', 'bold');
      doc.text('⚠ Liquidity Not Locked', 60, currentY); currentY += 15;
    }
    currentY += 15;
  }

  // Social Links - Enhanced with platform icons (blob)
  const socialLinksBlob = [
    ['Website', project.socials?.website || 'N/A'], 
    ['Telegram', project.socials?.telegram || 'N/A'], 
    ['Twitter', project.socials?.twitter || 'N/A'], 
    ['GitHub', project.socials?.github || 'N/A']
  ].filter(([_, value]) => value !== 'N/A');
  
  if (socialLinksBlob.length > 0) {
    if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
    
    // Section header with visual styling
    doc.setFillColor(245, 247, 250);
    doc.rect(0, currentY - 10, pageWidth, 40, 'F');
    doc.setFontSize(16); doc.setTextColor(71, 85, 105); doc.setFont('RedHatDisplay', 'bold');
    doc.text('Social & Community Links', 60, currentY + 10); 
    currentY += 45;
    
    // Platform icons mapping
    const platformIconsBlob: Record<string, string> = {
      'Website': '🌐',
      'Telegram': '📱',
      'Twitter': '🐦',
      'GitHub': '⚙️'
    };
    
    // Enhanced table with icons
    autoTable(doc, { 
      startY: currentY, 
      head: [['Platform', 'Link']], 
      body: socialLinksBlob.map(([platform, link]) => [
        `${platformIconsBlob[platform] || '•'} ${platform}`, 
        link
      ]), 
      theme: 'striped',
      headStyles: { 
        fillColor: [71, 85, 105], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 10,
        halign: 'left'
      }, 
      bodyStyles: { 
        fontSize: 8,
        textColor: [60, 60, 60]
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold' },
        1: { cellWidth: 'auto', textColor: [37, 99, 235] }
      },
      margin: { left: 60, right: 60 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Footer with page numbers on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    // Center footer text
    doc.text(`Generated by CFG Ninja Audit Portal - ${formattedDate}`, pageWidth / 2, pageHeight - 20, {
      align: 'center',
    });
    // Page number on the right (skip front page)
    if (i > 1) {
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 20, { align: 'right' });
    }
  }

  // Return as Blob instead of saving
  return doc.output('blob');
}


