/**
 * Simple script to scrape contract addresses from old site
 * Run with: NODE_OPTIONS="--no-warnings" node scrape-addresses-simple.js
 */

const https = require('https');
const fs = require('fs');

const BASE_URL = 'audit.cfg.ninja';
const PROJECTS_FILE = 'project-slugs.json'; // File with project slugs

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractContractAddress(html) {
  // Look for contract address pattern (0x followed by 40 hex characters)
  const matches = html.match(/\b(0x[a-fA-F0-9]{40})\b/g);
  
  if (matches && matches.length > 0) {
    // Return the first match (usually the contract address)
    return matches[0];
  }
  
  return null;
}

async function scrapeAddresses() {
  console.log('🔍 Scraping Contract Addresses\n');
  
  try {
    // Read project slugs from file
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    
    console.log(`📊 Found ${projectsData.length} projects to process\n`);
    
    const results = [];
    let found = 0;
    let notFound = 0;
    
    const limit = process.argv.includes('--all') ? projectsData.length : 10;
    console.log(`Processing ${limit} projects...\n`);
    
    for (let i = 0; i < Math.min(projectsData.length, limit); i++) {
      const project = projectsData[i];
      const slug = project.slug;
      const name = project.name;
      
      try {
        console.log(`[${i + 1}/${projectsData.length}] ${name} (${slug})`);
        
        const html = await httpsGet(`/${slug}`);
        const address = extractContractAddress(html);
        
        if (address) {
          console.log(`  ✅ Found: ${address}`);
          results.push({ name, slug, address, found: true });
          found++;
        } else {
          console.log(`  ❌ Not found`);
          results.push({ name, slug, address: null, found: false });
          notFound++;
        }
        
        await sleep(500);
      } catch (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
        results.push({ name, slug, address: null, found: false, error: error.message });
        notFound++;
      }
    }
    
    // Save results
    fs.writeFileSync('contract-addresses.json', JSON.stringify(results, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Found: ${found}`);
    console.log(`❌ Not Found: ${notFound}`);
    console.log(`📁 Results saved to contract-addresses.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

scrapeAddresses();
