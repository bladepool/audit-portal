require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const project = await client.db('auditportal').collection('projects').findOne({ slug: 'pecunity' });
  
  console.log('=== Pecunity Project Fields ===');
  console.log(JSON.stringify(project, null, 2));
  
  await client.close();
})();
