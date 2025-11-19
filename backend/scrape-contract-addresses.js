const https = require('https');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

const BASE_URL = 'https://audit.cfg.ninja';
const DELAY_MS = 500; // Delay between requests to be respectful

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simple HTTPS GET request
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Fetch contract address from a project page
 */
async function fetchContractAddress(slug) {
  try {
    const url = `${BASE_URL}/${slug}`;
    console.log(`Fetching: ${url}`);
    
    const html = await httpsGet(url);
    const $ = cheerio.load(html);
    
    // Try multiple selectors to find contract address
    let contractAddress = null;
    
    // Look for contract address in various locations
    // Pattern 1: Look for "Contract Address" label
    $('label, th, td, div, span, p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.match(/contract\s*address/i)) {
        // Get the next element or sibling
        let value = $(elem).next().text().trim();
        if (!value) {
          value = $(elem).siblings().first().text().trim();
        }
        if (!value) {
          value = $(elem).parent().next().text().trim();
        }
        
        // Check if it looks like an address (0x followed by 40 hex chars)
        if (value && value.match(/^0x[a-fA-F0-9]{40}$/)) {
          contractAddress = value;
        }
      }
    });
    
    // Pattern 2: Look for any text that matches contract address pattern
    if (!contractAddress) {
      const bodyText = $('body').text();
      const addressMatch = bodyText.match(/\b(0x[a-fA-F0-9]{40})\b/);
      if (addressMatch) {
        contractAddress = addressMatch[1];
      }
    }
    
    // Pattern 3: Look in specific HTML attributes
    if (!contractAddress) {
      $('[data-address], [data-contract]').each((i, elem) => {
        const addr = $(elem).attr('data-address') || $(elem).attr('data-contract');
        if (addr && addr.match(/^0x[a-fA-F0-9]{40}$/)) {
          contractAddress = addr;
        }
      });
    }
    
    return contractAddress;
  } catch (error) {
    console.error(`Error fetching ${slug}:`, error.message);
    return null;
  }
}

/**
 * Main scraping function
 */
async function scrapeContractAddresses() {
  console.log('🔍 Scraping Contract Addresses from Old Site\n');
  console.log('='.repeat(70) + '\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all published projects
    const projects = await Project.find({ published: true })
      .select('_id name slug contract_info')
      .sort({ createdAt: 1 });
    
    console.log(`📊 Found ${projects.length} published projects\n`);
    
    let updated = 0;
    let notFound = 0;
    let alreadyHave = 0;
    let failed = 0;
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      
      // Skip if already has contract address
      if (project.contract_info?.contract_address) {
        console.log(`⏭️  [${i + 1}/${projects.length}] ${project.name} - Already has address`);
        alreadyHave++;
        continue;
      }
      
      console.log(`\n🔎 [${i + 1}/${projects.length}] Processing: ${project.name}`);
      
      try {
        const contractAddress = await fetchContractAddress(project.slug);
        
        if (contractAddress) {
          // Update the project
          await Project.updateOne(
            { _id: project._id },
            { 
              $set: { 
                'contract_info.contract_address': contractAddress 
              } 
            }
          );
          
          console.log(`✅ Found and saved: ${contractAddress}`);
          updated++;
        } else {
          console.log(`❌ Contract address not found`);
          notFound++;
        }
      } catch (error) {
        console.error(`❌ Failed to process: ${error.message}`);
        failed++;
      }
      
      // Delay between requests
      await sleep(DELAY_MS);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Final Statistics:');
    console.log(`   Total Projects: ${projects.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Already Had Address: ${alreadyHave}`);
    console.log(`   ❌ Not Found: ${notFound}`);
    console.log(`   ⚠️  Failed: ${failed}`);
    console.log('\n' + '='.repeat(70));
    console.log('🎉 Scraping Complete!\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run with --test flag to test on just 5 projects
const isTest = process.argv.includes('--test');

if (isTest) {
  console.log('⚠️  TEST MODE - Will only process first 5 projects\n');
  
  async function testRun() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      const projects = await Project.find({ published: true })
        .select('name slug')
        .limit(5);
      
      console.log('Testing on these projects:');
      for (const p of projects) {
        console.log(`\n🔍 Testing: ${p.name} (${p.slug})`);
        const address = await fetchContractAddress(p.slug);
        console.log(`   Result: ${address || 'NOT FOUND'}`);
        await sleep(DELAY_MS);
      }
      
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error);
      await mongoose.disconnect();
    }
  }
  
  testRun();
} else {
  console.log('⚠️  This will scrape contract addresses from https://audit.cfg.ninja\n');
  console.log('💡 Run with --test flag to test on 5 projects first.\n');
  console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
  
  setTimeout(() => {
    scrapeContractAddresses();
  }, 3000);
}
