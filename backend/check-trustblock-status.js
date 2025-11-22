const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkStatus() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    const total = await db.collection('projects').countDocuments({ published: true });
    const withTB = await db.collection('projects').countDocuments({ 
      published: true,
      trustblock_url: { $exists: true }
    });
    
    console.log('=== TrustBlock Status ===');
    console.log(`Total Published: ${total}`);
    console.log(`On TrustBlock: ${withTB}`);
    console.log(`Not on TrustBlock: ${total - withTB}`);
    console.log(`Percentage: ${((withTB/total)*100).toFixed(1)}%`);
  } finally {
    await client.close();
  }
}

checkStatus();
