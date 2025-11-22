const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Manual TrustBlock URL Update Script
 * 
 * Since the TrustBlock API endpoint needs verification, this script provides
 * a way to manually update TrustBlock URLs for projects.
 * 
 * You can get the UUIDs from: https://app.trustblock.run/auditor/cfg-ninja
 */

const manualMappings = [
  // Already mapped (from scraper)
  { slug: 'metakingdom', trustblock: '1dbe48f8-2262-4738-84b2-a5423eb265ca' },
  { slug: 'frog-bsc', trustblock: 'cad834c2-c49b-45cc-8462-de1160e4a3d9' },
  { slug: 'overdome', trustblock: '7af17729-992b-4699-8591-4019ce6179bd' },
  { slug: 'denarius', trustblock: 'f5e9d964-6c75-4380-8ea3-48e550fab98c' },
  { slug: 'xiaomao', trustblock: '3e7aa1a5-71dc-4c86-b276-90c98d166512' },
  
  // Add more mappings here by copying from TrustBlock
  // Format: { slug: 'project-slug', trustblock: 'uuid-from-trustblock-url' }
  
  // Example:
  // { slug: 'pecunity', trustblock: 'abc123-uuid-here' },
];

async function updateTrustBlockURLs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const projects = db.collection('projects');
    
    let updated = 0;
    let notFound = 0;
    let alreadySet = 0;
    
    console.log('=== Updating TrustBlock URLs ===\n');
    
    for (const mapping of manualMappings) {
      const url = `https://app.trustblock.run/audit/${mapping.trustblock}`;
      
      const project = await projects.findOne({ slug: mapping.slug });
      
      if (!project) {
        console.log(`❌ Not found: ${mapping.slug}`);
        notFound++;
        continue;
      }
      
      if (project.trustblock_url) {
        console.log(`⏭️  Already set: ${mapping.slug} (${project.trustblock_url})`);
        alreadySet++;
        continue;
      }
      
      await projects.updateOne(
        { _id: project._id },
        { 
          $set: { 
            trustblock_url: url,
            trustblock_mapped_at: new Date()
          } 
        }
      );
      
      console.log(`✅ ${mapping.slug} → ${url}`);
      updated++;
    }
    
    console.log('\n=== Summary ===');
    console.log(`Updated: ${updated}`);
    console.log(`Already set: ${alreadySet}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Total mappings: ${manualMappings.length}`);
    
    // Show overall status
    const total = await projects.countDocuments({ published: true });
    const withTB = await projects.countDocuments({ 
      published: true,
      trustblock_url: { $exists: true }
    });
    
    console.log('\n=== Overall Status ===');
    console.log(`Total published: ${total}`);
    console.log(`On TrustBlock: ${withTB} (${((withTB/total)*100).toFixed(1)}%)`);
    console.log(`Not on TrustBlock: ${total - withTB}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateTrustBlockURLs();
