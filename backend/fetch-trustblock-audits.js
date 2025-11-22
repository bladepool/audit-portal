/**
 * Get all audits from TrustBlock using their API
 * Uses the auditor filter to get CFG Ninja audits
 */

require('dotenv').config();
const https = require('https');

async function getTrustBlockAudits(page = 1, limit = 100) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.trustblock.run',
      path: `/v1/audit?page=${page}&limit=${limit}&auditor=cfg-ninja`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TRUSTBLOCK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function getAllTrustBlockAudits() {
  const allAudits = [];
  let page = 1;
  let hasMore = true;
  
  console.log('Fetching audits from TrustBlock API...\n');
  
  while (hasMore) {
    try {
      console.log(`Fetching page ${page}...`);
      const result = await getTrustBlockAudits(page, 100);
      
      if (result.data && result.data.length > 0) {
        allAudits.push(...result.data);
        console.log(`  Found ${result.data.length} audits (total: ${allAudits.length})`);
        
        // Check if there are more pages
        if (result.pagination && result.pagination.hasMore) {
          page++;
          // Rate limit - wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      hasMore = false;
    }
  }
  
  console.log(`\n✓ Retrieved ${allAudits.length} total audits from TrustBlock`);
  
  return allAudits;
}

// Test the API
if (require.main === module) {
  getAllTrustBlockAudits()
    .then(audits => {
      console.log('\nSample audits:');
      audits.slice(0, 5).forEach(a => {
        console.log(`- ${a.name} (ID: ${a.id})`);
        console.log(`  URL: https://app.trustblock.run/audit/${a.id}`);
        console.log(`  Project: ${a.project?.name || 'N/A'}`);
        console.log(`  Contract: ${a.contracts?.[0]?.address || 'N/A'}`);
        console.log();
      });
      
      // Save to file
      const fs = require('fs');
      fs.writeFileSync(
        'trustblock-audits.json',
        JSON.stringify(audits, null, 2)
      );
      console.log('✓ Saved to trustblock-audits.json');
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
    });
}

module.exports = getAllTrustBlockAudits;
