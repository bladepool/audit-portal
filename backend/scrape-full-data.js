const https = require('https');
const fs = require('fs');

// Read the project slugs
const projectSlugs = JSON.parse(fs.readFileSync('./project-slugs.json', 'utf8'));

const results = [];
let processedCount = 0;

function extractValue(html, pattern, defaultValue = null) {
  const match = html.match(pattern);
  return match ? match[1].trim() : defaultValue;
}

function extractNumber(html, pattern, defaultValue = 0) {
  const value = extractValue(html, pattern, defaultValue.toString());
  return parseInt(value.replace(/,/g, '')) || defaultValue;
}

function scrapeProjectData(slug) {
  return new Promise((resolve) => {
    const url = `https://audit.cfg.ninja/${slug}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const projectData = {
            slug,
            
            // Timeline
            timeline: {
              audit_request: extractValue(data, /Audit Request[:\s]+<[^>]*>([^<]+)</i),
              onboarding_process: extractValue(data, /Onboarding Process[:\s]+<[^>]*>([^<]+)</i),
              audit_preview: extractValue(data, /Audit Preview[:\s]+<[^>]*>([^<]+)</i),
              audit_release: extractValue(data, /Audit Release[:\s]+<[^>]*>([^<]+)</i),
            },
            
            // Token Analysis
            token_name: extractValue(data, /Token Name[:\s]+<[^>]*>([^<]+)</i),
            symbol: extractValue(data, /Token Symbol[:\s]+<[^>]*>([^<]+)</i),
            
            contract_info: {
              contract_address: extractValue(data, /Token Address[:\s]+<[^>]*>(0x[a-fA-F0-9]+)</i) || 
                               extractValue(data, /contract[_\s]*address[:\s]+<[^>]*>(0x[a-fA-F0-9]{40})/i),
              contract_name: extractValue(data, /Contract Name[:\s]+<[^>]*>([^<]+)</i),
              contract_language: extractValue(data, /Contract Language[:\s]+<[^>]*>([^<]+)</i, 'Solidity'),
              contract_created: extractValue(data, /Contract Created[:\s]+<[^>]*>([^<]+)</i),
              contract_compiler: extractValue(data, /Compiler[:\s]+<[^>]*>([^<]+)</i),
              contract_license: extractValue(data, /Sol License[:\s]+<[^>]*>([^<]+)</i),
              contract_verified: data.match(/Contract Verified[:\s]+<[^>]*>Yes/i) ? true : false,
            },
            
            decimals: extractNumber(data, /Token Decimals[:\s]+<[^>]*>(\d+)</i, 18),
            supply: extractValue(data, /Token Total Supply[:\s]+<[^>]*>([\d,]+)</i, '0'),
            platform: extractValue(data, /Platform[:\s]+<[^>]*>([^<]+)</i, 'BNBCHAIN'),
            
            // Owner & Deployer
            contract_info_owner: extractValue(data, /Owner Address[:\s]+<[^>]*>(0x[a-fA-F0-9]+)/i),
            contract_info_deployer: extractValue(data, /Deployer Address[:\s]+<[^>]*>(0x[a-fA-F0-9]+)/i),
            
            // Manual Code Review Results
            overview: {
              mint: data.match(/Can Mint\?[:\s]+<[^>]*>Fail/i) ? true : false,
              max_tax: data.match(/Edit Taxes over 25%[:\s]+<[^>]*>Fail/i) ? true : false,
              max_transaction: data.match(/Max Transaction[:\s]+<[^>]*>Fail/i) ? true : false,
              max_wallet: data.match(/Max Wallet[:\s]+<[^>]*>Fail/i) ? true : false,
              enable_trading: data.match(/Enable Trade[:\s]+<[^>]*>Fail/i) ? true : false,
              modify_tax: data.match(/Modify Tax[:\s]+<[^>]*>Fail/i) ? true : false,
              honeypot: data.match(/Honeypot[:\s]+<[^>]*>Fail/i) ? true : false,
              trading_cooldown: data.match(/Trading Cooldown[:\s]+<[^>]*>Fail/i) ? true : false,
              pause_transfer: data.match(/Transfer Pausable[:\s]+<[^>]*>Fail/i) ? true : false,
              pause_trade: data.match(/Can Pause Trade\?[:\s]+<[^>]*>Fail/i) ? true : false,
              anti_bot: data.match(/Anti Bot[:\s]+<[^>]*>Pass/i) ? true : false,
              anit_whale: data.match(/Antiwhale[:\s]+<[^>]*>Pass/i) ? true : false,
              proxy_check: data.match(/Proxy Contract[:\s]+<[^>]*>Fail/i) ? true : false,
              blacklist: data.match(/Blacklisted[:\s]+<[^>]*>Fail/i) ? true : false,
              hidden_owner: data.match(/Hidden Ownership[:\s]+<[^>]*>Fail/i) ? true : false,
              buy_tax: extractNumber(data, /Buy Tax[:\s]+<[^>]*>(\d+)/i, 0),
              sell_tax: extractNumber(data, /Sell Tax[:\s]+<[^>]*>(\d+)/i, 0),
              self_destruct: data.match(/Selfdestruct[:\s]+<[^>]*>Fail/i) ? true : false,
              whitelist: data.match(/Whitelisted[:\s]+<[^>]*>Pass/i) ? true : false,
              external_call: data.match(/External Call[:\s]+<[^>]*>Fail/i) ? true : false,
            },
            
            // Scores and Findings
            audit_score: extractNumber(data, /Code Security[^<]*<[^>]*>(\d+)/i, 80) || 
                        extractNumber(data, /Audit Security Score[^<]*<[^>]*>(\d+)/i, 80),
            
            // Findings
            critical: {
              found: extractNumber(data, /(\d+)\s*Critical/i, 0),
              pending: extractNumber(data, /(\d+)\s*Pending[^<]*Critical/i, 0),
              resolved: extractNumber(data, /(\d+)\s*Resolved[^<]*Critical/i, 0),
            },
            major: {
              found: extractNumber(data, /(\d+)\s*High/i, 0),
              pending: extractNumber(data, /(\d+)\s*Pending[^<]*High/i, 0),
              resolved: extractNumber(data, /(\d+)\s*Resolved[^<]*High/i, 0),
            },
            medium: {
              found: extractNumber(data, /(\d+)\s*Medium/i, 0),
              pending: extractNumber(data, /(\d+)\s*Pending[^<]*Medium/i, 0),
              resolved: extractNumber(data, /(\d+)\s*Resolved[^<]*Medium/i, 0),
            },
            minor: {
              found: extractNumber(data, /(\d+)\s*Low/i, 0),
              pending: extractNumber(data, /(\d+)\s*Pending[^<]*Low/i, 0),
              resolved: extractNumber(data, /(\d+)\s*Resolved[^<]*Low/i, 0),
            },
            
            // Community
            total_votes: extractNumber(data, /(\d+)\s*Votes/i, 0),
            page_view: extractNumber(data, /(\d+)\s*Visits/i, 0),
            
            // Audit Confidence (stars)
            audit_confidence: extractValue(data, /Audit Confidence[^<]*<[^>]*>([^<]+)</i, 'Medium'),
          };
          
          resolve(projectData);
        } catch (error) {
          console.error(`Error parsing ${slug}:`, error.message);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error(`HTTP error for ${slug}:`, error.message);
      resolve(null);
    });
  });
}

async function scrapeAllData() {
  console.log(`\n🔍 Scraping comprehensive data for ${projectSlugs.length} projects...\n`);
  
  const scrapeAll = process.argv.includes('--all');
  const limit = scrapeAll ? projectSlugs.length : 10;
  
  for (let i = 0; i < limit; i++) {
    const { slug, name } = projectSlugs[i];
    
    console.log(`[${i + 1}/${limit}] ${name} (${slug})`);
    
    const projectData = await scrapeProjectData(slug);
    
    if (projectData) {
      console.log(`  ✅ Scraped: Score=${projectData.audit_score}, Votes=${projectData.total_votes}, Views=${projectData.page_view}`);
      results.push(projectData);
    } else {
      console.log(`  ❌ Failed to scrape`);
    }
    
    processedCount++;
    
    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save results to JSON file
  fs.writeFileSync('./full-project-data.json', JSON.stringify(results, null, 2));
  
  console.log(`\n============================================================`);
  console.log(`✅ Successfully scraped: ${results.length}`);
  console.log(`❌ Failed: ${limit - results.length}`);
  console.log(`📁 Results saved to full-project-data.json`);
}

scrapeAllData().catch(console.error);
