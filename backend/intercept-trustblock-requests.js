const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

async function interceptTrustBlockAPICalls() {
  console.log('=== TrustBlock API Interceptor ===\n');
  console.log('Launching browser and intercepting network requests...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    const apiCalls = [];
    
    // Intercept all network requests
    page.on('response', async (response) => {
      const url = response.url();
      
      // Look for API calls
      if (url.includes('api') || url.includes('graphql') || url.includes('.json')) {
        const status = response.status();
        
        try {
          const contentType = response.headers()['content-type'];
          
          if (contentType && contentType.includes('json')) {
            const data = await response.json();
            
            apiCalls.push({
              url: url,
              status: status,
              method: response.request().method(),
              data: data
            });
            
            console.log(`✓ Captured API call: ${url}`);
            console.log(`  Status: ${status}`);
            console.log(`  Data size: ${JSON.stringify(data).length} bytes`);
            
            // Check if this contains audit data
            const dataStr = JSON.stringify(data);
            if (dataStr.includes('audit') || dataStr.includes('report')) {
              console.log(`  ⭐ Likely contains audit data!`);
              
              // Save immediately
              fs.writeFileSync(
                `trustblock-api-${Date.now()}.json`,
                JSON.stringify({ url, data }, null, 2)
              );
            }
            
            console.log('');
          }
        } catch (e) {
          // Not JSON or couldn't parse
        }
      }
    });
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to TrustBlock auditor page...\n');
    await page.goto('https://app.trustblock.run/auditor/cfg-ninja', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('Waiting for all API calls to complete...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try scrolling to trigger more API calls
    console.log('Scrolling to trigger lazy loading...\n');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Try clicking pagination if it exists
    try {
      const nextButton = await page.$('[class*="next"], [class*="pagination"] button:last-child, button:has-text("Next")');
      if (nextButton) {
        console.log('Found pagination button, clicking...\n');
        await nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (e) {
      // No pagination found
    }
    
    console.log(`\n=== Captured ${apiCalls.length} API calls ===\n`);
    
    if (apiCalls.length > 0) {
      // Save all captured calls
      fs.writeFileSync('trustblock-captured-api-calls.json', JSON.stringify(apiCalls, null, 2));
      console.log('✓ Saved all API calls to trustblock-captured-api-calls.json\n');
      
      // Analyze
      console.log('API endpoints found:');
      const uniqueUrls = [...new Set(apiCalls.map(c => c.url.split('?')[0]))];
      uniqueUrls.forEach(url => {
        console.log(`  - ${url}`);
      });
      
      // Look for audit data
      console.log('\nSearching for audit data in responses...');
      for (const call of apiCalls) {
        const dataStr = JSON.stringify(call.data);
        
        // Check if this contains audit listings
        if (dataStr.includes('audits') || dataStr.includes('reports')) {
          console.log(`\n✓ Found in: ${call.url}`);
          
          // Try to count audits
          if (call.data.audits && Array.isArray(call.data.audits)) {
            console.log(`  Contains ${call.data.audits.length} audits`);
          } else if (call.data.reports && Array.isArray(call.data.reports)) {
            console.log(`  Contains ${call.data.reports.length} reports`);
          } else if (Array.isArray(call.data)) {
            console.log(`  Contains ${call.data.length} items`);
          }
        }
      }
    } else {
      console.log('⚠ No API calls captured. TrustBlock might:');
      console.log('  1. Use server-side rendering');
      console.log('  2. Bundle data in the initial HTML');
      console.log('  3. Use a different loading mechanism\n');
      
      console.log('Checking page source for embedded data...');
      const content = await page.content();
      
      // Look for Next.js data
      const nextDataMatch = content.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          console.log('\n✓ Found Next.js __NEXT_DATA__');
          
          fs.writeFileSync('trustblock-nextjs-data.json', JSON.stringify(nextData, null, 2));
          console.log('✓ Saved to trustblock-nextjs-data.json');
          
          // Check if it contains audits
          const dataStr = JSON.stringify(nextData);
          if (dataStr.includes('audit') || dataStr.includes('report')) {
            console.log('⭐ Next.js data contains audit information!');
            
            // Try to extract audits
            if (nextData.props?.pageProps) {
              console.log('\nPage props keys:', Object.keys(nextData.props.pageProps));
            }
          }
        } catch (e) {
          console.log('Could not parse Next.js data');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

async function main() {
  await interceptTrustBlockAPICalls();
  
  console.log('\n=== Analysis Complete ===\n');
  console.log('Check generated JSON files for audit data.');
  console.log('If we found the data source, we can extract all 685 audits.\n');
}

main().catch(console.error);
