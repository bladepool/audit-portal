const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkFields() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    // Get a sample project from each platform
    const platforms = ['Binance Smart Chain', 'Solana', 'Ethereum', 'Base'];
    
    for (const platform of platforms) {
      const project = await collection.findOne({ 
        status: 'published',
        blockchain_platform: platform
      });
      
      if (project) {
        console.log(`\n=== ${platform} Sample ===`);
        console.log(`Project: ${project.project_name}`);
        console.log(`Slug: ${project.slug}`);
        console.log('\nContract-related fields:');
        console.log('- contract_address:', project.contract_address);
        console.log('- audit_results?.contract_address:', project.audit_results?.contract_address);
        console.log('- contract_info?.address:', project.contract_info?.address);
        console.log('- contractAddress:', project.contractAddress);
        console.log('- token_address:', project.token_address);
        
        // Check all keys that might contain contract info
        const contractKeys = Object.keys(project).filter(k => 
          k.toLowerCase().includes('contract') || 
          k.toLowerCase().includes('address') ||
          k.toLowerCase().includes('token')
        );
        console.log('\nAll contract/address/token keys:', contractKeys);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkFields();
