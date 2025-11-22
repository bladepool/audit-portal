/**
 * Link existing PDFs from Audits_Temporal to generated-pdfs folder
 * Matches PDFs by project name and copies them with slug-based naming
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';
const OUTPUT_PATH = path.join(__dirname, 'generated-pdfs');

// Helper to normalize names for matching
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Extract project name from PDF filename
// Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
function extractProjectName(filename) {
  const match = filename.match(/^\d{8}_CFGNINJA_(.+?)_[A-Z0-9]+_Audit\.pdf$/i);
  if (match) {
    return match[1];
  }
  return null;
}

async function linkExistingPDFs() {
  console.log('=== Linking Existing PDFs from Audits_Temporal ===\n');
  
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('auditportal');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }
    
    // Get all published projects
    const projects = await db.collection('projects').find({ published: true }).toArray();
    console.log(`Found ${projects.length} published projects\n`);
    
    // Get all PDFs from Audits_Temporal
    const pdfFiles = fs.readdirSync(AUDITS_TEMPORAL_PATH)
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const projectName = extractProjectName(f);
        return {
          filename: f,
          path: path.join(AUDITS_TEMPORAL_PATH, f),
          projectName: projectName,
          normalizedName: projectName ? normalizeName(projectName) : null,
          stats: fs.statSync(path.join(AUDITS_TEMPORAL_PATH, f))
        };
      })
      .filter(f => f.projectName !== null)
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Most recent first
    
    console.log(`Found ${pdfFiles.length} PDFs in Audits_Temporal\n`);
    
    let matched = 0;
    let notFound = 0;
    let copied = 0;
    let skipped = 0;
    
    const notFoundProjects = [];
    
    for (const project of projects) {
      const normalizedProjectName = normalizeName(project.name);
      
      // Find matching PDF (use most recent if multiple)
      const matchingPdf = pdfFiles.find(pdf => 
        pdf.normalizedName === normalizedProjectName
      );
      
      if (matchingPdf) {
        matched++;
        const outputFilename = `${project.slug}.pdf`;
        const outputPath = path.join(OUTPUT_PATH, outputFilename);
        
        // Check if already exists
        if (fs.existsSync(outputPath)) {
          const existingStats = fs.statSync(outputPath);
          if (existingStats.size === matchingPdf.stats.size) {
            console.log(`[${project.slug}] ${project.name}`);
            console.log(`  ⏭️  Already exists (${(existingStats.size / 1024 / 1024).toFixed(2)} MB)`);
            skipped++;
            continue;
          }
        }
        
        // Copy the PDF
        fs.copyFileSync(matchingPdf.path, outputPath);
        copied++;
        
        const sizeMB = (matchingPdf.stats.size / 1024 / 1024).toFixed(2);
        console.log(`[${project.slug}] ${project.name}`);
        console.log(`  ✓ Copied: ${sizeMB} MB`);
        
        // Update database
        await db.collection('projects').updateOne(
          { _id: project._id },
          { 
            $set: { 
              'pdf.generated': true,
              'pdf.path': outputPath,
              'pdf.size': matchingPdf.stats.size,
              'pdf.generated_at': matchingPdf.stats.mtime,
              'pdf.source': 'audits_temporal'
            }
          }
        );
        
      } else {
        notFound++;
        notFoundProjects.push({
          slug: project.slug,
          name: project.name,
          normalized: normalizedProjectName
        });
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total published projects: ${projects.length}`);
    console.log(`Matched PDFs: ${matched}`);
    console.log(`  - Newly copied: ${copied}`);
    console.log(`  - Already existed: ${skipped}`);
    console.log(`Not found: ${notFound}`);
    
    if (notFoundProjects.length > 0) {
      console.log('\n=== Projects without PDFs ===');
      fs.writeFileSync(
        'projects-without-pdfs.json',
        JSON.stringify(notFoundProjects, null, 2)
      );
      console.log(`Saved list to: projects-without-pdfs.json`);
      console.log('\nFirst 10 projects without PDFs:');
      notFoundProjects.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} (${p.slug})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

linkExistingPDFs();
