/**
 * Scrape all audits from CFG Ninja's TrustBlock auditor page
 * URL: https://app.trustblock.run/auditor/cfg-ninja
 */

const https = require('https');
const cheerio = require('cheerio');

async function scrapeTrustBlockAudits() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'app.trustblock.run',
      path: '/auditor/cfg-ninja',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let html = '';
      
      res.on('data', (chunk) => {
        html += chunk;
      });
      
      res.on('end', () => {
        try {
          const $ = cheerio.load(html);
          const audits = [];
          
          // TrustBlock uses Next.js - data is embedded in JSON
          const scripts = $('script[type="application/json"]');
          
          // Try to find embedded data
          let foundData = false;
          scripts.each((i, script) => {
            const content = $(script).html();
            if (content && content.includes('audit')) {
              try {
                const data = JSON.parse(content);
                console.log('Found embedded data script:', i);
                // Parse the data structure
                foundData = true;
              } catch (e) {
                // Not valid JSON or not the right script
              }
            }
          });
          
          // Alternative: scrape from HTML structure
          $('a[href^="/audit/"]').each((i, elem) => {
            const url = $(elem).attr('href');
            const auditId = url.replace('/audit/', '');
            const name = $(elem).text().trim();
            
            if (name && auditId) {
              audits.push({
                name: name,
                auditId: auditId,
                url: `https://app.trustblock.run/audit/${auditId}`
              });
            }
          });
          
          console.log(`\nScraped ${audits.length} audits from TrustBlock`);
          console.log('\nFirst 5 audits:');
          audits.slice(0, 5).forEach(a => {
            console.log(`- ${a.name}: ${a.url}`);
          });
          
          resolve(audits);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Test the scraper
if (require.main === module) {
  scrapeTrustBlockAudits()
    .then(audits => {
      console.log(`\n✓ Successfully scraped ${audits.length} audits`);
    })
    .catch(error => {
      console.error('Error:', error.message);
    });
}

module.exports = scrapeTrustBlockAudits;
