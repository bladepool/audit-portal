const https = require('https');

// Try various TrustBlock API endpoints to fetch all audits
async function tryTrustBlockAPIEndpoints() {
  const apiKey = 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M';
  
  const endpoints = [
    // Public endpoints (no auth)
    '/v1/auditor/cfg-ninja/audits',
    '/v1/auditors/cfg-ninja/audits',
    '/v1/auditor/cfg-ninja',
    '/v1/reports?auditor=cfg-ninja&limit=1000',
    '/v1/audits?auditor=cfg-ninja&limit=1000',
    '/v1/audit?auditorSlug=cfg-ninja&limit=1000',
    '/v1/audit?auditor=cfg-ninja',
    '/auditor/cfg-ninja/reports',
    '/public/auditor/cfg-ninja',
    '/public/audits?auditor=cfg-ninja',
    
    // With pagination
    '/v1/reports?page=1&limit=100&auditor=cfg-ninja',
    '/v1/audits?page=1&limit=100&auditor=cfg-ninja',
    
    // Search endpoints
    '/v1/search?auditor=cfg-ninja',
    '/v1/reports/search?auditor=cfg-ninja',
  ];
  
  console.log('=== Testing TrustBlock API Endpoints ===\n');
  
  for (const endpoint of endpoints) {
    const url = `https://api.trustblock.run${endpoint}`;
    console.log(`Testing: ${endpoint}`);
    
    try {
      const result = await makeRequest(url, apiKey);
      console.log(`  ✓ SUCCESS! Status: 200`);
      console.log(`  Response preview: ${JSON.stringify(result).substring(0, 200)}...\n`);
      
      // Save successful response
      const fs = require('fs');
      fs.writeFileSync('trustblock-api-success.json', JSON.stringify({
        endpoint: endpoint,
        url: url,
        response: result
      }, null, 2));
      
      return { endpoint, result };
      
    } catch (error) {
      console.log(`  ✗ ${error.message}`);
    }
  }
  
  console.log('\n❌ No working endpoint found\n');
  return null;
}

function makeRequest(url, apiKey, includeAuth = true) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    if (includeAuth) {
      options.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Also try to fetch the page and look for GraphQL or other API calls
async function analyzePageForAPICalls() {
  console.log('\n=== Analyzing Page Source for API Calls ===\n');
  
  return new Promise((resolve) => {
    https.get('https://app.trustblock.run/auditor/cfg-ninja', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Look for API endpoints
        const apiMatches = data.match(/https?:\/\/[^"'\s]*api[^"'\s]*/gi);
        const endpointMatches = data.match(/\/v\d+\/[^"'\s]*/g);
        const graphqlMatches = data.match(/graphql[^"'\s]*/gi);
        
        console.log('API URLs found in HTML:');
        if (apiMatches) {
          [...new Set(apiMatches)].slice(0, 10).forEach(m => console.log(`  - ${m}`));
        } else {
          console.log('  (none)');
        }
        
        console.log('\nAPI endpoints found:');
        if (endpointMatches) {
          [...new Set(endpointMatches)].slice(0, 10).forEach(m => console.log(`  - ${m}`));
        } else {
          console.log('  (none)');
        }
        
        console.log('\nGraphQL endpoints:');
        if (graphqlMatches) {
          [...new Set(graphqlMatches)].forEach(m => console.log(`  - ${m}`));
        } else {
          console.log('  (none)');
        }
        
        // Look for Next.js data
        const nextDataMatch = data.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
        if (nextDataMatch) {
          console.log('\n✓ Found Next.js __NEXT_DATA__');
          try {
            const nextData = JSON.parse(nextDataMatch[1]);
            console.log('  Next.js data structure:', Object.keys(nextData));
            if (nextData.props?.pageProps) {
              console.log('  Page props:', Object.keys(nextData.props.pageProps));
            }
          } catch (e) {
            console.log('  (could not parse)');
          }
        }
        
        resolve();
      });
    });
  });
}

async function main() {
  // Try API endpoints first
  const success = await tryTrustBlockAPIEndpoints();
  
  if (!success) {
    // Analyze page for clues
    await analyzePageForAPICalls();
    
    console.log('\n=== Recommendations ===\n');
    console.log('Since TrustBlock uses client-side rendering, we have these options:\n');
    console.log('1. Use Puppeteer/Playwright for headless browser scraping');
    console.log('2. Reverse engineer their frontend API calls (check browser DevTools Network tab)');
    console.log('3. Contact TrustBlock support for API access or data export');
    console.log('4. Use browser automation to scroll and load all 685 audits\n');
    console.log('To proceed with browser automation, we would need to:');
    console.log('  npm install puppeteer');
    console.log('  Then create a script that launches Chrome, navigates to the page,');
    console.log('  scrolls to load all audits, and extracts the data.\n');
  } else {
    console.log('\n✓ Found working API endpoint!');
    console.log('  Endpoint:', success.endpoint);
    console.log('  Check trustblock-api-success.json for full response');
  }
}

main().catch(console.error);
