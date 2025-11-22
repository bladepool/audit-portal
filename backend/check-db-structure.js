require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkProjects() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('auditportal');
  
  console.log('=== Checking Database Structure ===\n');
  
  // Check one project with customer_data_json
  const sample = await db.collection('projects').findOne({
    'metadata.data_source': 'customer_data_json'
  });
  
  console.log('Sample Project:', sample ? sample.name : 'NOT FOUND');
  console.log('\nStructure:');
  console.log(JSON.stringify(sample, null, 2));
  
  // Count projects
  const count = await db.collection('projects').countDocuments({
    'metadata.data_source': 'customer_data_json'
  });
  
  console.log(`\n\nTotal projects with customer_data_json: ${count}`);
  
  await client.close();
}

checkProjects().catch(console.error);
