const { MongoClient } = require('mongodb');
const https = require('https');
const cheerio = require('cheerio');
require('dotenv').config();

const TRUSTBLOCK_AUDITOR_URL = 'https://app.trustblock.run/auditor/cfg-ninja';

async function fetchTrustBlockPage(url) {
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

async function scrapeTrustBlockAudits() {
  console.log('Fetching TrustBlock auditor page...\n');
  
  try {
    const html = await fetchTrustBlockPage(TRUSTBLOCK_AUDITOR_URL);
    const $ = cheerio.load(html);
    
    const audits = [];
    
    // Try multiple selectors to find audit links
    const selectors = [
      'a[href*="/audit/"]',
      'a[href*="/report/"]',
      '[data-audit-id]',
      '.audit-card',
      '.report-card'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const name = $elem.text().trim() || $elem.attr('title') || $elem.attr('data-name');
        
        if (href && href.includes('/audit/')) {
          const auditId = href.split('/audit/')[1]?.split('/')[0]?.split('?')[0];
          if (auditId && name) {
            audits.push({
              id: auditId,
              name: name,
              url: href.startsWith('http') ? href : `https://app.trustblock.run${href}`
            });
          }
        }
      });
    }
    
    // Remove duplicates
    const uniqueAudits = Array.from(new Map(audits.map(a => [a.id, a])).values());
    
    console.log(`Found ${uniqueAudits.length} unique audits from HTML scraping\n`);
    
    // Also try to find JSON data embedded in the page
    const scriptTags = $('script');
    scriptTags.each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes('audits') && content.includes('{')) {
        try {
          // Try to extract JSON data
          const jsonMatch = content.match(/\{[^{}]*"audits"[^{}]*\}/);
          if (jsonMatch) {
            console.log('Found embedded JSON data in script tag');
            // This would need more parsing based on actual structure
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    return uniqueAudits;
    
  } catch (error) {
    console.error('Error fetching page:', error.message);
    return [];
  }
}

async function reconcileWithDatabase(trustblockAudits) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    // Get all projects
    const allProjects = await collection.find({ published: true }).toArray();
    
    console.log('=== Reconciliation Analysis ===\n');
    console.log(`TrustBlock audits found: ${trustblockAudits.length}`);
    console.log(`Database projects: ${allProjects.length}`);
    console.log(`Projects with trustblock_url: ${allProjects.filter(p => p.trustblock_url).length}\n`);
    
    // Match audits with database projects
    let matched = 0;
    let updated = 0;
    let notInDb = [];
    
    for (const audit of trustblockAudits) {
      // Try to find matching project by name (case-insensitive)
      const project = allProjects.find(p => {
        const projectName = (p.name || p.project_name || '').toLowerCase();
        const auditName = audit.name.toLowerCase();
        return projectName === auditName || 
               projectName.includes(auditName) || 
               auditName.includes(projectName);
      });
      
      if (project) {
        matched++;
        
        // Update if not already linked
        if (!project.trustblock_url) {
          await collection.updateOne(
            { _id: project._id },
            {
              $set: {
                trustblock_id: audit.id,
                trustblock_url: audit.url,
                trustblock_matched_at: new Date(),
                trustblock_matched_by: 'scraper'
              }
            }
          );
          updated++;
          console.log(`✓ Matched and updated: ${audit.name} → ${project.name || project.project_name}`);
        } else {
          console.log(`○ Already linked: ${audit.name}`);
        }
      } else {
        notInDb.push(audit);
      }
    }
    
    console.log('\n=== Reconciliation Summary ===');
    console.log(`✓ Matched: ${matched}`);
    console.log(`✓ Updated database: ${updated}`);
    console.log(`✗ Not in database: ${notInDb.length}\n`);
    
    if (notInDb.length > 0) {
      console.log('Audits on TrustBlock but not in database (first 50):');
      notInDb.slice(0, 50).forEach(audit => {
        console.log(`  - ${audit.name} (${audit.id})`);
      });
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      trustblock_count: trustblockAudits.length,
      database_count: allProjects.length,
      matched: matched,
      updated: updated,
      not_in_database: notInDb.length,
      not_in_database_list: notInDb.map(a => ({ name: a.name, id: a.id, url: a.url }))
    };
    
    const fs = require('fs');
    fs.writeFileSync('trustblock-reconciliation-report.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Saved detailed report to trustblock-reconciliation-report.json');
    
    // Save audit list
    fs.writeFileSync('trustblock-all-audits.json', JSON.stringify(trustblockAudits, null, 2));
    console.log('✓ Saved audit list to trustblock-all-audits.json');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('=== TrustBlock Auditor Page Scraper ===\n');
  console.log('Note: TrustBlock may use client-side rendering or pagination.');
  console.log('If we only get a few audits, we may need to use a headless browser.\n');
  
  const audits = await scrapeTrustBlockAudits();
  
  if (audits.length === 0) {
    console.log('\n⚠ No audits found. TrustBlock likely uses client-side rendering.');
    console.log('The page shows 685 audits but they are loaded via JavaScript.');
    console.log('\nOptions:');
    console.log('1. Use TrustBlock API (if they have a GET endpoint)');
    console.log('2. Use headless browser (Puppeteer/Playwright)');
    console.log('3. Manual export from TrustBlock dashboard');
    console.log('4. Contact TrustBlock for audit list export\n');
    
    // Try to check if there's an API endpoint in the HTML
    console.log('Checking for API endpoints in page source...');
    const html = await fetchTrustBlockPage(TRUSTBLOCK_AUDITOR_URL);
    const apiMatches = html.match(/api\.trustblock\.run[^"'\s]*/g);
    if (apiMatches) {
      console.log('\nFound API endpoints:');
      [...new Set(apiMatches)].forEach(endpoint => console.log(`  - ${endpoint}`));
    }
    
    return;
  }
  
  console.log(`\n✓ Successfully scraped ${audits.length} audits`);
  console.log('\nStarting database reconciliation...\n');
  
  await reconcileWithDatabase(audits);
}

main().catch(console.error);
