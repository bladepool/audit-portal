/**
 * Publish a single project by slug to TrustBlock
 * Usage: node publish-one.js <slug>
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');

const slug = process.argv[2] || 'xfrog';

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  const trustBlock = new TrustBlockAPI(process.env.TRUSTBLOCK_API_KEY);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    const project = await db.collection('projects').findOne({ slug });
    
    if (!project) {
      console.log(`❌ Project not found: ${slug}`);
      return;
    }
    
    console.log(`Publishing: ${project.name} (${slug})`);
    console.log(`Platform: ${project.platform}`);
    console.log(`Contract: ${project.address || project.contract_info?.contract_address || 'N/A'}`);
    console.log();
    
    try {
      const formattedData = trustBlock.formatProjectForTrustBlock(project);
      console.log('Formatted data:');
      console.log(JSON.stringify(formattedData, null, 2));
      console.log();
      
      const result = await trustBlock.publishReport(formattedData);
      
      await db.collection('projects').updateOne(
        { _id: project._id },
        {
          $set: {
            trustblock_id: result.id,
            trustblock_url: `https://app.trustblock.run/audit/${result.id}`,
            trustblock_published_at: new Date()
          }
        }
      );
      
      console.log('✅ SUCCESS!');
      console.log(`Audit ID: ${result.id}`);
      console.log(`URL: https://app.trustblock.run/audit/${result.id}`);
      
    } catch (error) {
      console.error('❌ FAILED:', error.message);
      if (error.message.includes('409')) {
        console.log('Project already exists on TrustBlock');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
})();
