const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function scrapeAllTrustBlockAudits() {
  console.log('=== TrustBlock Full Audit Scraper ===\n');
  console.log('Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to TrustBlock auditor page...');
    await page.goto('https://app.trustblock.run/auditor/cfg-ninja', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Waiting for audits to load...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Scroll to load all audits (if using infinite scroll)
    console.log('Scrolling to load all audits...');
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;
    
    while (scrollAttempts < maxScrollAttempts) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if new content loaded
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      if (currentHeight === previousHeight) {
        console.log(`No new content loaded after ${scrollAttempts + 1} scrolls`);
        break;
      }
      
      previousHeight = currentHeight;
      scrollAttempts++;
      
      // Count audits so far
      const auditCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href*="/audit/"]').length;
      });
      
      console.log(`  Scroll ${scrollAttempts}: Found ${auditCount} audits`);
      
      if (auditCount >= 685) {
        console.log('  ✓ Reached expected count (685)');
        break;
      }
    }
    
    console.log('\nExtracting audit data...');
    
    // Extract all audit links and data
    const audits = await page.evaluate(() => {
      const auditElements = document.querySelectorAll('a[href*="/audit/"]');
      const auditData = [];
      
      auditElements.forEach(elem => {
        const href = elem.getAttribute('href');
        const auditId = href.split('/audit/')[1]?.split('/')[0]?.split('?')[0];
        
        if (!auditId) return;
        
        // Try to get the project name from various possible elements
        let name = elem.textContent?.trim();
        
        // If the link itself doesn't have text, look for nearby elements
        if (!name || name.length < 2) {
          const parent = elem.closest('[class*="card"], [class*="item"], [class*="audit"]');
          if (parent) {
            const nameElem = parent.querySelector('[class*="title"], [class*="name"], h2, h3, h4');
            if (nameElem) {
              name = nameElem.textContent?.trim();
            }
          }
        }
        
        // Skip if we couldn't get a name
        if (!name || name.length < 2) return;
        
        // Clean up the name
        name = name.replace(/\s+/g, ' ').trim();
        
        auditData.push({
          id: auditId,
          name: name,
          url: href.startsWith('http') ? href : `https://app.trustblock.run${href}`
        });
      });
      
      // Remove duplicates based on ID
      const uniqueAudits = Array.from(new Map(auditData.map(a => [a.id, a])).values());
      
      return uniqueAudits;
    });
    
    console.log(`\n✓ Successfully extracted ${audits.length} unique audits\n`);
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('trustblock-all-audits-scraped.json', JSON.stringify(audits, null, 2));
    console.log('✓ Saved to trustblock-all-audits-scraped.json\n');
    
    // Show sample
    console.log('Sample audits:');
    audits.slice(0, 10).forEach((audit, i) => {
      console.log(`  ${i + 1}. ${audit.name} (${audit.id})`);
    });
    console.log(`  ... and ${audits.length - 10} more\n`);
    
    return audits;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function reconcileWithDatabase(audits) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    const allProjects = await collection.find({ published: true }).toArray();
    
    console.log('=== Reconciliation ===\n');
    console.log(`TrustBlock audits: ${audits.length}`);
    console.log(`Database projects: ${allProjects.length}`);
    console.log(`Already linked: ${allProjects.filter(p => p.trustblock_url).length}\n`);
    
    let matched = 0;
    let updated = 0;
    let notInDb = [];
    
    for (const audit of audits) {
      // Find matching project
      const project = allProjects.find(p => {
        const projectName = (p.name || p.project_name || '').toLowerCase().trim();
        const auditName = audit.name.toLowerCase().trim();
        
        // Exact match
        if (projectName === auditName) return true;
        
        // Partial match
        if (projectName.includes(auditName) || auditName.includes(projectName)) {
          // Only match if names are similar enough (at least 50% overlap)
          const minLen = Math.min(projectName.length, auditName.length);
          if (minLen >= 3) return true;
        }
        
        return false;
      });
      
      if (project) {
        matched++;
        
        if (!project.trustblock_url) {
          await collection.updateOne(
            { _id: project._id },
            {
              $set: {
                trustblock_id: audit.id,
                trustblock_url: audit.url,
                trustblock_scraped_at: new Date(),
                'socials.trustblock': audit.url
              }
            }
          );
          updated++;
          console.log(`✓ ${audit.name} → ${project.name || project.project_name}`);
        }
      } else {
        notInDb.push(audit);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✓ Matched: ${matched}`);
    console.log(`✓ Updated: ${updated}`);
    console.log(`✗ Not in DB: ${notInDb.length}\n`);
    
    if (notInDb.length > 0) {
      console.log('Audits on TrustBlock but not in database:');
      console.log(`(Showing first 100 of ${notInDb.length})\n`);
      notInDb.slice(0, 100).forEach(audit => {
        console.log(`  - ${audit.name}`);
      });
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      trustblock_total: audits.length,
      database_total: allProjects.length,
      matched: matched,
      updated: updated,
      not_in_database: notInDb.length,
      not_in_database_list: notInDb
    };
    
    const fs = require('fs');
    fs.writeFileSync('trustblock-full-reconciliation.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Saved report to trustblock-full-reconciliation.json');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    const audits = await scrapeAllTrustBlockAudits();
    
    if (audits.length > 0) {
      console.log('\nStarting database reconciliation...\n');
      await reconcileWithDatabase(audits);
      
      console.log('\n✓ Complete!');
      console.log('\nNext steps:');
      console.log('1. Review trustblock-full-reconciliation.json');
      console.log('2. Check audits that are on TrustBlock but not in database');
      console.log('3. These may be old audits that need to be imported\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
