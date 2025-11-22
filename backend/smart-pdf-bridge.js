/**
 * Smart PDF Bridge - Uses actual working data.json as template
 * Only updates necessary fields from MongoDB
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const OUTPUT_PATH = 'g:\\auditportal\\backend\\generated-pdfs';
const TEMPLATE_DATA_JSON_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\data.json';

async function generatePDF(slug) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    console.log(`\n=== Generating PDF for: ${slug} ===\n`);
    
    // Get project from MongoDB (don't require published=true for generation)
    const project = await db.collection('projects').findOne({ slug });
    if (!project) {
      console.log(`✗ Project not found: ${slug}`);
      return false;
    }
    
    // Load template data.json (from Pecunity - known working)
    const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA_JSON_PATH, 'utf8'));
    
    // Update only the fields we have from MongoDB
    const updatedData = {
      ...template,
      name: project.name,
      symbol: project.symbol || template.symbol,
      address: project.contract?.address || template.address,
      Platform: project.platform || template.Platform,
      description: project.description || template.description,
      Url: project.socials?.website || template.Url,
      Telegram: project.socials?.telegram || template.Telegram,
      Twitter: project.socials?.twitter || template.Twitter,
      GitHub: project.socials?.github || template.GitHub,
      SecurityScore: String(project.scores?.security || template.SecurityScore),
      AuditorScore: String(project.scores?.auditor || project.scores?.security || template.AuditorScore),
      
      // Update CFG findings if we have them
      ...(project.cfg_findings && Object.keys(project.cfg_findings).length > 0 ? 
        updateCFGFindings(project.cfg_findings, template) : {}),
      
      // Update SWC findings if we have them
      ...(project.swc_findings && Object.keys(project.swc_findings).length > 0 ? 
        updateSWCFindings(project.swc_findings) : {})
    };
    
    // Backup original
    const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
    fs.copyFileSync(TEMPLATE_DATA_JSON_PATH, backupPath);
    
    // Write updated data
    fs.writeFileSync(TEMPLATE_DATA_JSON_PATH, JSON.stringify(updatedData, null, 2));
    console.log('✓ Updated data.json with project data');
    
    // Run pdf.js
    console.log('⏳ Generating PDF...\n');
    const { stdout, stderr } = await execPromise('node pdf.js', {
      cwd: CUSTOM_CONTRACT_PATH,
      timeout: 60000
    });
    
    // Find generated PDF
    const auditsPath = path.join(CUSTOM_CONTRACT_PATH, 'Audits_Temporal');
    const files = fs.readdirSync(auditsPath)
      .filter(f => f.endsWith('.pdf'))
      .map(f => ({
        name: f,
        path: path.join(auditsPath, f),
        time: fs.statSync(path.join(auditsPath, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    const latestPdf = files[0];
    
    if (latestPdf && (Date.now() - latestPdf.time.getTime()) < 120000) {
      // Ensure output directory exists
      if (!fs.existsSync(OUTPUT_PATH)) {
        fs.mkdirSync(OUTPUT_PATH, { recursive: true });
      }
      
      const outputPath = path.join(OUTPUT_PATH, `${slug}-audit-report.pdf`);
      fs.copyFileSync(latestPdf.path, outputPath);
      const stats = fs.statSync(outputPath);
      
      console.log(`\n✅ PDF Generated Successfully!`);
      console.log(`   Source: ${latestPdf.name}`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      // Restore backup
      fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
      fs.unlinkSync(backupPath);
      
      return true;
    } else {
      console.log(`\n✗ PDF not found or too old`);
      return false;
    }
    
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    
    // Restore backup
    const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
      fs.unlinkSync(backupPath);
    }
    
    return false;
  } finally {
    await client.close();
  }
}

function updateCFGFindings(cfgFindings, template) {
  const updates = {};
  Object.entries(cfgFindings).forEach(([key, finding]) => {
    updates[key] = finding.status === "Detected" ? "Fail" : "Pass";
    if (finding.title) updates[`${key}Title`] = finding.title;
    if (finding.description) updates[`${key}Description`] = finding.description;
    if (finding.severity) updates[`${key}Severity`] = finding.severity;
    if (finding.status) updates[`${key}Status`] = finding.status;
    if (finding.location) updates[`${key}Location`] = finding.location;
    if (finding.recommendation) updates[`${key}Recommendation`] = finding.recommendation;
  });
  return updates;
}

function updateSWCFindings(swcFindings) {
  const updates = {};
  Object.entries(swcFindings).forEach(([key, finding]) => {
    updates[key] = finding.status || "Pass";
    updates[`${key}Location`] = finding.location || "L: 0 C: 0";
  });
  return updates;
}

// CLI
const slug = process.argv[2] || 'pecunity';
generatePDF(slug).then(success => {
  process.exit(success ? 0 : 1);
});
