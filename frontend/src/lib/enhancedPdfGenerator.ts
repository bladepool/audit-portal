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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 40;
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const docTime = today.toISOString().split('T')[0].replace(/-/g, '');

  // Load CFG Ninja front page background
  try {
    const frontPageBg = await urlToBase64('/pdf-assets/logos/front9.png');
    if (frontPageBg) {
      doc.addImage(frontPageBg, 'PNG', 0, 0, pageWidth, pageHeight);
    }
  } catch (error) {
    console.warn('Could not load front page background');
  }

  // Add project name and type on front page
  doc.setFontSize(27);
  doc.setTextColor(255, 255, 255);
  doc.text(`${project.name} ${capitalize(project.platform || 'Token')}`, 75, 210, {
    maxWidth: 350
  });

  // Add date
  doc.setFontSize(12);
  doc.setTextColor(214, 221, 224);
  doc.text(formattedDate, 75, 300);

  // Add audit status
  doc.text(`Audit Status: ${project.published ? 'Published' : 'Draft'}`, 75, 320);

  // Try to load and add project logo
  const projectLogo = await getProjectLogo(project.slug);
  if (projectLogo && !projectLogo.includes('svg')) {
    try {
      doc.addImage(projectLogo, 'PNG', 430, 185, 100, 100, undefined, 'FAST');
    } catch (error) {
      console.warn('Could not add project logo to front page');
    }
  }

  // ============================================
  // PAGE 2: RISK ANALYSIS SUMMARY
  // ============================================
  doc.addPage();
  currentY = 60;

  // Add CFG Ninja logo at top
  try {
    const cfgLogo = await urlToBase64('/pdf-assets/logos/CFG-Logo-red-black-FULL.png');
    if (cfgLogo) {
      doc.addImage(cfgLogo, 'PNG', pageWidth - 150, 20, 120, 30);
    }
  } catch (error) {
    console.warn('Could not load CFG logo');
  }

  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text('RISK ANALYSIS', 60, currentY);
  currentY += 10;

  // Draw red underline
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(2);
  doc.line(60, currentY, 160, currentY);
  currentY += 30;

  // Project Information Table
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Project Information', 60, currentY);
  currentY += 10;

  const projectInfo = [
    ['Name', project.name],
    ['Symbol', project.symbol],
    ['Decimals', project.decimals.toString()],
    ['Total Supply', project.supply],
    ['Platform', project.platform || 'Binance Smart Chain'],
    ['Contract Address', project.contract_info?.contract_address || 'N/A'],
    ['Compiler', project.contract_info?.contract_compiler || 'N/A'],
    ['License', project.contract_info?.contract_license || 'N/A']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Property', 'Value']],
    body: projectInfo,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    margin: { left: 60, right: 60 },
    tableWidth: 'auto'
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Description
  if (project.description) {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Description', 60, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitDescription = doc.splitTextToSize(project.description, pageWidth - 120);
    doc.text(splitDescription, 60, currentY);
    currentY += (splitDescription.length * 12) + 20;
  }

  // Check if we need a new page
  if (currentY > pageHeight - 150) {
    doc.addPage();
    currentY = 60;
  }

  // ============================================
  // AUDIT SCORE - Large Display
  // ============================================
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Audit Score', 60, currentY);
  currentY += 30;

  const score = project.audit_score || 0;
  const scoreColor = score >= 75 ? [34, 197, 94] : score >= 50 ? [234, 179, 8] : [239, 68, 68];

  // Draw score circle/box
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.circle(pageWidth / 2, currentY + 30, 50, 'F');

  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  const scoreText = score.toString();
  const scoreWidth = doc.getTextWidth(scoreText);
  doc.text(scoreText, (pageWidth - scoreWidth) / 2, currentY + 40);

  currentY += 90;

  // Confidence Level
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const confidenceText = `Confidence: ${project.audit_confidence || 'Medium'}`;
  const confWidth = doc.getTextWidth(confidenceText);
  doc.text(confidenceText, (pageWidth - confWidth) / 2, currentY);
  currentY += 40;

  // ============================================
  // FINDINGS SUMMARY TABLE
  // ============================================
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Findings Summary', 60, currentY);
  currentY += 15;

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
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    margin: { left: 60, right: 60 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // ============================================
  // DETAILED FINDINGS
  // ============================================
  if (project.cfg_findings && project.cfg_findings.length > 0) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 60;
    }

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Detailed Findings', 60, currentY);
    currentY += 10;

    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(2);
    doc.line(60, currentY, 200, currentY);
    currentY += 25;

    for (const finding of project.cfg_findings) {
      // Check if we need a new page
      if (currentY > pageHeight - 150) {
        doc.addPage();
        currentY = 60;
      }

      // Finding ID and Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${finding.id}: ${finding.title}`, 60, currentY);
      currentY += 18;

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
      
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.severity, 70, currentY + 11);
      currentY += 22;

      // Status and Location
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${finding.status}`, 60, currentY);
      if (finding.location) {
        doc.text(`Location: ${finding.location}`, 200, currentY);
      }
      currentY += 15;

      // Description
      if (finding.description) {
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const splitDesc = doc.splitTextToSize(finding.description, pageWidth - 140);
        doc.text(splitDesc, 70, currentY);
        currentY += (splitDesc.length * 11) + 10;
      }

      // Recommendation
      if (finding.recommendation) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Recommendation:', 70, currentY);
        currentY += 12;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const splitRec = doc.splitTextToSize(finding.recommendation, pageWidth - 140);
        doc.text(splitRec, 70, currentY);
        currentY += (splitRec.length * 11) + 20;
      }

      // Separator line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(60, currentY, pageWidth - 60, currentY);
      currentY += 15;
    }
  }

  // ============================================
  // CONTRACT OVERVIEW
  // ============================================
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
    ['Sell Tax', `${project.overview?.sell_tax || 0}%`]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Check', 'Result']],
    body: contractOverview,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    margin: { left: 60, right: 60 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // ============================================
  // SOCIAL LINKS
  // ============================================
  const socialLinks = [
    ['Website', project.socials?.website || 'N/A'],
    ['Telegram', project.socials?.telegram || 'N/A'],
    ['Twitter', project.socials?.twitter || 'N/A'],
    ['GitHub', project.socials?.github || 'N/A']
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
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 8
      },
      margin: { left: 60, right: 60 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // ============================================
  // FOOTER ON ALL PAGES
  // ============================================
  const pageCount = (doc as any).internal.getNumberOfPages();
  
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by CFG Ninja Audit Portal - ${formattedDate}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${docTime}_CFGNINJA_${project.slug}_Audit.pdf`);
}
