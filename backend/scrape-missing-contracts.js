const { MongoClient } = require('mongodb');
const https = require('https');
const cheerio = require('cheerio');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fetchPageContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function extractContractAddress(html, platform) {
  const $ = cheerio.load(html);
  
  let address = null;
  
  // Get all text content
  const text = $('body').text();
  
  if (platform === 'Solana') {
    // Solana addresses are 32-44 characters, base58
    // Look for "Contract Address:" or "Token Address:" followed by address
    const solanaMatch = text.match(/(?:Contract|Token|Address)[:\s]+([1-9A-HJ-NP-Za-km-z]{32,44})/);
    if (solanaMatch && solanaMatch[1]) {
      address = solanaMatch[1];
    } else {
      // Try to find any valid Solana address in the text
      const matches = text.match(/\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g);
      if (matches && matches.length > 0) {
        // Take the first one that's not a common word
        for (const match of matches) {
          if (match.length >= 32 && match.length <= 44) {
            address = match;
            break;
          }
        }
      }
    }
  } else {
    // EVM addresses (BSC, Ethereum, Base, etc)
    // Look for 0x followed by 40 hex characters
    const evmMatch = text.match(/\b(0x[a-fA-F0-9]{40})\b/);
    if (evmMatch && evmMatch[1]) {
      address = evmMatch[1];
    }
  }
  
  return address;
}

async function scrapeContract(slug, platform) {
  const url = `https://audit.cfg.ninja/${slug}`;
  
  try {
    console.log(`  Fetching ${url}...`);
    const html = await fetchPageContent(url);
    const address = extractContractAddress(html, platform);
    
    if (address) {
      console.log(`  ✓ Found: ${address}`);
      return address;
    } else {
      console.log(`  ✗ No contract address found`);
      return null;
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    // Find projects without contract addresses (checking all possible fields)
    const allProjects = await collection.find({
      published: true
    }).toArray();
    
    // Filter projects that don't have ANY contract address
    const projectsWithoutContracts = allProjects.filter(project => {
      const contractAddress = project.contract_address ||
                              project.audit_results?.contract_address ||
                              project.address ||
                              project.contract_info?.contract_address ||
                              '';
      return !contractAddress || contractAddress.length === 0;
    });
    
    console.log(`Found ${projectsWithoutContracts.length} projects without contract addresses\n`);
    
    // Group by platform for summary
    const byPlatform = {};
    projectsWithoutContracts.forEach(p => {
      const platform = p.blockchain_platform || 'Unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    });
    
    console.log('Breakdown by platform:');
    Object.keys(byPlatform).sort((a, b) => byPlatform[b] - byPlatform[a]).forEach(platform => {
      console.log(`  ${platform}: ${byPlatform[platform]}`);
    });
    
    console.log('\n=== Scraping Contract Addresses ===\n');
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    for (let i = 0; i < projectsWithoutContracts.length; i++) {
      const project = projectsWithoutContracts[i];
      const projectName = project.name || project.project_name || 'Unknown';
      const platform = project.platform || project.blockchain_platform || 'Unknown';
      
      console.log(`[${i + 1}/${projectsWithoutContracts.length}] ${projectName} (${platform})`)  ;
      
      const address = await scrapeContract(project.slug, platform);
      
      if (address) {
        // Update database
        await collection.updateOne(
          { _id: project._id },
          { 
            $set: { 
              contract_address: address,
              contract_updated_at: new Date(),
              contract_updated_by: 'scraper'
            } 
          }
        );
        updated++;
        console.log(`  ✓ Updated database\n`);
      } else {
        notFound++;
        console.log('');
      }
      
      // Rate limiting - wait 500ms between requests
      if (i < projectsWithoutContracts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✓ Updated: ${updated}`);
    console.log(`✗ Not found: ${notFound}`);
    console.log(`⚠ Errors: ${errors}`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      total_scanned: projectsWithoutContracts.length,
      updated: updated,
      not_found: notFound,
      errors: errors,
      by_platform: byPlatform
    };
    
    const fs = require('fs');
    fs.writeFileSync('contract-scraping-report.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Saved report to contract-scraping-report.json');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
