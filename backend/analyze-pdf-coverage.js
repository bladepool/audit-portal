/**
 * Analyze which published projects have PDFs in Audits_Temporal
 * Shows coverage and helps identify missing projects
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function extractProjectName(filename) {
  // Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
  const match = filename.match(/^\d{8}_CFGNINJA_(.+?)_[A-Z0-9]+_Audit\.pdf$/i);
  if (match) {
    return match[1];
  }
  return null;
}

async function analyzeCoverage() {
  console.log('=== Analyzing PDF Coverage ===\n');
  
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('auditportal');
  
  try {
    // Get all published projects
    const projects = await db.collection('projects')
      .find({ published: true })
      .sort({ name: 1 })
      .toArray();
    
    console.log(`Total published projects: ${projects.length}\n`);
    
    // Get all PDFs from Audits_Temporal with their dates
    const pdfFiles = fs.readdirSync(AUDITS_TEMPORAL_PATH)
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const projectName = extractProjectName(f);
        const stats = fs.statSync(path.join(AUDITS_TEMPORAL_PATH, f));
        const dateMatch = f.match(/^(\d{4})(\d{2})(\d{2})_/);
        const auditDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
        
        return {
          filename: f,
          projectName: projectName,
          normalizedName: projectName ? normalizeName(projectName) : null,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          modified: stats.mtime,
          auditDate: auditDate
        };
      })
      .filter(f => f.projectName !== null);
    
    console.log(`Total PDFs in Audits_Temporal: ${pdfFiles.length}\n`);
    
    // Create lookup map of PDFs by normalized name
    const pdfMap = new Map();
    pdfFiles.forEach(pdf => {
      if (!pdfMap.has(pdf.normalizedName)) {
        pdfMap.set(pdf.normalizedName, []);
      }
      pdfMap.get(pdf.normalizedName).push(pdf);
    });
    
    // Analyze each project
    const withPDF = [];
    const withoutPDF = [];
    const multipleVersions = [];
    
    projects.forEach(project => {
      const normalized = normalizeName(project.name);
      const pdfs = pdfMap.get(normalized);
      
      if (pdfs && pdfs.length > 0) {
        withPDF.push({
          slug: project.slug,
          name: project.name,
          pdfCount: pdfs.length,
          pdfs: pdfs.map(p => ({
            filename: p.filename,
            sizeMB: p.sizeMB,
            auditDate: p.auditDate
          }))
        });
        
        if (pdfs.length > 1) {
          multipleVersions.push({
            name: project.name,
            slug: project.slug,
            versions: pdfs.length
          });
        }
      } else {
        withoutPDF.push({
          slug: project.slug,
          name: project.name,
          normalized: normalized
        });
      }
    });
    
    // Sort by number of versions
    withPDF.sort((a, b) => b.pdfCount - a.pdfCount);
    
    console.log('=== Coverage Analysis ===');
    console.log(`Projects WITH PDFs: ${withPDF.length} (${(withPDF.length/projects.length*100).toFixed(1)}%)`);
    console.log(`Projects WITHOUT PDFs: ${withoutPDF.length} (${(withoutPDF.length/projects.length*100).toFixed(1)}%)`);
    console.log(`Projects with multiple versions: ${multipleVersions.length}\n`);
    
    // Show projects with multiple versions
    if (multipleVersions.length > 0) {
      console.log('=== Projects with Multiple PDF Versions ===');
      multipleVersions.slice(0, 10).forEach(p => {
        console.log(`  ${p.name} - ${p.versions} versions`);
      });
      if (multipleVersions.length > 10) {
        console.log(`  ... and ${multipleVersions.length - 10} more\n`);
      } else {
        console.log('');
      }
    }
    
    // Show sample of projects without PDFs
    console.log('=== Sample Projects WITHOUT PDFs ===');
    withoutPDF.slice(0, 20).forEach(p => {
      console.log(`  ${p.name} (${p.slug})`);
    });
    if (withoutPDF.length > 20) {
      console.log(`  ... and ${withoutPDF.length - 20} more\n`);
    } else {
      console.log('');
    }
    
    // Save detailed reports
    fs.writeFileSync(
      'pdf-coverage-with.json',
      JSON.stringify(withPDF, null, 2)
    );
    console.log('✓ Saved projects with PDFs to: pdf-coverage-with.json');
    
    fs.writeFileSync(
      'pdf-coverage-without.json',
      JSON.stringify(withoutPDF, null, 2)
    );
    console.log('✓ Saved projects without PDFs to: pdf-coverage-without.json');
    
    if (multipleVersions.length > 0) {
      fs.writeFileSync(
        'pdf-multiple-versions.json',
        JSON.stringify(multipleVersions, null, 2)
      );
      console.log('✓ Saved projects with multiple versions to: pdf-multiple-versions.json');
    }
    
    // Analyze unused PDFs (PDFs that don't match any published project)
    const usedPdfNames = new Set(withPDF.flatMap(p => p.pdfs.map(pdf => pdf.filename)));
    const unusedPdfs = pdfFiles.filter(pdf => !usedPdfNames.has(pdf.filename));
    
    if (unusedPdfs.length > 0) {
      console.log(`\n=== Unused PDFs in Audits_Temporal ===`);
      console.log(`Total unused: ${unusedPdfs.length}`);
      console.log('\nSample (first 10):');
      unusedPdfs.slice(0, 10).forEach(pdf => {
        console.log(`  ${pdf.filename} (${pdf.sizeMB} MB)`);
      });
      
      fs.writeFileSync(
        'pdf-unused.json',
        JSON.stringify(unusedPdfs.map(p => ({
          filename: p.filename,
          projectName: p.projectName,
          sizeMB: p.sizeMB,
          auditDate: p.auditDate
        })), null, 2)
      );
      console.log('\n✓ Saved unused PDFs to: pdf-unused.json');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

analyzeCoverage();
