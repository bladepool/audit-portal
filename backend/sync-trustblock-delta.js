/**
 * Compare our database audits with TrustBlock and generate delta report
 * Then publish missing Solana projects
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');

async function compareAndSync() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const trustBlock = new TrustBlockAPI(process.env.TRUSTBLOCK_API_KEY);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Get all published projects
    const allProjects = await db.collection('projects')
      .find({ published: true })
      .toArray();
    
    console.log('=== Database Analysis ===');
    console.log(`Total published projects: ${allProjects.length}`);
    
    // Categorize projects
    const onTrustBlock = allProjects.filter(p => p.trustblock_url);
    const notOnTrustBlock = allProjects.filter(p => !p.trustblock_url);
    
    // Analyze by platform
    const platformStats = {};
    allProjects.forEach(p => {
      const platform = p.platform || 'Unknown';
      if (!platformStats[platform]) {
        platformStats[platform] = { total: 0, onTrustBlock: 0, notOnTrustBlock: 0, hasContract: 0 };
      }
      platformStats[platform].total++;
      if (p.trustblock_url) {
        platformStats[platform].onTrustBlock++;
      } else {
        platformStats[platform].notOnTrustBlock++;
      }
      
      // Check if has contract
      const hasContract = p.contract_address || p.contractAddress || p.address || p.contract_info?.contract_address;
      if (hasContract) {
        platformStats[platform].hasContract++;
      }
    });
    
    console.log(`\nOn TrustBlock: ${onTrustBlock.length} (${Math.round(onTrustBlock.length/allProjects.length*100)}%)`);
    console.log(`Not on TrustBlock: ${notOnTrustBlock.length} (${Math.round(notOnTrustBlock.length/allProjects.length*100)}%)`);
    
    // Platform breakdown
    console.log('\n=== Platform Breakdown ===');
    Object.keys(platformStats).sort((a, b) => platformStats[b].total - platformStats[a].total).forEach(platform => {
      const stats = platformStats[platform];
      const onPercent = Math.round(stats.onTrustBlock / stats.total * 100);
      console.log(`\n${platform}:`);
      console.log(`  Total: ${stats.total}`);
      console.log(`  On TrustBlock: ${stats.onTrustBlock} (${onPercent}%)`);
      console.log(`  Not on TrustBlock: ${stats.notOnTrustBlock}`);
      console.log(`  Has contract address: ${stats.hasContract}`);
    });
    
    // Solana projects analysis
    console.log('\n=== Solana Projects Analysis ===');
    const solanaProjects = allProjects.filter(p => 
      p.platform && p.platform.toLowerCase().includes('solana')
    );
    const solanaOnTrustBlock = solanaProjects.filter(p => p.trustblock_url);
    const solanaNotOnTrustBlock = solanaProjects.filter(p => !p.trustblock_url);
    const solanaWithContract = solanaNotOnTrustBlock.filter(p => {
      const addr = p.contract_address || p.contractAddress || p.address || p.contract_info?.contract_address;
      return addr && addr.length > 0;
    });
    
    console.log(`Total Solana projects: ${solanaProjects.length}`);
    console.log(`On TrustBlock: ${solanaOnTrustBlock.length}`);
    console.log(`Not on TrustBlock: ${solanaNotOnTrustBlock.length}`);
    console.log(`  - With contract address: ${solanaWithContract.length}`);
    console.log(`  - Without contract: ${solanaNotOnTrustBlock.length - solanaWithContract.length}`);
    
    // Generate delta report
    console.log('\n=== Delta Report ===');
    console.log('\nMissing from TrustBlock (by platform):');
    
    const missingByPlatform = {};
    notOnTrustBlock.forEach(p => {
      const platform = p.platform || 'Unknown';
      if (!missingByPlatform[platform]) {
        missingByPlatform[platform] = [];
      }
      const hasContract = p.contract_address || p.contractAddress || p.address || p.contract_info?.contract_address;
      missingByPlatform[platform].push({
        name: p.name,
        slug: p.slug,
        symbol: p.symbol,
        hasContract: !!hasContract,
        contractAddress: hasContract || 'N/A'
      });
    });
    
    Object.keys(missingByPlatform).sort((a, b) => missingByPlatform[b].length - missingByPlatform[a].length).forEach(platform => {
      const projects = missingByPlatform[platform];
      const withContract = projects.filter(p => p.hasContract).length;
      console.log(`\n${platform}: ${projects.length} projects (${withContract} with contracts)`);
      
      // Show first 5
      projects.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.symbol || 'N/A'})`);
        console.log(`    Slug: ${p.slug}`);
        console.log(`    Contract: ${p.hasContract ? p.contractAddress.substring(0, 20) + '...' : 'Missing'}`);
      });
      
      if (projects.length > 5) {
        console.log(`  ... and ${projects.length - 5} more`);
      }
    });
    
    // Save detailed report to file
    const fs = require('fs');
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalProjects: allProjects.length,
        onTrustBlock: onTrustBlock.length,
        notOnTrustBlock: notOnTrustBlock.length,
        percentageOnTrustBlock: Math.round(onTrustBlock.length / allProjects.length * 100)
      },
      platformStats: platformStats,
      solanaStats: {
        total: solanaProjects.length,
        onTrustBlock: solanaOnTrustBlock.length,
        notOnTrustBlock: solanaNotOnTrustBlock.length,
        readyToPublish: solanaWithContract.length
      },
      missingProjects: missingByPlatform
    };
    
    fs.writeFileSync('trustblock-delta-report.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Detailed report saved to trustblock-delta-report.json');
    
    // Ask if user wants to publish Solana projects
    console.log('\n=== Next Steps ===');
    console.log(`\n1. Review trustblock-delta-report.json for complete details`);
    console.log(`2. Publish ${solanaWithContract.length} Solana projects with: node batch-publish-trustblock.js`);
    console.log(`3. Update database with TrustBlock URLs from existing audits`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run
if (require.main === module) {
  compareAndSync().catch(console.error);
}

module.exports = compareAndSync;
