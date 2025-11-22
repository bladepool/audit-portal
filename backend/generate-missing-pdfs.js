/**
 * Generate PDFs only for projects that don't have one yet
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
const TEMPLATE_DATA_JSON_PATH = path.join(CUSTOM_CONTRACT_PATH, 'data.json');

async function generatePDF(project, template) {
  const updatedData = {
    ...template,
    name: project.name,
    symbol: project.symbol || template.symbol,
    address: project.contract_info?.contract_address || template.address,
    Platform: project.platform || template.Platform,
    description: project.description || template.description,
    Url: project.socials?.website || template.Url,
    Telegram: project.socials?.telegram || template.Telegram,
    Twitter: project.socials?.twitter || template.Twitter,
    GitHub: project.socials?.github || template.GitHub,
    SecurityScore: String(project.security_score || template.SecurityScore),
    AuditorScore: String(project.auditor_score || project.security_score || template.AuditorScore),
    
    // Admin notes
    AuditNotesSWC: project.admin_notes?.swc || "",
    AuditNotesTax: project.admin_notes?.tax || "",
    AuditNotesKYC: project.admin_notes?.kyc || "",
    AuditNotesSocial: project.admin_notes?.social || ""
  };
  
  const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
  fs.copyFileSync(TEMPLATE_DATA_JSON_PATH, backupPath);
  fs.writeFileSync(TEMPLATE_DATA_JSON_PATH, JSON.stringify(updatedData, null, 2));
  
  try {
    await execPromise('node pdf.js', {
      cwd: CUSTOM_CONTRACT_PATH,
      timeout: 60000
    });
    
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
      const outputPath = path.join(OUTPUT_PATH, `${project.slug}.pdf`);
      fs.copyFileSync(latestPdf.path, outputPath);
      const stats = fs.statSync(outputPath);
      
      return { success: true, path: outputPath, size: stats.size };
    }
    
    throw new Error('PDF not found');
  } finally {
    fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
    fs.unlinkSync(backupPath);
  }
}

async function generateMissingPDFs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    // Get projects without PDFs
    const projects = await db.collection('projects')
      .find({ 
        published: true,
        'pdf.generated': { $ne: true }
      })
      .sort({ name: 1 })
      .toArray();
    
    console.log(`\n=== Generating PDFs for ${projects.length} projects ===\n`);
    
    const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA_JSON_PATH, 'utf8'));
    
    let successful = 0;
    let failed = 0;
    const errors = [];
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`[${i + 1}/${projects.length}] ${project.name}`);
      
      try {
        const result = await generatePDF(project, template);
        
        if (result.success) {
          const sizeMB = (result.size / 1024 / 1024).toFixed(2);
          console.log(`  ✓ Generated: ${sizeMB} MB\n`);
          successful++;
          
          await db.collection('projects').updateOne(
            { _id: project._id },
            { 
              $set: { 
                'pdf.generated': true,
                'pdf.path': result.path,
                'pdf.size': result.size,
                'pdf.generated_at': new Date()
              }
            }
          );
        }
      } catch (error) {
        console.log(`  ✗ Failed: ${error.message}\n`);
        failed++;
        errors.push({ slug: project.slug, name: project.name, error: error.message });
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${projects.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    if (errors.length > 0) {
      fs.writeFileSync('pdf-generation-errors.json', JSON.stringify(errors, null, 2));
      console.log(`\nErrors saved to: pdf-generation-errors.json`);
    }
    
  } finally {
    await client.close();
  }
}

generateMissingPDFs();
