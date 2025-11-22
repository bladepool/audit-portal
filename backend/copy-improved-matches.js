/**
 * Copy the newly matched PDFs from improved matching
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';
const OUTPUT_PATH = 'g:\\auditportal\\backend\\generated-pdfs';

async function copyImprovedMatches() {
  console.log('=== Copying Improved Matches ===\n');
  
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('auditportal');
  
  try {
    const results = JSON.parse(fs.readFileSync('improved-matching-results.json', 'utf8'));
    const newMatches = results.filter(r => r.matched && r.matchType !== 'exact');
    
    console.log(`Found ${newMatches.length} new matches to copy\n`);
    
    for (const match of newMatches) {
      const sourcePath = path.join(AUDITS_TEMPORAL_PATH, match.filename);
      const destPath = path.join(OUTPUT_PATH, `${match.slug}.pdf`);
      
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);
      
      console.log(`✓ ${match.name}`);
      console.log(`  Copied: ${match.filename} (${match.sizeMB} MB)`);
      console.log(`  Type: ${match.matchType}\n`);
      
      // Update database
      const project = await db.collection('projects').findOne({ slug: match.slug });
      if (project) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          { 
            $set: { 
              'pdf.generated': true,
              'pdf.path': destPath,
              'pdf.size': stats.size,
              'pdf.generated_at': stats.mtime,
              'pdf.source': 'audits_temporal_improved'
            }
          }
        );
      }
    }
    
    console.log(`✅ Copied ${newMatches.length} PDFs`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

copyImprovedMatches();
