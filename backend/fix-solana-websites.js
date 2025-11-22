require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fix() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('auditportal');
  
  const slugs = ['wrekt', 'house-of-meme', 'solepe'];
  
  for (const slug of slugs) {
    const result = await db.collection('projects').updateOne(
      { slug },
      {
        $set: {
          'socials.website': 'https://cfg.ninja'
        }
      }
    );
    console.log(`Updated ${slug}: ${result.modifiedCount} document`);
  }
  
  await client.close();
}

fix();
