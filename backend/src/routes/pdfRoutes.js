/**
 * PDF Generation Routes - Using offline pdf.js for production-quality PDFs
 * Handles on-demand PDF generation for audit reports with 1-hour caching
 */

const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const OUTPUT_PATH = path.join(__dirname, '../../generated-pdfs');
const TEMPLATE_DATA_JSON_PATH = path.join(CUSTOM_CONTRACT_PATH, 'data.json');

// MongoDB connection cache
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedDb = client.db('auditportal');
  return cachedDb;
}

/**
 * Helper: Generate PDF using offline pdf.js
 */
async function generateOfflinePDF(project) {
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
    
    // Include admin notes (only in PDF, not exposed in API)
    AuditNotesSWC: project.admin_notes?.swc || template.AuditNotesSWC || "",
    AuditNotesTax: project.admin_notes?.tax || template.AuditNotesTax || "",
    AuditNotesKYC: project.admin_notes?.kyc || template.AuditNotesKYC || "",
    AuditNotesSocial: project.admin_notes?.social || template.AuditNotesSocial || ""
  };
  
  // Backup and write
  const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
  fs.copyFileSync(TEMPLATE_DATA_JSON_PATH, backupPath);
  fs.writeFileSync(TEMPLATE_DATA_JSON_PATH, JSON.stringify(updatedData, null, 2));
  
  try {
    await execPromise('node pdf.js', {
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
      // Ensure output directory
      if (!fs.existsSync(OUTPUT_PATH)) {
        fs.mkdirSync(OUTPUT_PATH, { recursive: true });
      }
      
      const outputPath = path.join(OUTPUT_PATH, `${project.slug}.pdf`);
      fs.copyFileSync(latestPdf.path, outputPath);
      
      return { success: true, path: outputPath };
    }
    
    throw new Error('PDF not found after generation');
  } finally {
    // Always restore backup
    fs.copyFileSync(backupPath, TEMPLATE_DATA_JSON_PATH);
    fs.unlinkSync(backupPath);
  }
}

/**
 * Generate PDF for a project
 * GET /api/projects/:slug/generate-pdf
 */
router.get('/:slug/generate-pdf', async (req, res) => {
  try {
    const { slug } = req.params;
    const { force } = req.query; // ?force=true to regenerate

    const db = await connectToDatabase();
    const project = await db.collection('projects').findOne({ 
      slug: slug,
      published: true 
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`PDF request for: ${project.name}`);

    // Check if PDF exists and is recent (< 1 hour)
    const existingPdfPath = path.join(OUTPUT_PATH, `${slug}.pdf`);
    if (!force && fs.existsSync(existingPdfPath)) {
      const stats = fs.statSync(existingPdfPath);
      const ageMinutes = (Date.now() - stats.mtime.getTime()) / 1000 / 60;
      
      if (ageMinutes < 60) {
        console.log(`  ✓ Serving cached PDF (${ageMinutes.toFixed(1)}min old)`);
        const pdfBuffer = fs.readFileSync(existingPdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${slug}-audit-report.pdf"`);
        res.setHeader('X-PDF-Cached', 'true');
        res.setHeader('X-PDF-Age-Minutes', ageMinutes.toFixed(1));
        return res.send(pdfBuffer);
      }
    }

    // Generate new PDF
    console.log(`  ⏳ Generating PDF...`);
    const result = await generateOfflinePDF(project);

    if (result.success) {
      // Update database
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            'pdf.generated': true,
            'pdf.path': result.path,
            'pdf.generated_at': new Date()
          }
        }
      );

      console.log(`  ✓ Generated successfully`);
      
      const pdfBuffer = fs.readFileSync(result.path);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}-audit-report.pdf"`);
      res.setHeader('X-PDF-Cached', 'false');
      res.send(pdfBuffer);
    } else {
      res.status(500).json({ error: 'PDF generation failed' });
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
});

/**
 * Check PDF status
 * GET /api/projects/:slug/pdf-status
 */
router.get('/:slug/pdf-status', async (req, res) => {
  try {
    const { slug } = req.params;
    const pdfPath = path.join(OUTPUT_PATH, `${slug}.pdf`);
    
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      res.json({
        exists: true,
        size: stats.size,
        generated_at: stats.mtime,
        age_minutes: (Date.now() - stats.mtime.getTime()) / 1000 / 60,
        url: `/api/projects/${slug}/generate-pdf`
      });
    } else {
      res.json({ 
        exists: false,
        url: `/api/projects/${slug}/generate-pdf`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Regenerate PDF (force refresh)
 * POST /api/projects/:slug/regenerate-pdf
 */
router.post('/:slug/regenerate-pdf', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const db = await connectToDatabase();
    const project = await db.collection('projects').findOne({ 
      slug: slug,
      published: true 
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`Regenerating PDF for: ${project.name}`);
    
    const result = await generateOfflinePDF(project);

    if (result.success) {
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            'pdf.generated': true,
            'pdf.path': result.path,
            'pdf.generated_at': new Date()
          }
        }
      );

      const stats = fs.statSync(result.path);
      res.json({ 
        success: true,
        size: stats.size,
        path: result.path,
        generated_at: new Date()
      });
    } else {
      res.status(500).json({ error: 'PDF generation failed' });
    }

  } catch (error) {
    console.error('PDF regeneration error:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate PDF',
      message: error.message 
    });
  }
});

module.exports = router;
