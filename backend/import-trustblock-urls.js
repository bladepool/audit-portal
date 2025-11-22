const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

/**
 * Manual TrustBlock URL import
 * Since TrustBlock uses JavaScript/React for rendering, we'll need to manually
 * map the URLs or use a headless browser. For now, this provides a template.
 */

const trustBlockMappings = [
  // Format: { name: 'Project Name', slug: 'our-slug', trustblock: 'trustblock-uuid' }
  // You can copy these from https://app.trustblock.run/auditor/cfg-ninja
  
  { name: 'DINGA', trustblock: 'a255e500-dffa-4762-91a1-95630134cb6c' },
  { name: 'BabyLinger', trustblock: '282071d3-1118-4f62-847d-fb6c5536ea3b' },
  { name: 'metaKingDom', trustblock: '1dbe48f8-2262-4738-84b2-a5423eb265ca' },
  { name: 'Frog Bsc', trustblock: 'cad834c2-c49b-45cc-8462-de1160e4a3d9' },
  { name: 'Overdome', trustblock: '7af17729-992b-4699-8591-4019ce6179bd' },
  { name: 'Denarius', trustblock: 'f5e9d964-6c75-4380-8ea3-48e550fab98c' },
  { name: 'MetaEvent Token', trustblock: '7e154072-628b-4598-b48e-19bc9d3a7ece' },
  { name: 'Pepe 2024', trustblock: '57a2806d-42e1-4a06-8fe8-e819c25d21aa' },
  { name: 'Xiaomao', trustblock: '3e7aa1a5-71dc-4c86-b276-90c98d166512' },
  { name: 'BADCAT', trustblock: 'af7826b3-9116-4f92-940a-5bc7bce18e23' },
  
  // Add more mappings here as you discover them on TrustBlock
  // You can export them from TrustBlock or manually copy the UUIDs
];

async function importTrustBlockURLs() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const projects = db.collection('projects');
    
    let updated = 0;
    let notFound = 0;
    
    console.log('Importing TrustBlock URLs...\n');
    
    for (const mapping of trustBlockMappings) {
      const url = `https://app.trustblock.run/audit/${mapping.trustblock}`;
      
      // Try to find by name (case-insensitive)
      const project = await projects.findOne({ 
        name: { $regex: new RegExp(`^${mapping.name}$`, 'i') }
      });
      
      if (project) {
        await projects.updateOne(
          { _id: project._id },
          { $set: { trustblock_url: url } }
        );
        console.log(`✓ ${mapping.name} → ${url}`);
        updated++;
      } else {
        console.log(`✗ Not found: ${mapping.name}`);
        notFound++;
      }
    }
    
    console.log(`\n✓ Updated ${updated} projects`);
    console.log(`✗ Not found: ${notFound} projects`);
    
    // Show stats
    const withTrustBlock = await projects.countDocuments({ 
      published: true, 
      trustblock_url: { $exists: true } 
    });
    const withoutTrustBlock = await projects.countDocuments({ 
      published: true, 
      trustblock_url: { $exists: false } 
    });
    
    console.log(`\nTotal with TrustBlock URL: ${withTrustBlock}`);
    console.log(`Total without TrustBlock URL: ${withoutTrustBlock}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

importTrustBlockURLs();
