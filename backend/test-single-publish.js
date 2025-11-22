/**
 * Test single project publish with detailed error output
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  const trustBlock = new TrustBlockAPI(process.env.TRUSTBLOCK_API_KEY);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Find first unpublished project
    const project = await db.collection('projects').findOne({
      published: true,
      $or: [
        { trustblock_url: { $exists: false } },
        { trustblock_url: null },
        { trustblock_url: '' }
      ]
    });
    
    if (!project) {
      console.log('No unpublished projects found');
      return;
    }
    
    console.log(`Testing with: ${project.name} (${project.slug})`);
    console.log(`Platform: ${project.platform}`);
    console.log();
    
    // Format data
    console.log('Formatting data...');
    const formattedData = trustBlock.formatProjectForTrustBlock(project);
    
    console.log('Formatted data:');
    console.log(JSON.stringify(formattedData, null, 2));
    console.log();
    
    // Publish
    console.log('Publishing to TrustBlock...');
    const result = await trustBlock.publishReport(formattedData);
    
    console.log('\n✓ Success!');
    console.log(`Audit ID: ${result.id}`);
    console.log(`Project ID: ${result.projectId}`);
    console.log(`URL: https://app.trustblock.run/audit/${result.id}`);
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
})();
