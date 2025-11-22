const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

/**
 * Generate PDFs for the 50 newly imported projects from Customer Data
 */
async function generatePDFsForImported() {
  console.log('=== Generating PDFs for Newly Imported Projects ===\n');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('auditportal');
  
  // Find projects imported from customer_data_json 
  // These need NEW PDFs generated with current data
  const importedProjects = await db.collection('projects').find({
    'metadata.data_source': 'customer_data_json',
    'contract.address': { $exists: true, $ne: '' }
  }).toArray(); // Generate all enriched projects
  
  console.log(`📊 Found ${importedProjects.length} newly imported projects`);
  console.log(`   All have contract addresses and social links\n`);
  
  if (importedProjects.length === 0) {
    console.log('⚠️  No projects need PDF generation');
    await client.close();
    return;
  }
  
  // Show sample
  console.log('📋 Sample projects to generate:');
  importedProjects.slice(0, 5).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.symbol})`);
    console.log(`      Contract: ${p.contract.address || 'N/A'}`);
    console.log(`      Website: ${p.socials.website || 'N/A'}`);
  });
  
  console.log(`\n❓ Generate PDFs for ${importedProjects.length} projects?`);
  console.log('   Using offline pdf.js system (5-10s per PDF)');
  console.log('   Estimated time: ~${Math.ceil(importedProjects.length * 7 / 60)} minutes\n');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Generate PDFs
  let generated = 0;
  let errors = [];
  const startTime = Date.now();
  
  for (let i = 0; i < importedProjects.length; i++) {
    const project = importedProjects[i];
    const progress = `[${i + 1}/${importedProjects.length}]`;
    
    try {
      console.log(`${progress} Generating: ${project.name}...`);
      
      // Run smart-pdf-bridge.js directly
      const { stdout, stderr } = await execPromise(`node smart-pdf-bridge.js ${project.slug}`, {
        timeout: 120000 // 2 minutes timeout
      });
      
      // Check if PDF was generated (smart-pdf-bridge creates files with -audit-report suffix)
      const pdfPath = path.join(__dirname, 'generated-pdfs', `${project.slug}-audit-report.pdf`);
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF file not found: ${pdfPath}`);
      }
      
      const stats = fs.statSync(pdfPath);
      
      // Update database with PDF info
      await db.collection('projects').updateOne(
        { _id: project._id },
        {
          $set: {
            'pdf.generated': true,
            'pdf.path': pdfPath,
            'pdf.size': stats.size,
            'pdf.generated_at': new Date(),
            'pdf.url': '',
            'pdf.github_hosted': false
          }
        }
      );
      
      generated++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const avgTime = (elapsed / generated).toFixed(1);
      const remaining = Math.ceil((importedProjects.length - generated) * avgTime / 60);
      
      console.log(`   ✅ Generated (${(stats.size / 1024 / 1024).toFixed(2)} MB) - Avg: ${avgTime}s, Remaining: ~${remaining}min\n`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errors.push({
        project: project.name,
        slug: project.slug,
        error: error.message
      });
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`\n✅ PDF Generation Complete!`);
  console.log(`   Generated: ${generated}/${importedProjects.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Total time: ${totalTime} minutes`);
  console.log(`   Average: ${(totalTime * 60 / generated).toFixed(1)} seconds per PDF`);
  
  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, 'pdf-generation-errors-imported.json'),
      JSON.stringify(errors, null, 2)
    );
    console.log(`\n⚠️  Errors saved to: pdf-generation-errors-imported.json`);
  }
  
  // Summary
  const summary = {
    generation_date: new Date().toISOString(),
    projects_total: importedProjects.length,
    pdfs_generated: generated,
    errors: errors.length,
    total_time_minutes: parseFloat(totalTime),
    avg_time_seconds: parseFloat((totalTime * 60 / generated).toFixed(1)),
    next_steps: [
      'Copy PDFs to github-pdfs-repo folder',
      'Git add, commit, and push to GitHub',
      'Run update-github-pdf-urls.js to update database',
      'Review projects and set published=true'
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'pdf-generation-summary-imported.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n📄 Summary saved to: pdf-generation-summary-imported.json`);
  
  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Copy PDFs to GitHub repo folder`);
  console.log(`   2. Push to GitHub`);
  console.log(`   3. Update database with GitHub URLs`);
  console.log(`   4. Review and publish projects`);
  
  await client.close();
}

if (require.main === module) {
  generatePDFsForImported().catch(console.error);
}

module.exports = { generatePDFsForImported };
