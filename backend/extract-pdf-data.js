const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

/**
 * Extract project data from PDF filename and content
 * Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
 */
async function extractProjectDataFromPDFs() {
  console.log('=== Extracting Project Data from PDFs ===\n');
  
  const pdfs = fs.readdirSync(AUDITS_TEMPORAL_PATH)
    .filter(f => f.endsWith('.pdf'))
    .sort();
  
  console.log(`📁 Found ${pdfs.length} PDFs\n`);
  
  const projects = new Map();
  
  // Group PDFs by project (multiple versions)
  pdfs.forEach(pdfFile => {
    const parts = pdfFile.split('_');
    if (parts.length < 4) return;
    
    const dateStr = parts[0]; // YYYYMMDD
    const nameStartIndex = 2;
    const nameParts = [];
    let symbol = '';
    
    for (let i = nameStartIndex; i < parts.length; i++) {
      const part = parts[i];
      if (part === 'Audit.pdf') {
        break;
      } else if (i === parts.length - 2 && parts[i + 1] === 'Audit.pdf') {
        symbol = part;
        break;
      } else {
        nameParts.push(part);
      }
    }
    
    const projectName = nameParts.join(' ').trim();
    const normalizedName = projectName.toLowerCase();
    
    if (!projectName) return;
    
    // Parse date
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const auditDate = `${year}-${month}-${day}`;
    
    if (!projects.has(normalizedName)) {
      projects.set(normalizedName, {
        name: projectName,
        symbol: symbol || projectName.substring(0, 3).toUpperCase(),
        versions: [],
        latestPdf: null,
        latestDate: null
      });
    }
    
    const project = projects.get(normalizedName);
    project.versions.push({
      pdfFile: pdfFile,
      date: auditDate,
      dateStr: dateStr
    });
    
    // Track latest version
    if (!project.latestDate || dateStr > project.latestDate) {
      project.latestDate = dateStr;
      project.latestPdf = pdfFile;
    }
  });
  
  console.log(`📊 Unique projects: ${projects.size}`);
  console.log(`   Multiple versions: ${Array.from(projects.values()).filter(p => p.versions.length > 1).length}`);
  
  // Convert to array and sort
  const projectsArray = Array.from(projects.values())
    .map(p => ({
      name: p.name,
      symbol: p.symbol,
      slug: p.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim(),
      audit_count: p.versions.length,
      first_audit: p.versions[0].date,
      latest_audit: p.versions[p.versions.length - 1].date,
      latest_pdf: p.latestPdf,
      all_pdfs: p.versions.map(v => v.pdfFile),
      
      // Default values that would need to be extracted from PDF content
      platform: 'Binance Smart Chain', // Most common in your audits
      decimals: 18,
      published: false,
      description: `Smart contract audit for ${p.name}`,
      
      // These would be extracted from PDF if we had PDF parsing
      contract: {
        address: null,
        language: 'Solidity',
        verified: true
      },
      
      overview: {
        honeypot: false,
        hidden_owner: false,
        mint: false,
        blacklist: false,
        whitelist: false,
        proxy_check: false
      },
      
      critical: { found: 0, pending: 0, resolved: 0 },
      major: { found: 0, pending: 0, resolved: 0 },
      medium: { found: 0, pending: 0, resolved: 0 },
      minor: { found: 0, pending: 0, resolved: 0 },
      informational: { found: 0, pending: 0, resolved: 0 }
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Save extracted data
  fs.writeFileSync(
    path.join(__dirname, 'extracted-projects-from-pdfs.json'),
    JSON.stringify({
      summary: {
        total_pdfs: pdfs.length,
        unique_projects: projects.size,
        projects_with_multiple_audits: Array.from(projects.values()).filter(p => p.versions.length > 1).length,
        date_range: {
          earliest: projectsArray[0]?.first_audit,
          latest: projectsArray[projectsArray.length - 1]?.latest_audit
        }
      },
      projects: projectsArray
    }, null, 2)
  );
  
  console.log('\n✅ Extracted project data saved to: extracted-projects-from-pdfs.json');
  
  // Show sample
  console.log('\n📋 Sample projects:');
  projectsArray.slice(0, 10).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.symbol})`);
    console.log(`      Audits: ${p.audit_count}, Latest: ${p.latest_audit}`);
    console.log(`      Latest PDF: ${p.latest_pdf}`);
  });
  
  // Show projects with multiple audits
  const multipleAudits = projectsArray.filter(p => p.audit_count > 1);
  console.log(`\n🔄 Projects with multiple audits: ${multipleAudits.length}`);
  multipleAudits.slice(0, 5).forEach(p => {
    console.log(`   - ${p.name}: ${p.audit_count} audits (${p.first_audit} to ${p.latest_audit})`);
  });
  
  console.log('\n💡 Next Steps:');
  console.log('   1. ✅ Extracted basic info (name, symbol, dates) from PDF filenames');
  console.log('   2. ⏳ To get full data (contract address, findings, etc), need to parse PDF content');
  console.log('   3. ⏳ Options: Use pdf-parse or pdfjs-dist library to extract text');
  console.log('   4. ⏳ Or manually update critical fields from data.json when generating each PDF');
  
  return projectsArray;
}

if (require.main === module) {
  extractProjectDataFromPDFs().catch(console.error);
}

module.exports = { extractProjectDataFromPDFs };
