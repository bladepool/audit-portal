require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('auditportal');
  
  const projects = await db.collection('projects')
    .find({ published: true })
    .limit(10)
    .project({ name: 1, slug: 1, symbol: 1 })
    .toArray();
  
  console.log('=== Sample Project Names ===');
  projects.forEach(p => {
    console.log(`${p.name} (${p.symbol || 'N/A'}) - slug: ${p.slug}`);
  });
  
  await client.close();
})();
