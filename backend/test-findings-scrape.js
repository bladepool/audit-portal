const https = require('https');
const cheerio = require('cheerio');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testFindingsExtraction(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`Testing findings extraction for: ${url}\n`);
    
    const html = await httpGet(url);
    const $ = cheerio.load(html);
    const pageText = $('body').text();
    
    // Look for JSON embedded in page
    const jsonMatch = pageText.match(/"critical":\{"found":(\d+),"pending":(\d+),"resolved":(\d+)\}/);
    const majorMatch = pageText.match(/"major":\{"found":(\d+),"pending":(\d+),"resolved":(\d+)\}/);
    const mediumMatch = pageText.match(/"medium":\{"found":(\d+),"pending":(\d+),"resolved":(\d+)\}/);
    const minorMatch = pageText.match(/"minor":\{"found":(\d+),"pending":(\d+),"resolved":(\d+)\}/);
    const infoMatch = pageText.match(/"informational":\{"found":(\d+),"pending":(\d+),"resolved":(\d+)\}/);
    
    console.log('=== FINDINGS FROM JSON ===');
    if (jsonMatch) {
      console.log(`Critical: found=${jsonMatch[1]}, pending=${jsonMatch[2]}, resolved=${jsonMatch[3]}`);
    } else {
      console.log('Critical: NOT FOUND');
    }
    
    if (majorMatch) {
      console.log(`Major/High: found=${majorMatch[1]}, pending=${majorMatch[2]}, resolved=${majorMatch[3]}`);
    } else {
      console.log('Major/High: NOT FOUND');
    }
    
    if (mediumMatch) {
      console.log(`Medium: found=${mediumMatch[1]}, pending=${mediumMatch[2]}, resolved=${mediumMatch[3]}`);
    } else {
      console.log('Medium: NOT FOUND');
    }
    
    if (minorMatch) {
      console.log(`Minor/Low: found=${minorMatch[1]}, pending=${minorMatch[2]}, resolved=${minorMatch[3]}`);
    } else {
      console.log('Minor/Low: NOT FOUND');
    }
    
    if (infoMatch) {
      console.log(`Informational: found=${infoMatch[1]}, pending=${infoMatch[2]}, resolved=${infoMatch[3]}`);
    } else {
      console.log('Informational: NOT FOUND');
    }
    
    // Show a snippet of the findings data
    console.log('\n=== JSON SNIPPET ===');
    const criticalIndex = pageText.indexOf('"critical"');
    if (criticalIndex !== -1) {
      console.log(pageText.substring(criticalIndex, criticalIndex + 300));
    } else {
      console.log('No "critical" found in page text');
      // Look for other indicators
      console.log('\n=== SEARCHING FOR FINDINGS KEYWORDS ===');
      if (pageText.includes('Critical')) console.log('Found: "Critical"');
      if (pageText.includes('High')) console.log('Found: "High"');
      if (pageText.includes('Medium')) console.log('Found: "Medium"');
      if (pageText.includes('Low')) console.log('Found: "Low"');
      if (pageText.includes('Informational')) console.log('Found: "Informational"');
      if (pageText.includes('findings')) console.log('Found: "findings"');
      
      // Show findings section if it exists
      const findingsIdx = pageText.indexOf('Findings by Severity');
      if (findingsIdx !== -1) {
        console.log('\n=== FINDINGS SECTION (TEXT) ===');
        console.log(pageText.substring(findingsIdx, findingsIdx + 500));
      }
      
      // Check raw HTML for script tags
      console.log('\n=== CHECKING HTML FOR JSON/SCRIPT TAGS ===');
      const scriptMatch = html.match(/<script[^>]*>[\s\S]*?findings[\s\S]*?<\/script>/i);
      if (scriptMatch) {
        console.log('Found script with findings:');
        console.log(scriptMatch[0].substring(0, 500));
      }
      
      // Look for data attributes or JSON in specific elements
      const findingsCard = $('[class*="findings"], [id*="findings"]');
      if (findingsCard.length > 0) {
        console.log('\nFound findings element:');
        console.log(findingsCard.html()?.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const testSlug = process.argv[2] || 'pecunity';
testFindingsExtraction(testSlug);
