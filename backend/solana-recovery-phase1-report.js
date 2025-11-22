/**
 * Final Status Report - Solana Contract Recovery Phase 1
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function generateReport() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    console.log('=== Solana Contract Recovery - Phase 1 Complete ===\n');
    
    // Overall stats
    const totalProjects = await db.collection('projects').countDocuments({ published: true });
    const withContracts = await db.collection('projects').countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log('📊 Overall Database Status:');
    console.log(`Total Published: ${totalProjects}`);
    console.log(`With Contracts: ${withContracts} (${Math.round(withContracts/totalProjects*100)}%)`);
    console.log(`Without Contracts: ${totalProjects - withContracts}\n`);
    
    // Solana specific
    const totalSolana = await db.collection('projects').countDocuments({
      published: true,
      platform: 'Solana'
    });
    
    const solanaWithContracts = await db.collection('projects').countDocuments({
      published: true,
      platform: 'Solana',
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log('🔆 Solana Projects:');
    console.log(`Total: ${totalSolana}`);
    console.log(`With Contracts: ${solanaWithContracts} (${Math.round(solanaWithContracts/totalSolana*100)}%)`);
    console.log(`Still Missing: ${totalSolana - solanaWithContracts}\n`);
    
    // TrustBlock stats
    const onTrustBlock = await db.collection('projects').countDocuments({
      published: true,
      'trustblock.published': true
    });
    
    console.log('🔒 TrustBlock Status:');
    console.log(`Published: ${onTrustBlock}/${totalProjects} (${Math.round(onTrustBlock/totalProjects*100)}%)`);
    console.log(`Pending: ${totalProjects - onTrustBlock}\n`);
    
    // What we found today
    const foundToday = await db.collection('projects').find({
      published: true,
      platform: 'Solana',
      'contract_info.source': 'Solana Token Registry',
      'contract_info.found_at': { $exists: true }
    }).toArray();
    
    console.log('✅ Phase 1 Results (Automated Discovery):');
    console.log(`Contracts Found: ${foundToday.length}`);
    console.log(`Source: Solana Token Registry`);
    console.log(`Published to TrustBlock: ${foundToday.filter(p => p.trustblock?.published).length}\n`);
    
    if (foundToday.length > 0) {
      console.log('Projects with new contracts:');
      foundToday.forEach(p => {
        console.log(`  ✓ ${p.name} (${p.symbol})`);
        console.log(`    ${p.contract_info.contract_address}`);
      });
      console.log('');
    }
    
    // Platform breakdown
    const platforms = ['BSC', 'Solana', 'Ethereum'];
    console.log('📈 Contract Coverage by Platform:\n');
    
    for (const platform of platforms) {
      const total = await db.collection('projects').countDocuments({
        published: true,
        platform: platform
      });
      
      const withContract = await db.collection('projects').countDocuments({
        published: true,
        platform: platform,
        'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
      });
      
      const percentage = total > 0 ? Math.round(withContract/total*100) : 0;
      console.log(`${platform}: ${withContract}/${total} (${percentage}%)`);
    }
    
    console.log('\n\n=== Next Steps ===\n');
    console.log('Phase 2: Manual Recovery (Week 1-2)');
    console.log('  1. Email campaign to 74 Solana projects');
    console.log('  2. Social media research (Twitter/Telegram)');
    console.log('  3. Check CoinGecko/CMC listings');
    console.log('  Expected: 20-30 contracts\n');
    
    console.log('Phase 3: Advanced Discovery (Week 2-3)');
    console.log('  1. DEX scraping (Raydium, Jupiter, Orca)');
    console.log('  2. Historical data mining');
    console.log('  3. Blockchain exploration');
    console.log('  Expected: 15-25 contracts\n');
    
    console.log('Phase 4: Batch Publishing (Week 3-4)');
    console.log('  1. Validate all found contracts');
    console.log('  2. Publish to TrustBlock');
    console.log('  3. Final documentation\n');
    
    const targetContracts = solanaWithContracts + 50; // Conservative estimate
    const targetCoverage = Math.round(targetContracts/totalSolana*100);
    console.log(`Realistic Target: ${targetContracts}/${totalSolana} Solana projects (${targetCoverage}%)`);
    console.log(`Overall Target: ${withContracts + 50}/${totalProjects} all projects (${Math.round((withContracts + 50)/totalProjects*100)}%)\n`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

generateReport();
