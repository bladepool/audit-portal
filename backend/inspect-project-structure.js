require('dotenv').config();
const { MongoClient } = require('mongodb');

async function inspectProject() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected\n');
    
    const db = client.db('auditportal');
    
    // Get a project that has trustblock_url (so we know it published successfully)
    const project = await db.collection('projects').findOne({ 
      published: true,
      trustblock_url: { $exists: true }
    });
    
    if (project) {
      console.log('Sample Successfully Published Project:', project.name || project.project_name);
      console.log('Platform:', project.platform);
      console.log('TrustBlock URL:', project.trustblock_url);
      console.log('\n=== Full Document Structure ===\n');
      console.log(JSON.stringify(project, null, 2));
    } else {
      console.log('No published project with TrustBlock URL found');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectProject();
