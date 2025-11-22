/**
 * Update MongoDB with GitHub PDF URLs after uploading to repository
 * Run this after creating GitHub repo and uploading PDFs
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const OUTPUT_PATH = 'g:\\auditportal\\backend\\generated-pdfs';

// UPDATE THIS after creating your GitHub repository
const GITHUB_REPO_OWNER = 'cfg-ninja';
const GITHUB_REPO_NAME = 'audits';
const GITHUB_BRANCH = 'main';

function getGitHubPdfUrl(slug) {
  return `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${slug}.pdf`;
}

async function updatePdfUrls() {
  console.log('=== Updating MongoDB with GitHub PDF URLs ===\n');
  
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('auditportal');
  
  try {
    // Get all PDFs in generated-pdfs folder
    const pdfFiles = fs.readdirSync(OUTPUT_PATH)
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const slug = path.basename(f, '.pdf');
        const stats = fs.statSync(path.join(OUTPUT_PATH, f));
        return {
          slug: slug,
          filename: f,
          size: stats.size,
          githubUrl: getGitHubPdfUrl(slug)
        };
      });
    
    console.log(`Found ${pdfFiles.length} PDFs to update\n`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const pdf of pdfFiles) {
      const project = await db.collection('projects').findOne({ slug: pdf.slug });
      
      if (project) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          { 
            $set: { 
              'pdf.url': pdf.githubUrl,
              'pdf.github_hosted': true,
              'pdf.updated_at': new Date()
            }
          }
        );
        updated++;
        
        if (updated % 50 === 0) {
          console.log(`  Updated ${updated}/${pdfFiles.length}...`);
        }
      } else {
        notFound++;
        console.log(`  ⚠️  Project not found: ${pdf.slug}`);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total PDFs: ${pdfFiles.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Not found: ${notFound}`);
    console.log('\n✅ All projects updated with GitHub PDF URLs');
    console.log(`\nExample URL: ${pdfFiles[0].githubUrl}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

updatePdfUrls();
