/**
 * Scrape Token Address field from audit.cfg.ninja pages
 * Looks for "Token Address" label and extracts the contract
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeTokenAddresses() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Get projects without contracts
    const projects = await db.collection('projects').find({
      published: true,
      $or: [
        { 'contract_info.contract_address': { $exists: false } },
        { 'contract_info.contract_address': null },
        { 'contract_info.contract_address': '' }
      ]
    }).limit(20).toArray(); // Test with 20 first
    
    console.log(`=== Scraping Token Addresses ===`);
    console.log(`Testing with ${projects.length} projects\n`);
    
    // Launch browser
    console.log('Launching browser...\n');
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let updated = 0;
    let failed = 0;
    let notFound = 0;
    const updates = [];
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const url = `https://audit.cfg.ninja/${project.slug}`;
      
      try {
        console.log(`[${i+1}/${projects.length}] ${project.name}...`);
        
        const page = await browser.newPage();
        
        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { 
          waitUntil: 'networkidle0', 
          timeout: 30000 
        });
        
        // Wait a bit for any dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract token address from page
        const tokenData = await page.evaluate(() => {
          // Method 1: Look for "Token Address" text and get the next element
          const elements = Array.from(document.querySelectorAll('*'));
          
          for (let el of elements) {
            const text = el.textContent || el.innerText || '';
            
            // Check for "Token Address" label
            if (text.includes('Token Address') || text.includes('Contract Address')) {
              // Look at siblings, parent, or nearby elements
              const parent = el.parentElement;
              if (parent) {
                const allText = parent.innerText || parent.textContent;
                
                // Try to find address patterns in the parent
                // EVM address pattern
                const evmMatch = allText.match(/0x[a-fA-F0-9]{40}/);
                if (evmMatch) {
                  return { address: evmMatch[0], type: 'EVM', method: 'Token Address label' };
                }
                
                // Solana address pattern
                const solanaMatch = allText.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
                if (solanaMatch && !solanaMatch[0].includes('0x')) {
                  return { address: solanaMatch[0], type: 'Solana', method: 'Token Address label' };
                }
              }
            }
          }
          
          // Method 2: Look for address-like patterns anywhere
          const bodyText = document.body.innerText;
          
          // EVM address
          const evmMatch = bodyText.match(/0x[a-fA-F0-9]{40}/);
          if (evmMatch) {
            return { address: evmMatch[0], type: 'EVM', method: 'Pattern match' };
          }
          
          // Solana address
          const solanaMatch = bodyText.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
          if (solanaMatch && !solanaMatch[0].includes('0x') && !solanaMatch[0].includes('http')) {
            return { address: solanaMatch[0], type: 'Solana', method: 'Pattern match' };
          }
          
          return null;
        });
        
        await page.close();
        
        if (tokenData && tokenData.address) {
          // Validate the address looks reasonable
          if (tokenData.type === 'EVM' && tokenData.address.length === 42) {
            // Update database
            await db.collection('projects').updateOne(
              { _id: project._id },
              {
                $set: {
                  'contract_info.contract_address': tokenData.address,
                  'contract_info.scraped_from': 'audit.cfg.ninja',
                  'contract_info.scraped_at': new Date()
                }
              }
            );
            
            console.log(`  ✓ Found: ${tokenData.address} (${tokenData.type} - ${tokenData.method})`);
            updated++;
            updates.push({
              name: project.name,
              slug: project.slug,
              platform: project.platform,
              contract: tokenData.address,
              type: tokenData.type,
              method: tokenData.method
            });
          } else if (tokenData.type === 'Solana' && tokenData.address.length >= 32) {
            // Update database
            await db.collection('projects').updateOne(
              { _id: project._id },
              {
                $set: {
                  'contract_info.contract_address': tokenData.address,
                  'contract_info.scraped_from': 'audit.cfg.ninja',
                  'contract_info.scraped_at': new Date()
                }
              }
            );
            
            console.log(`  ✓ Found: ${tokenData.address} (${tokenData.type} - ${tokenData.method})`);
            updated++;
            updates.push({
              name: project.name,
              slug: project.slug,
              platform: project.platform,
              contract: tokenData.address,
              type: tokenData.type,
              method: tokenData.method
            });
          } else {
            console.log(`  ⚠ Invalid format: ${tokenData.address} (length: ${tokenData.address.length})`);
            failed++;
          }
        } else {
          console.log(`  ⚠ No token address found`);
          notFound++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        failed++;
      }
    }
    
    await browser.close();
    
    console.log('\n=== Scraping Complete ===\n');
    console.log(`✓ Updated: ${updated} projects`);
    console.log(`⚠ Not found: ${notFound} projects`);
    console.log(`✗ Failed: ${failed} projects`);
    console.log(`Total: ${projects.length}\n`);
    
    if (updates.length > 0) {
      console.log('=== Updated Projects ===\n');
      updates.forEach(u => {
        console.log(`✓ ${u.name} (${u.platform})`);
        console.log(`  Slug: ${u.slug}`);
        console.log(`  Contract: ${u.contract}`);
        console.log(`  Method: ${u.method}`);
        console.log('');
      });
      
      const report = {
        timestamp: new Date().toISOString(),
        updated,
        notFound,
        failed,
        updates
      };
      
      fs.writeFileSync('token-address-scraping-report.json', JSON.stringify(report, null, 2));
      console.log('✓ Saved report to token-address-scraping-report.json\n');
    }
    
    // Show updated stats
    const withContracts = await db.collection('projects').countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    const totalPublished = await db.collection('projects').countDocuments({ published: true });
    
    console.log('=== Database Status ===');
    console.log(`Projects with contracts: ${withContracts}/${totalPublished} (${Math.round(withContracts/totalPublished*100)}%)`);
    
    if (updated > 0) {
      console.log(`\n💡 Test successful! Run without limit to scrape all ${totalPublished - withContracts} remaining projects.`);
      console.log(`   Remove .limit(20) from the query and re-run.\n`);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
  }
}

// Check for --all flag
const runAll = process.argv.includes('--all');

scrapeTokenAddresses();
