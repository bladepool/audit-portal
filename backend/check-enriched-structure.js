require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('auditportal');
  
  const proj = await db.collection('projects').findOne(
    { 'metadata.data_source': 'customer_data_json' },
    { projection: { name: 1, slug: 1, contract: 1, contract_info: 1 } }
  );
  
  console.log(JSON.stringify(proj, null, 2));
  
  const count = await db.collection('projects').countDocuments({
    'metadata.data_source': 'customer_data_json'
  });
  
  console.log(`\nTotal projects with customer_data_json source: ${count}`);
  
  await client.close();
})();
