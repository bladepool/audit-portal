/**
 * Batch PDF Generator - Generate PDFs for all published projects
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

async function generateProjectPDF(project, template) {
  try {
    console.log(`\n[${project.slug}] ${project.name}`);
    
    // Update template with project data
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
      
      // Add admin notes if available (not exposed publicly)
      AuditNotesSWC: project.admin_notes?.swc || template.AuditNotesSWC || "",
      AuditNotesTax: project.admin_notes?.tax || template.AuditNotesTax || "",
      AuditNotesKYC: project.admin_notes?.kyc || template.AuditNotesKYC || "",
      AuditNotesSocial: project.admin_notes?.social || template.AuditNotesSocial || "",
      
      // Update CFG findings
      ...(project.cfg_findings && Object.keys(project.cfg_findings).length > 0 ? 
        updateCFGFindings(project.cfg_findings) : {}),
      
      // Update SWC findings
      ...(project.swc_findings && Object.keys(project.swc_findings).length > 0 ? 
        updateSWCFindings(project.swc_findings) : {})
    };
    
    // Backup and write
    const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
    fs.copyFileSync(TEMPLATE_DATA_JSON_PATH, backupPath);
    fs.writeFileSync(TEMPLATE_DATA_JSON_PATH, JSON.stringify(updatedData, null, 2));
    
    // Generate PDF
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
      const outputPath = path.join(OUTPUT_PATH, `${project.slug}.pdf`);
      fs.copyFileSync(latestPdf.path, outputPath);
      const stats = fs.statSync(outputPath);
      
      // Restore backup
      fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
      fs.unlinkSync(backupPath);
      
      console.log(`  ✓ Generated: ${(stats.size / 1024).toFixed(0)} KB`);
      return { success: true, size: stats.size, path: outputPath };
    } else {
      // Restore backup
      fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
      fs.unlinkSync(backupPath);
      
      console.log(`  ✗ Failed: PDF not found`);
      return { success: false, error: 'PDF not found' };
    }
    
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    
    // Restore backup
    const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
      fs.unlinkSync(backupPath);
    }
    
    return { success: false, error: error.message };
  }
}

function updateCFGFindings(cfgFindings) {
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

async function batchGenerate() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    console.log('=== Batch PDF Generator ===\n');
    
    // Ensure output directory
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }
    
    // Load template
    const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA_JSON_PATH, 'utf8'));
    console.log('✓ Loaded template from data.json\n');
    
    // Get all published projects
    const projects = await db.collection('projects')
      .find({ published: true })
      .sort({ name: 1 })
      .toArray();
    
    console.log(`Found ${projects.length} published projects\n`);
    console.log('Starting batch generation...\n');
    
    const results = {
      total: projects.length,
      successful: 0,
      failed: 0,
      totalSize: 0,
      errors: []
    };
    
    const startTime = Date.now();
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`[${i + 1}/${projects.length}]`, end='');
      
      const result = await generateProjectPDF(project, template);
      
      if (result.success) {
        results.successful++;
        results.totalSize += result.size;
        
        // Update database with PDF path
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
      } else {
        results.failed++;
        results.errors.push({
          slug: project.slug,
          name: project.name,
          error: result.error
        });
      }
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n\n=== Batch Generation Complete ===\n');
    console.log(`✓ Successful: ${results.successful}/${results.total}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`Total Size: ${(results.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Duration: ${duration} minutes`);
    console.log(`Average: ${(results.total / parseFloat(duration)).toFixed(1)} PDFs/min`);
    
    if (results.errors.length > 0) {
      console.log(`\n=== Failed Projects ===\n`);
      results.errors.forEach(err => {
        console.log(`  ${err.slug}: ${err.error}`);
      });
    }
    
    // Save summary
    fs.writeFileSync(
      path.join(OUTPUT_PATH, '_batch_summary.json'),
      JSON.stringify(results, null, 2)
    );
    console.log(`\n✓ Saved summary to _batch_summary.json`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// CLI
const mode = process.argv[2];

if (mode === 'test') {
  // Test mode: generate for first 5 projects
  (async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('auditportal');
    
    const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA_JSON_PATH, 'utf8'));
    const projects = await db.collection('projects')
      .find({ published: true })
      .limit(5)
      .toArray();
    
    console.log('=== Test Mode: 5 Projects ===\n');
    
    for (const project of projects) {
      await generateProjectPDF(project, template);
    }
    
    await client.close();
  })();
} else {
  // Full batch mode
  batchGenerate();
}
