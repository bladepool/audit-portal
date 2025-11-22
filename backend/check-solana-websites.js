require('dotenv').config();
const { MongoClient } = require('mongodb');

async function check() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('auditportal');
  
  const projects = await db.collection('projects').find({
    slug: { $in: ['wrekt', 'house-of-meme', 'solepe'] }
  }).toArray();
  
  projects.forEach(p => {
    console.log(`${p.name}:`);
    console.log(`  Website: ${p.socials?.website || 'NONE'}`);
    console.log(`  Twitter: ${p.socials?.twitter || 'NONE'}`);
    console.log(`  Telegram: ${p.socials?.telegram || 'NONE'}`);
    console.log('');
  });
  
  await client.close();
}

check();
