const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');
require('dotenv').config();

async function testPublish() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const apiKey = process.env.TRUSTBLOCK_API_KEY || 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M';
  const api = new TrustBlockAPI(apiKey);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Find a project without TrustBlock URL to test with
    const testProject = await db.collection('projects').findOne({
      published: true,
      trustblock_url: { $exists: false },
      slug: 'pecunity' // Test with pecunity first
    });
    
    if (!testProject) {
      console.log('Test project (pecunity) not found or already on TrustBlock');
      console.log('Finding any unpublished project...');
      
      const anyProject = await db.collection('projects').findOne({
        published: true,
        trustblock_url: { $exists: false }
      });
      
      if (!anyProject) {
        console.log('All projects already on TrustBlock!');
        return;
      }
      
      console.log(`\nTesting with: ${anyProject.name} (${anyProject.slug})`);
      testWithProject(api, db, anyProject);
    } else {
      console.log(`Testing TrustBlock API with: ${testProject.name} (${testProject.slug})`);
      await testWithProject(api, db, testProject);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

async function testWithProject(api, db, project) {
  console.log('\n=== Project Details ===');
  console.log(`Name: ${project.name}`);
  console.log(`Symbol: ${project.symbol}`);
  console.log(`Platform: ${project.platform}`);
  console.log(`Contract: ${project.contract_address}`);
  console.log(`Audit Score: ${project.audit_score}`);
  
  // Format data
  const formattedData = api.formatProjectForTrustBlock(project);
  
  console.log('\n=== Data to Send ===');
  console.log(JSON.stringify(formattedData, null, 2));
  
  console.log('\n=== Publishing to TrustBlock ===');
  
  try {
    const result = await api.publishReport(formattedData);
    
    console.log('\n✅ SUCCESS!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Update database
    if (result.report_url) {
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            trustblock_url: result.report_url,
            trustblock_published_at: new Date(),
            trustblock_id: result.id
          } 
        }
      );
      console.log('\n✅ Database updated with TrustBlock URL');
    }
    
  } catch (error) {
    console.error('\n❌ FAILED');
    console.error('Error:', error.message);
    console.error('\nThis might mean:');
    console.error('1. The API endpoint is incorrect');
    console.error('2. The API key is invalid');
    console.error('3. The data format is not accepted');
    console.error('4. Network/connection issue');
    console.error('\nYou may need to check TrustBlock API documentation.');
  }
}

testPublish();
