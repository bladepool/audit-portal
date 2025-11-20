/**
 * API endpoint for PDF generation with optional GitHub upload
 * POST /api/admin/generate-pdf
 */

const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Check if we're in production or local environment
const isProd = process.env.NODE_ENV === 'production';
const CUSTOM_CONTRACT_PATH = process.env.PDF_GENERATION_PATH || 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const OUTPUT_PATH = path.join(__dirname, '../../generated-pdfs');
const GITHUB_REPO_PATH = process.env.GITHUB_REPO_PATH || 'g:\\auditportal\\backend\\github-pdfs-repo';
const TEMPLATE_DATA_JSON_PATH = path.join(CUSTOM_CONTRACT_PATH, 'data.json');

const GITHUB_REPO_URL = 'https://github.com/CFG-NINJA/audits.git';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/CFG-NINJA/audits/main';

// Check if PDF generation is available
const PDF_GENERATION_AVAILABLE = fs.existsSync(CUSTOM_CONTRACT_PATH) && fs.existsSync(TEMPLATE_DATA_JSON_PATH);

if (isProd && !PDF_GENERATION_AVAILABLE) {
  console.warn('⚠️  PDF generation not available in production environment');
  console.warn('   Set PDF_GENERATION_PATH environment variable to enable');
}

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedDb = client.db('auditportal');
  return cachedDb;
}

async function generatePDF(project) {
  const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA_JSON_PATH, 'utf8'));
  
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
      if (!fs.existsSync(OUTPUT_PATH)) {
        fs.mkdirSync(OUTPUT_PATH, { recursive: true });
      }
      
      const outputPath = path.join(OUTPUT_PATH, `${project.slug}.pdf`);
      fs.copyFileSync(latestPdf.path, outputPath);
      
      return { success: true, path: outputPath };
    }
    
    throw new Error('PDF not found after generation');
  } finally {
    fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
    fs.unlinkSync(backupPath);
  }
}

async function uploadToGitHub(slug, pdfPath) {
  // Ensure GitHub repo exists
  if (!fs.existsSync(GITHUB_REPO_PATH)) {
    fs.mkdirSync(GITHUB_REPO_PATH, { recursive: true });
    process.chdir(GITHUB_REPO_PATH);
    await execPromise('git init');
    await execPromise('git branch -M main');
    await execPromise(`git remote add origin ${GITHUB_REPO_URL}`);
  }
  
  // Copy PDF to GitHub repo
  const githubPdfPath = path.join(GITHUB_REPO_PATH, `${slug}.pdf`);
  fs.copyFileSync(pdfPath, githubPdfPath);
  
  // Git operations
  process.chdir(GITHUB_REPO_PATH);
  await execPromise(`git add ${slug}.pdf`);
  await execPromise(`git commit -m "Update PDF: ${slug}"`);
  await execPromise('git push origin main');
  
  return `${GITHUB_RAW_BASE}/${slug}.pdf`;
}

/**
 * Generate PDF with optional GitHub upload
 * POST /api/admin/generate-pdf
 * Body: { projectId: string, uploadToGitHub?: boolean }
 */
router.post('/generate-pdf', async (req, res) => {
  try {
    // Check if PDF generation is available
    if (!PDF_GENERATION_AVAILABLE) {
      return res.status(503).json({ 
        success: false,
        error: 'PDF generation service not available in this environment',
        message: 'PDF generation requires local setup with pdf.js'
      });
    }
    
    const { projectId, uploadToGitHub = false } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    const db = await connectToDatabase();
    const project = await db.collection('projects').findOne({ 
      _id: new MongoClient.ObjectId(projectId)
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log(`Generating PDF for: ${project.name}`);
    
    // Generate PDF
    const result = await generatePDF(project);
    
    if (!result.success) {
      return res.status(500).json({ error: 'PDF generation failed' });
    }
    
    const stats = fs.statSync(result.path);
    let githubUrl = null;
    
    // Update database with local PDF info
    const updateData = {
      'pdf.generated': true,
      'pdf.path': result.path,
      'pdf.size': stats.size,
      'pdf.generated_at': new Date()
    };
    
    // Upload to GitHub if requested
    if (uploadToGitHub) {
      console.log(`Uploading to GitHub...`);
      try {
        githubUrl = await uploadToGitHub(project.slug, result.path);
        updateData['pdf.url'] = githubUrl;
        updateData['pdf.github_hosted'] = true;
        updateData['pdf.updated_at'] = new Date();
        console.log(`✓ Uploaded to: ${githubUrl}`);
      } catch (error) {
        console.error('GitHub upload failed:', error.message);
        // Continue even if GitHub upload fails
      }
    }
    
    await db.collection('projects').updateOne(
      { _id: project._id },
      { $set: updateData }
    );
    
    res.json({
      success: true,
      message: 'PDF generated successfully',
      size: stats.size,
      githubUrl: githubUrl,
      uploadedToGitHub: !!githubUrl
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
});

module.exports = router;
