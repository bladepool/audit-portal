const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function mergeBNBChain() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('auditportal');
    const projects = db.collection('projects');
    
    // Find all projects with BNBCHAIN
    const bnbChainProjects = await projects.find({ 
      platform: 'BNBCHAIN' 
    }).toArray();
    
    console.log(`\nFound ${bnbChainProjects.length} projects with platform "BNBCHAIN"`);
    
    if (bnbChainProjects.length > 0) {
      console.log('\nSample projects:');
      bnbChainProjects.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.slug})`);
      });
      
      // Update all BNBCHAIN to Binance Smart Chain
      const result = await projects.updateMany(
        { platform: 'BNBCHAIN' },
        { $set: { platform: 'Binance Smart Chain' } }
      );
      
      console.log(`\n✓ Updated ${result.modifiedCount} projects`);
      console.log('  BNBCHAIN → Binance Smart Chain');
      
      // Verify the change
      const remaining = await projects.countDocuments({ platform: 'BNBCHAIN' });
      const bscCount = await projects.countDocuments({ platform: 'Binance Smart Chain' });
      
      console.log(`\nVerification:`);
      console.log(`  BNBCHAIN remaining: ${remaining}`);
      console.log(`  Binance Smart Chain total: ${bscCount}`);
    } else {
      console.log('\nNo projects found with platform "BNBCHAIN"');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

mergeBNBChain();
