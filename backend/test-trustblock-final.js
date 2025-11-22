const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');
require('dotenv').config();

async function testPublishWithCorrectFormat() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const apiKey = process.env.TRUSTBLOCK_API_KEY || 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M';
  const api = new TrustBlockAPI(apiKey);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Get Pecunity project
    const project = await db.collection('projects').findOne({ slug: 'pecunity' });
    
    if (!project) {
      console.log('Pecunity project not found');
      return;
    }
    
    console.log('=== Project Data ===');
    console.log(`Name: ${project.name}`);
    console.log(`Symbol: ${project.symbol}`);
    console.log(`Platform: ${project.platform}`);
    console.log(`Contract: ${project.contract_address || project.contract_info?.contract_address || 'N/A'}`);
    
    // Format data
    const formattedData = api.formatProjectForTrustBlock(project);
    
    console.log('\n=== Formatted Data for TrustBlock ===');
    console.log(JSON.stringify(formattedData, null, 2));
    
    console.log('\n=== Publishing to TrustBlock ===');
    console.log('Endpoint: POST https://api.trustblock.run/audits');
    console.log('API Key: ' + apiKey.substring(0, 10) + '...\n');
    
    const result = await api.publishReport(formattedData);
    
    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(result, null, 2));
    
    // Update database
    if (result.id || result.audit_id || result._id) {
      const trustblockId = result.id || result.audit_id || result._id;
      const trustblockUrl = result.url || `https://app.trustblock.run/audit/${trustblockId}`;
      
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            trustblock_url: trustblockUrl,
            trustblock_id: trustblockId,
            trustblock_published_at: new Date()
          } 
        }
      );
      console.log('\n✅ Database updated!');
      console.log(`TrustBlock URL: ${trustblockUrl}`);
    }
    
  } catch (error) {
    console.error('\n❌ FAILED');
    console.error('Error:', error.message);
    
    if (error.message.includes('404')) {
      console.error('\nEndpoint not found. Possible issues:');
      console.error('- API endpoint may be different');
      console.error('- May need to register API key first');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\nAuthentication failed. Check:');
      console.error('- API key is correct');
      console.error('- API key has proper permissions');
    } else if (error.message.includes('400')) {
      console.error('\nBad request. Check:');
      console.error('- Data format matches TrustBlock requirements');
      console.error('- All required fields are present');
    }
  } finally {
    await client.close();
  }
}

testPublishWithCorrectFormat();
