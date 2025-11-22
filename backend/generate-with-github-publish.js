/**
 * Enhanced batch PDF generator with GitHub auto-publish option
 * Generates PDFs and optionally pushes to GitHub repository
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const readline = require('readline');

const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const OUTPUT_PATH = 'g:\\auditportal\\backend\\generated-pdfs';
const GITHUB_REPO_PATH = 'g:\\auditportal\\backend\\github-pdfs-repo';
const TEMPLATE_DATA_JSON_PATH = path.join(CUSTOM_CONTRACT_PATH, 'data.json');

const GITHUB_REPO_URL = 'https://github.com/CFG-NINJA/audits.git';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/CFG-NINJA/audits/main';

// Progress tracking
let progressState = {
  phase: '',
  current: 0,
  total: 0,
  currentProject: '',
  errors: []
};

function updateProgress(phase, current, total, currentProject = '') {
  progressState = { phase, current, total, currentProject, errors: progressState.errors };
  
  // Clear line and print progress
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  
  const percentage = total > 0 ? ((current / total) * 100).toFixed(1) : 0;
  const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
  
  process.stdout.write(`[${phase}] ${bar} ${percentage}% (${current}/${total}) ${currentProject}`);
}

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

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function publishToGitHub(pdfCount) {
  console.log('\n\n=== Publishing to GitHub ===\n');
  
  // Ensure GitHub repo directory exists
  if (!fs.existsSync(GITHUB_REPO_PATH)) {
    console.log('⚠️  GitHub repository directory not found. Creating...\n');
    fs.mkdirSync(GITHUB_REPO_PATH, { recursive: true });
    
    process.chdir(GITHUB_REPO_PATH);
    await execPromise('git init');
    await execPromise('git branch -M main');
    await execPromise(`git remote add origin ${GITHUB_REPO_URL}`);
  }
  
  updateProgress('GITHUB-COPY', 0, pdfCount, 'Copying PDFs to GitHub repo...');
  
  // Copy all PDFs to GitHub repo
  const pdfFiles = fs.readdirSync(OUTPUT_PATH).filter(f => f.endsWith('.pdf'));
  let copied = 0;
  
  for (const pdf of pdfFiles) {
    fs.copyFileSync(
      path.join(OUTPUT_PATH, pdf),
      path.join(GITHUB_REPO_PATH, pdf)
    );
    copied++;
    updateProgress('GITHUB-COPY', copied, pdfCount, pdf);
  }
  
  console.log('\n✓ PDFs copied to GitHub repository\n');
  
  updateProgress('GITHUB-COMMIT', 1, 3, 'Adding files...');
  process.chdir(GITHUB_REPO_PATH);
  await execPromise('git add *.pdf');
  
  updateProgress('GITHUB-COMMIT', 2, 3, 'Committing...');
  const commitMessage = `Update PDFs: ${new Date().toISOString().split('T')[0]} (${pdfCount} files)`;
  await execPromise(`git commit -m "${commitMessage}"`, { cwd: GITHUB_REPO_PATH });
  
  updateProgress('GITHUB-COMMIT', 3, 3, 'Committed');
  console.log('\n✓ Changes committed\n');
  
  updateProgress('GITHUB-PUSH', 0, 100, 'Pushing to GitHub...');
  
  // Push with progress (this will take time for large uploads)
  const pushProcess = exec('git push origin main --force', { cwd: GITHUB_REPO_PATH });
  
  let lastProgress = 0;
  pushProcess.stderr.on('data', (data) => {
    const match = data.toString().match(/(\d+)%/);
    if (match) {
      const progress = parseInt(match[1]);
      if (progress > lastProgress) {
        lastProgress = progress;
        updateProgress('GITHUB-PUSH', progress, 100, `${progress}%`);
      }
    }
  });
  
  await new Promise((resolve, reject) => {
    pushProcess.on('close', (code) => {
      if (code === 0) {
        updateProgress('GITHUB-PUSH', 100, 100, 'Complete!');
        console.log('\n✓ Successfully pushed to GitHub\n');
        resolve();
      } else {
        reject(new Error(`Push failed with code ${code}`));
      }
    });
  });
}

async function updateDatabaseWithGitHubUrls(db) {
  console.log('\n=== Updating Database with GitHub URLs ===\n');
  
  const pdfFiles = fs.readdirSync(OUTPUT_PATH).filter(f => f.endsWith('.pdf'));
  
  updateProgress('DB-UPDATE', 0, pdfFiles.length, 'Updating project records...');
  
  let updated = 0;
  for (const pdfFile of pdfFiles) {
    const slug = path.basename(pdfFile, '.pdf');
    const githubUrl = `${GITHUB_RAW_BASE}/${pdfFile}`;
    
    await db.collection('projects').updateOne(
      { slug: slug },
      { 
        $set: { 
          'pdf.url': githubUrl,
          'pdf.github_hosted': true,
          'pdf.updated_at': new Date()
        }
      }
    );
    
    updated++;
    updateProgress('DB-UPDATE', updated, pdfFiles.length, slug);
  }
  
  console.log(`\n✓ Updated ${updated} project records\n`);
}

async function enhancedBatchGenerate() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   Enhanced PDF Generator with GitHub Publishing   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    // Ask for generation mode
    console.log('Select generation mode:');
    console.log('  1. Generate missing PDFs only');
    console.log('  2. Regenerate all PDFs');
    console.log('  3. Test mode (5 projects)\n');
    
    const mode = await promptUser('Enter choice (1-3): ');
    
    let query = { published: true };
    let limit = null;
    
    if (mode === '1') {
      query['pdf.generated'] = { $ne: true };
    } else if (mode === '3') {
      limit = 5;
    }
    
    const projectsQuery = db.collection('projects').find(query).sort({ name: 1 });
    if (limit) projectsQuery.limit(limit);
    
    const projects = await projectsQuery.toArray();
    
    console.log(`\nFound ${projects.length} projects to process\n`);
    
    // Ask about GitHub publishing
    const publishToGitHubChoice = await promptUser('Publish to GitHub after generation? (y/n): ');
    const shouldPublishToGitHub = publishToGitHubChoice === 'y' || publishToGitHubChoice === 'yes';
    
    if (shouldPublishToGitHub) {
      console.log('✓ Will publish to GitHub after generation\n');
    }
    
    console.log('Starting generation...\n');
    
    // Ensure output directory
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }
    
    const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA_JSON_PATH, 'utf8'));
    
    let successful = 0;
    let failed = 0;
    const errors = [];
    const startTime = Date.now();
    
    // Generate PDFs
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      updateProgress('GENERATE', i + 1, projects.length, project.name);
      
      try {
        const result = await generatePDF(project, template);
        
        if (result.success) {
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
        failed++;
        errors.push({ slug: project.slug, name: project.name, error: error.message });
        progressState.errors.push(`${project.name}: ${error.message}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n\n=== PDF Generation Summary ===');
    console.log(`Total: ${projects.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${duration} minutes\n`);
    
    if (errors.length > 0) {
      fs.writeFileSync('pdf-generation-errors.json', JSON.stringify(errors, null, 2));
      console.log(`Errors saved to: pdf-generation-errors.json\n`);
    }
    
    // GitHub publishing
    if (shouldPublishToGitHub && successful > 0) {
      await publishToGitHub(successful);
      await updateDatabaseWithGitHubUrls(db);
      
      console.log('\n✅ All done! PDFs are now live on GitHub CDN\n');
      console.log(`Example URL: ${GITHUB_RAW_BASE}/pecunity.pdf\n`);
    } else {
      console.log('\n✅ Generation complete!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run
enhancedBatchGenerate().catch(console.error);
