/**
 * Publish the 4 Solana projects with newly found contracts to TrustBlock
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const axios = require('axios');

const TRUSTBLOCK_API_URL = 'https://api.trustblock.run/v1/audit';
const TRUSTBLOCK_API_KEY = process.env.TRUSTBLOCK_API_KEY;

const slugs = [
  'wrekt',
  'house-of-meme',
  'solepe',
  'mars-coin'
];

async function publishProject(project) {
  // Map platform to TrustBlock chain format
  const chainMap = {
    'BSC': 'bsc',
    'Binance Smart Chain': 'bsc',
    'Ethereum': 'ethereum',
    'Solana': 'solana',
    'Polygon': 'polygon'
  };
  
  const chain = chainMap[project.platform] || 'bsc';
  const reportUrl = `https://audit.cfg.ninja/${project.slug}`;
  
  // Website must be simple URL without subpaths
  let website = project.socials?.website;
  if (!website || website.includes('/subpath')) {
    website = 'https://audit.cfg.ninja'; // Default to homepage
  }
  
  // Ensure conductedAt is in the past (use audit_date or 30 days ago)
  let conductedAt;
  if (project.audit_date) {
    conductedAt = new Date(project.audit_date).getTime();
  } else {
    conductedAt = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
  }
  
  const payload = {
    name: project.name,
    description: project.description || `Smart contract audit for ${project.name} (${project.symbol || ''})`,
    conductedAt: conductedAt,
    reportUrl: reportUrl,
    reportType: 'web',
    issues: [], // Empty issues array
    contracts: [
      {
        type: 'onChain',
        chain: chain,
        address: project.contract_info.contract_address
      }
    ],
    project: {
      name: project.name,
      email: 'audit@cfg.ninja',
      tags: ['finance', 'security'],
      chains: [chain],
      links: {
        website: website,
        twitter: project.socials?.twitter || undefined,
        telegram: project.socials?.telegram || undefined
      }
    }
  };

  try {
    const response = await axios.post(TRUSTBLOCK_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${TRUSTBLOCK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    console.log('=== Publishing Found Solana Contracts to TrustBlock ===\n');
    
    let successful = 0;
    let failed = 0;
    
    for (const slug of slugs) {
      const project = await db.collection('projects').findOne({ slug, published: true });
      
      if (!project) {
        console.log(`✗ ${slug}: Not found in database`);
        failed++;
        continue;
      }
      
      console.log(`\n[${slugs.indexOf(slug) + 1}/${slugs.length}] ${project.name}`);
      console.log(`  Contract: ${project.contract_info.contract_address}`);
      console.log(`  Platform: ${project.platform}`);
      
      const result = await publishProject(project);
      
      if (result.success) {
        console.log(`  ✓ Published successfully`);
        
        // Update database
        await db.collection('projects').updateOne(
          { _id: project._id },
          {
            $set: {
              'trustblock.published': true,
              'trustblock.published_at': new Date(),
              'trustblock.url': result.data.url || null
            }
          }
        );
        
        successful++;
      } else {
        console.log(`  ✗ Failed: ${JSON.stringify(result.error)}`);
        failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n\n=== Results ===');
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Total: ${successful + failed}`);
    
    // Updated stats
    const onTrustBlock = await db.collection('projects').countDocuments({
      published: true,
      'trustblock.published': true
    });
    
    const total = await db.collection('projects').countDocuments({ published: true });
    
    console.log(`\nTrustBlock Status: ${onTrustBlock}/${total} (${Math.round(onTrustBlock/total*100)}%)`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

run();
