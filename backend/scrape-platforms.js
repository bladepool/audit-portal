const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

// Read the project slugs
const projectSlugs = JSON.parse(fs.readFileSync('./project-slugs.json', 'utf8'));

const results = [];
let processedCount = 0;

function scrapeProjectPlatform(slug) {
  return new Promise((resolve) => {
    const url = `https://audit.cfg.ninja/${slug}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Look for platform/ecosystem information in the HTML
          // Common patterns:
          // 1. "Platform:" or "Ecosystem:" label
          // 2. Chain/Network information
          // 3. Smart chain references
          
          let platform = null;
          let ecosystem = null;
          
          // Pattern 1: Look for explicit Platform or Ecosystem labels
          const platformMatch = data.match(/Platform[:\s]+([A-Za-z0-9\s]+?)(?:<|&lt;|\/)/i);
          const ecosystemMatch = data.match(/Ecosystem[:\s]+([A-Za-z0-9\s]+?)(?:<|&lt;|\/)/i);
          
          // Pattern 2: Look for network/chain mentions
          const networkMatch = data.match(/Network[:\s]+([A-Za-z0-9\s]+?)(?:<|&lt;|\/)/i);
          const chainMatch = data.match(/Chain[:\s]+([A-Za-z0-9\s]+?)(?:<|&lt;|\/)/i);
          
          // Pattern 3: Look for specific blockchain names in the content
          const blockchainPatterns = [
            /ethereum/i,
            /polygon/i,
            /avalanche/i,
            /arbitrum/i,
            /optimism/i,
            /fantom/i,
            /cronos/i,
            /base/i,
            /solana/i,
            /tron/i,
            /cardano/i,
            /bsc/i,
            /bnb\s+chain/i,
            /binance\s+smart\s+chain/i
          ];
          
          if (platformMatch) {
            platform = platformMatch[1].trim();
          } else if (ecosystemMatch) {
            ecosystem = ecosystemMatch[1].trim();
          } else if (networkMatch) {
            platform = networkMatch[1].trim();
          } else if (chainMatch) {
            platform = chainMatch[1].trim();
          } else {
            // Try to find blockchain mentions
            for (const pattern of blockchainPatterns) {
              if (pattern.test(data)) {
                platform = data.match(pattern)[0];
                break;
              }
            }
          }
          
          // Clean up the extracted values
          if (platform) {
            platform = platform
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/&[^;]+;/g, '') // Remove HTML entities
              .trim();
          }
          
          if (ecosystem) {
            ecosystem = ecosystem
              .replace(/<[^>]*>/g, '')
              .replace(/&[^;]+;/g, '')
              .trim();
          }
          
          resolve({ platform, ecosystem });
        } catch (error) {
          console.error(`Error parsing ${slug}:`, error.message);
          resolve({ platform: null, ecosystem: null });
        }
      });
    }).on('error', (error) => {
      console.error(`HTTP error for ${slug}:`, error.message);
      resolve({ platform: null, ecosystem: null });
    });
  });
}

async function scrapeAllPlatforms() {
  console.log(`\n🔍 Scraping platform data for ${projectSlugs.length} projects...\n`);
  
  const scrapeAll = process.argv.includes('--all');
  const limit = scrapeAll ? projectSlugs.length : 10;
  
  for (let i = 0; i < limit; i++) {
    const { slug, name } = projectSlugs[i];
    
    console.log(`[${i + 1}/${limit}] ${name} (${slug})`);
    
    const { platform, ecosystem } = await scrapeProjectPlatform(slug);
    
    if (platform || ecosystem) {
      console.log(`  ✅ Platform: ${platform || 'N/A'}, Ecosystem: ${ecosystem || 'N/A'}`);
      results.push({ slug, name, platform, ecosystem });
    } else {
      console.log(`  ❌ No platform/ecosystem found`);
      results.push({ slug, name, platform: null, ecosystem: null });
    }
    
    processedCount++;
    
    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save results to JSON file
  fs.writeFileSync('./platform-data.json', JSON.stringify(results, null, 2));
  
  console.log(`\n============================================================`);
  console.log(`✅ Found: ${results.filter(r => r.platform || r.ecosystem).length}`);
  console.log(`❌ Not Found: ${results.filter(r => !r.platform && !r.ecosystem).length}`);
  console.log(`📁 Results saved to platform-data.json`);
}

scrapeAllPlatforms().catch(console.error);
