/**
 * Scrape contract addresses from audit.cfg.ninja pages
 * Uses Puppeteer to load full page content
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeContractAddresses() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Get projects without contracts that have audit.cfg.ninja pages
    const projects = await db.collection('projects').find({
      published: true,
      $or: [
        { 'contract_info.contract_address': { $exists: false } },
        { 'contract_info.contract_address': null },
        { 'contract_info.contract_address': '' }
      ],
      'socials.website': { $regex: /audit\.cfg\.ninja/i }
    }).toArray();
    
    console.log(`=== Scraping Contract Addresses ===`);
    console.log(`Found ${projects.length} projects with audit pages\n`);
    
    // Launch browser
    console.log('Launching browser...\n');
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let updated = 0;
    let failed = 0;
    const updates = [];
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const url = project.socials?.website || `https://audit.cfg.ninja/${project.slug}`;
      
      try {
        console.log(`[${i+1}/${projects.length}] ${project.name}...`);
        
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Extract contract address from page
        const contractData = await page.evaluate(() => {
          // Method 1: Look for contract address in text
          const bodyText = document.body.innerText;
          
          // EVM address pattern (0x followed by 40 hex chars)
          const evmMatch = bodyText.match(/0x[a-fA-F0-9]{40}/);
          if (evmMatch) {
            return { address: evmMatch[0], type: 'EVM' };
          }
          
          // Solana address pattern (base58, 32-44 chars)
          const solanaMatch = bodyText.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
          if (solanaMatch) {
            // Verify it's not a random string by checking common Solana patterns
            const addr = solanaMatch[0];
            if (!addr.includes('0x') && !addr.includes('http')) {
              return { address: addr, type: 'Solana' };
            }
          }
          
          return null;
        });
        
        await page.close();
        
        if (contractData && contractData.address) {
          // Update database
          await db.collection('projects').updateOne(
            { _id: project._id },
            {
              $set: {
                'contract_info.contract_address': contractData.address,
                'contract_info.scraped_from_web': true
              }
            }
          );
          
          console.log(`  ✓ Found: ${contractData.address} (${contractData.type})`);
          updated++;
          updates.push({
            name: project.name,
            slug: project.slug,
            contract: contractData.address,
            type: contractData.type
          });
        } else {
          console.log(`  ⚠ No contract found on page`);
          failed++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        failed++;
      }
    }
    
    await browser.close();
    
    console.log('\n=== Scraping Complete ===\n');
    console.log(`✓ Updated: ${updated} projects`);
    console.log(`✗ Failed: ${failed} projects`);
    console.log(`Total: ${projects.length}\n`);
    
    if (updates.length > 0) {
      console.log('=== Updated Projects ===\n');
      updates.forEach(u => {
        console.log(`✓ ${u.name} (${u.slug})`);
        console.log(`  Contract: ${u.contract}`);
        console.log(`  Type: ${u.type}`);
        console.log('');
      });
      
      fs.writeFileSync(
        'web-scraping-report.json',
        JSON.stringify({ 
          timestamp: new Date().toISOString(),
          updated, 
          failed,
          updates 
        }, null, 2)
      );
      console.log('✓ Saved report to web-scraping-report.json\n');
    }
    
    // Show updated stats
    const withContracts = await db.collection('projects').countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    const totalPublished = await db.collection('projects').countDocuments({ published: true });
    
    console.log('=== Database Status ===');
    console.log(`Projects with contracts: ${withContracts}/${totalPublished} (${Math.round(withContracts/totalPublished*100)}%)`);
    console.log(`Projects without contracts: ${totalPublished - withContracts}\n`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
  }
}

scrapeContractAddresses();
