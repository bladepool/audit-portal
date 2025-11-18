'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Project } from '@/lib/types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const CFG_LOGO_URL = 'https://audit.cfg.ninja/logo.svg';

export async function generateAuditPDF(project: Project) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (currentY + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  // Helper to add section title
  const addSectionTitle = (title: string) => {
    checkPageBreak(15);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(239, 68, 68); // Red color
    pdf.text(title, 20, currentY);
    currentY += 10;
  };

  // Add Header with Logo
  try {
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Security Audit Report', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(project.name, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
  } catch (error) {
    console.error('Error adding header:', error);
  }

  // Project Information
  addSectionTitle('Project Information');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);

  const projectInfo = [
    ['Name', project.name],
    ['Symbol', project.symbol],
    ['Decimals', project.decimals.toString()],
    ['Supply', project.supply],
    ['Platform', project.platform || 'N/A'],
    ['Contract Address', project.contract_info?.contract_address || 'N/A'],
  ];

  pdf.autoTable({
    startY: currentY,
    head: [['Field', 'Value']],
    body: projectInfo,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 },
  });

  currentY = pdf.lastAutoTable.finalY + 10;

  // Description
  if (project.description) {
    checkPageBreak(30);
    addSectionTitle('Description');
    pdf.setFontSize(10);
    const splitDescription = pdf.splitTextToSize(project.description, pageWidth - 40);
    pdf.text(splitDescription, 20, currentY);
    currentY += (splitDescription.length * 5) + 10;
  }

  // Audit Score
  checkPageBreak(40);
  addSectionTitle('Audit Score');
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  const scoreColor = project.audit_score >= 75 ? [34, 197, 94] : project.audit_score >= 50 ? [234, 179, 8] : [239, 68, 68];
  pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.text(project.audit_score.toString(), pageWidth / 2, currentY + 10, { align: 'center' });
  currentY += 20;

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Confidence: ${project.audit_confidence || 'Medium'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Findings Summary
  checkPageBreak(60);
  addSectionTitle('Findings Summary');

  const findingsSummary = [
    [
      'Critical',
      (project.critical?.found || 0).toString(),
      (project.critical?.pending || 0).toString(),
      (project.critical?.resolved || 0).toString(),
    ],
    [
      'Major',
      (project.major?.found || 0).toString(),
      (project.major?.pending || 0).toString(),
      (project.major?.resolved || 0).toString(),
    ],
    [
      'Medium',
      (project.medium?.found || 0).toString(),
      (project.medium?.pending || 0).toString(),
      (project.medium?.resolved || 0).toString(),
    ],
    [
      'Minor',
      (project.minor?.found || 0).toString(),
      (project.minor?.pending || 0).toString(),
      (project.minor?.resolved || 0).toString(),
    ],
    [
      'Informational',
      (project.informational?.found || 0).toString(),
      (project.informational?.pending || 0).toString(),
      (project.informational?.resolved || 0).toString(),
    ],
  ];

  pdf.autoTable({
    startY: currentY,
    head: [['Severity', 'Found', 'Pending', 'Resolved']],
    body: findingsSummary,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 },
  });

  currentY = pdf.lastAutoTable.finalY + 10;

  // CFG Findings
  if (project.cfg_findings && project.cfg_findings.length > 0) {
    checkPageBreak(30);
    addSectionTitle('Detailed Findings');

    project.cfg_findings.forEach((finding: any, index: number) => {
      checkPageBreak(50);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${finding.id}: ${finding.title}`, 20, currentY);
      currentY += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Severity badge
      const severityColor = 
        finding.severity === 'Critical' ? [220, 38, 38] :
        finding.severity === 'High' ? [239, 68, 68] :
        finding.severity === 'Medium' ? [234, 179, 8] :
        finding.severity === 'Low' ? [34, 197, 94] :
        [156, 163, 175];

      pdf.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(20, currentY - 4, 25, 6, 'F');
      pdf.text(finding.severity, 32.5, currentY, { align: 'center' });
      currentY += 8;

      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', 20, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(finding.status || 'N/A', 40, currentY);
      currentY += 6;

      if (finding.location) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Location:', 20, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(finding.location, 45, currentY);
        currentY += 6;
      }

      if (finding.description) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Description:', 20, currentY);
        currentY += 5;
        pdf.setFont('helvetica', 'normal');
        const splitDesc = pdf.splitTextToSize(finding.description, pageWidth - 45);
        pdf.text(splitDesc, 25, currentY);
        currentY += (splitDesc.length * 5) + 3;
      }

      if (finding.recommendation) {
        checkPageBreak(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recommendation:', 20, currentY);
        currentY += 5;
        pdf.setFont('helvetica', 'normal');
        const splitRec = pdf.splitTextToSize(finding.recommendation, pageWidth - 45);
        pdf.text(splitRec, 25, currentY);
        currentY += (splitRec.length * 5) + 3;
      }

      currentY += 5;
    });
  }

  // Contract Overview
  checkPageBreak(40);
  addSectionTitle('Contract Overview');

  const overviewData = [
    ['Honeypot', project.overview?.honeypot ? 'Yes' : 'No'],
    ['Hidden Owner', project.overview?.hidden_owner ? 'Yes' : 'No'],
    ['Mint Function', project.overview?.mint ? 'Yes' : 'No'],
    ['Blacklist', project.overview?.blacklist ? 'Yes' : 'No'],
    ['Whitelist', project.overview?.whitelist ? 'Yes' : 'No'],
    ['Proxy', project.overview?.proxy_check ? 'Yes' : 'No'],
    ['Buy Tax', `${project.overview?.buy_tax || 0}%`],
    ['Sell Tax', `${project.overview?.sell_tax || 0}%`],
  ];

  pdf.autoTable({
    startY: currentY,
    head: [['Check', 'Status']],
    body: overviewData,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 },
  });

  currentY = pdf.lastAutoTable.finalY + 10;

  // Social Links
  if (project.socials) {
    checkPageBreak(40);
    addSectionTitle('Social Links');

    const socialData = [];
    if (project.socials.website) socialData.push(['Website', project.socials.website]);
    if (project.socials.telegram) socialData.push(['Telegram', project.socials.telegram]);
    if (project.socials.twitter) socialData.push(['Twitter', project.socials.twitter]);
    if (project.socials.github) socialData.push(['GitHub', project.socials.github]);

    if (socialData.length > 0) {
      pdf.autoTable({
        startY: currentY,
        head: [['Platform', 'Link']],
        body: socialData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
      });
      currentY = pdf.lastAutoTable.finalY + 10;
    }
  }

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Generated by CFG Ninja Audit Portal', pageWidth / 2, pageHeight - 10, { align: 'center' });
  pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save PDF
  pdf.save(`${project.slug}_audit_report.pdf`);
}
