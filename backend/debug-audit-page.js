/**
 * Debug script - Save HTML and screenshot of audit page
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugAuditPage() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // Test with a project we know has a contract
  const url = 'https://audit.cfg.ninja/anonymous-dao';
  console.log(`Loading: ${url}\n`);
  
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Save HTML
  const html = await page.content();
  fs.writeFileSync('debug-page.html', html);
  console.log('✓ Saved HTML to debug-page.html');
  
  // Save screenshot
  await page.screenshot({ path: 'debug-page.png', fullPage: true });
  console.log('✓ Saved screenshot to debug-page.png');
  
  // Extract visible text
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('debug-page-text.txt', text);
  console.log('✓ Saved text content to debug-page-text.txt\n');
  
  // Look for address patterns
  console.log('=== Searching for patterns ===\n');
  
  const evmMatches = text.match(/0x[a-fA-F0-9]{40}/g);
  if (evmMatches) {
    console.log('EVM addresses found:');
    evmMatches.forEach(addr => console.log(`  - ${addr}`));
  } else {
    console.log('No EVM addresses found');
  }
  
  // Search for "Token Address" in HTML
  if (html.includes('Token Address') || html.includes('Contract Address')) {
    console.log('\n✓ Found "Token Address" or "Contract Address" in HTML');
    
    // Extract surrounding context
    const tokenIdx = html.indexOf('Token Address');
    const contractIdx = html.indexOf('Contract Address');
    const idx = tokenIdx !== -1 ? tokenIdx : contractIdx;
    
    if (idx !== -1) {
      const context = html.substring(idx - 200, idx + 300);
      console.log('\nContext:');
      console.log(context.substring(0, 500));
    }
  } else {
    console.log('\n⚠ "Token Address" or "Contract Address" NOT found in HTML');
  }
  
  await browser.close();
}

debugAuditPage().catch(console.error);
