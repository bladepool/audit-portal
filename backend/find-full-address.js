/**
 * Find full contract address in page - check data attributes, click events, etc.
 */

const puppeteer = require('puppeteer');

async function findFullAddress() {
  const browser = await puppeteer.launch({ 
    headless: false, // Run visible to see what happens
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const url = 'https://audit.cfg.ninja/anonymous-dao';
  console.log(`Loading: ${url}\n`);
  
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Find the element containing Token Address
  const addressData = await page.evaluate(() => {
    // Find all elements
    const elements = Array.from(document.querySelectorAll('*'));
    
    for (let el of elements) {
      const text = el.textContent || '';
      
      if (text.includes('Token Address')) {
        console.log('Found Token Address element:', el.outerHTML.substring(0, 200));
        
        // Check the element and its children for full address
        const parent = el.closest('div');
        if (parent) {
          // Check for data attributes
          const attrs = {};
          for (let attr of parent.attributes) {
            attrs[attr.name] = attr.value;
          }
          
          // Check all child elements
          const children = Array.from(parent.querySelectorAll('*'));
          for (let child of children) {
            const childText = child.textContent || '';
            const childHtml = child.outerHTML;
            
            // Check if child has the address
            if (childText.includes('0x73') || childText.includes('...4575')) {
              console.log('Child element:', childHtml.substring(0, 300));
              
              // Check data attributes of this child
              for (let attr of child.attributes) {
                if (attr.value.startsWith('0x') && attr.value.length === 42) {
                  return {
                    address: attr.value,
                    source: `data-${attr.name}`,
                    element: childHtml.substring(0, 200)
                  };
                }
              }
              
              // Check if there's a copy button or similar
              const copyBtn = child.querySelector('svg, button');
              if (copyBtn) {
                console.log('Found copy button/icon');
                // Try to click it and check clipboard
              }
            }
          }
          
          return {
            html: parent.outerHTML.substring(0, 500),
            attrs: attrs
          };
        }
      }
    }
    
    return null;
  });
  
  console.log('\nResult:', JSON.stringify(addressData, null, 2));
  
  // Try clicking on the truncated address to see if it expands
  console.log('\nTrying to click on truncated address...');
  
  try {
    await page.click('span:has-text("0x73...4575")');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterClick = await page.evaluate(() => document.body.innerText);
    console.log('Text after click (first 2000 chars):', afterClick.substring(0, 2000));
  } catch (e) {
    console.log('Click failed:', e.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // Keep browser open to inspect
  await browser.close();
}

findFullAddress().catch(console.error);
