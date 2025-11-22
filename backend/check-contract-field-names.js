require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkContractFields() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected\n');
    
    const db = client.db('auditportal');
    
    // Get one published project
    const project = await db.collection('projects').findOne({ published: true });
    
    if (project) {
      console.log('Sample Project:', project.name || project.project_name);
      console.log('\nAll field names:');
      const allFields = Object.keys(project);
      const contractRelated = allFields.filter(k => 
        k.toLowerCase().includes('contract') || 
        k.toLowerCase().includes('address') ||
        k.toLowerCase().includes('token')
      );
      
      console.log('\nContract/Address/Token related fields:');
      contractRelated.forEach(field => {
        console.log(`  - ${field}: ${JSON.stringify(project[field])?.substring(0, 100)}`);
      });
      
      // Check how many have each field
      console.log('\n=== Field Usage Statistics ===\n');
      
      for (const field of contractRelated) {
        const count = await db.collection('projects').countDocuments({
          published: true,
          [field]: { $exists: true, $ne: null, $ne: '', $ne: [] }
        });
        console.log(`${field}: ${count} projects`);
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkContractFields();
