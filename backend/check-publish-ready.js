require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('auditportal');
  
  // Get all published projects
  const projects = await db.collection('projects').find({ published: true }).toArray();
  
  // Count by status
  const withTrustBlock = projects.filter(p => p.trustblock_url).length;
  const withoutTrustBlock = projects.filter(p => !p.trustblock_url).length;
  
  // Check contract addresses
  const withContract = projects.filter(p => {
    const addr = p.contract_address || p.contractAddress || p.address || p.contract_info?.contract_address;
    return addr && addr.length > 0;
  }).length;
  
  const withoutContract = projects.length - withContract;
  
  // Check how many without TrustBlock have contracts
  const unpublishedWithContract = projects.filter(p => {
    const hasUrl = p.trustblock_url;
    const addr = p.contract_address || p.contractAddress || p.address || p.contract_info?.contract_address;
    return !hasUrl && addr && addr.length > 0;
  }).length;
  
  console.log('=== TrustBlock Publishing Status ===');
  console.log(`Total published projects: ${projects.length}`);
  console.log(`\nTrustBlock Status:`);
  console.log(`  ✓ On TrustBlock: ${withTrustBlock} (${Math.round(withTrustBlock/projects.length*100)}%)`);
  console.log(`  ✗ Not on TrustBlock: ${withoutTrustBlock} (${Math.round(withoutTrustBlock/projects.length*100)}%)`);
  console.log(`\nContract Address Status:`);
  console.log(`  ✓ Has contract address: ${withContract}`);
  console.log(`  ✗ No contract address: ${withoutContract}`);
  console.log(`\nReady to Publish:`);
  console.log(`  Projects with contract (not on TrustBlock): ${unpublishedWithContract}`);
  console.log(`  Projects without contract (cannot publish): ${withoutContract}`);
  
  await client.close();
})();
