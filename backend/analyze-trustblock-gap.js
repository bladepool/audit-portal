const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://readWriteUser:admin1234@cfgninja.wz6mm.mongodb.net/?retryWrites=true&w=majority&appName=CFGNINJA';

async function analyzeGap() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    // Get all published projects
    const allProjects = await collection.find({ 
      status: 'published' 
    }).toArray();
    
    console.log('=== TrustBlock Gap Analysis ===\n');
    console.log(`TrustBlock shows: 685 audits`);
    console.log(`Our database has: ${allProjects.length} published projects`);
    console.log(`With trustblock_url: ${allProjects.filter(p => p.trustblock_url).length}`);
    console.log(`Gap: ${685 - allProjects.filter(p => p.trustblock_url).length} audits\n`);
    
    // Analyze what we have vs what's published
    const withTrustBlock = allProjects.filter(p => p.trustblock_url);
    const withoutTrustBlock = allProjects.filter(p => !p.trustblock_url);
    
    console.log('=== Projects WITH TrustBlock URL ===');
    console.log(`Total: ${withTrustBlock.length}`);
    console.log('Sample (first 10):');
    withTrustBlock.slice(0, 10).forEach(p => {
      console.log(`  - ${p.project_name} (${p.blockchain_platform})`);
    });
    
    console.log('\n=== Projects WITHOUT TrustBlock URL ===');
    console.log(`Total: ${withoutTrustBlock.length}`);
    
    // Group by reason
    const noContract = withoutTrustBlock.filter(p => {
      const addr = p.contract_address || 
                   p.audit_results?.contract_address || 
                   p.contract_info?.address;
      return !addr || addr.length === 0;
    });
    
    const hasContract = withoutTrustBlock.filter(p => {
      const addr = p.contract_address || 
                   p.audit_results?.contract_address || 
                   p.contract_info?.address;
      return addr && addr.length > 0;
    });
    
    console.log(`  - No contract address: ${noContract.length}`);
    console.log(`  - Has contract (not yet published): ${hasContract.length}\n`);
    
    console.log('Projects with contracts ready to publish:');
    hasContract.slice(0, 20).forEach(p => {
      const addr = p.contract_address || 
                   p.audit_results?.contract_address || 
                   p.contract_info?.address;
      console.log(`  - ${p.project_name} (${p.blockchain_platform}) - ${addr}`);
    });
    
    // Check if there are OLD projects that might be on TrustBlock but not in our DB
    console.log('\n=== Hypothesis: Old Audits on TrustBlock ===');
    console.log('The 534 audit gap could mean:');
    console.log('1. Old audits published to TrustBlock before this database existed');
    console.log('2. Audits from Custom Contract folder not yet in main database');
    console.log('3. Duplicate audits with different versions\n');
    
    // Check dates
    const projectsByYear = {};
    allProjects.forEach(p => {
      const date = p.timeline?.audit_release || p.createdAt;
      if (date) {
        const year = new Date(date).getFullYear();
        projectsByYear[year] = (projectsByYear[year] || 0) + 1;
      }
    });
    
    console.log('Projects by year in database:');
    Object.keys(projectsByYear).sort().forEach(year => {
      console.log(`  ${year}: ${projectsByYear[year]} projects`);
    });
    
    // Save detailed report
    const report = {
      trustblock_count: 685,
      database_count: allProjects.length,
      linked_count: withTrustBlock.length,
      gap: 685 - withTrustBlock.length,
      ready_to_publish: hasContract.length,
      cannot_publish_no_contract: noContract.length,
      projects_by_year: projectsByYear,
      ready_to_publish_list: hasContract.map(p => ({
        name: p.project_name,
        slug: p.slug,
        platform: p.blockchain_platform,
        contract: p.contract_address || p.audit_results?.contract_address || p.contract_info?.address,
        date: p.timeline?.audit_release || p.createdAt
      }))
    };
    
    const fs = require('fs');
    fs.writeFileSync('trustblock-gap-analysis.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Saved detailed report to trustblock-gap-analysis.json');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

analyzeGap();
