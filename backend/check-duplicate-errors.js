/**
 * Check which contracts are being rejected by TrustBlock as duplicates
 * and identify which projects in our DB have them
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDuplicates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Projects being rejected in batch 1
    const problematicProjects = [
      'Xelliott',
      'ELONGATE', 
      'One Chance',
      'DORK LORD BNB',
      'MEVDAO',
      'REAL SMURF PEPE',
      'PONZI',
      'Community INU',
      'One Piece Fan Token'
    ];
    
    console.log('=== Checking Duplicate Contract Addresses ===\n');
    
    for (const projectName of problematicProjects) {
      const project = await db.collection('projects').findOne({
        name: projectName,
        published: true
      });
      
      if (project) {
        const contractAddress = project.contract_info?.contract_address;
        
        console.log(`Project: ${projectName}`);
        console.log(`  Contract: ${contractAddress || 'N/A'}`);
        console.log(`  Platform: ${project.platform}`);
        console.log(`  Has TrustBlock URL: ${!!project.trustblock_url}`);
        
        if (contractAddress) {
          // Find other projects with same contract
          const duplicates = await db.collection('projects').find({
            'contract_info.contract_address': contractAddress,
            published: true
          }).toArray();
          
          if (duplicates.length > 1) {
            console.log(`  Other projects with same contract:`);
            duplicates.forEach(dup => {
              if (dup.name !== projectName) {
                console.log(`    - ${dup.name} (${dup.slug})`);
                console.log(`      TrustBlock: ${dup.trustblock_url || 'Not published'}`);
                console.log(`      Created: ${dup.createdAt}`);
              }
            });
          }
        }
        
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDuplicates();
