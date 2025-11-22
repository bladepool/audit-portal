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

async function analyzePage(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`Analyzing page structure: ${url}\n`);
    
    const html = await httpGet(url);
    const $ = cheerio.load(html);
    
    // Get all text content
    const pageText = $('body').text();
    
    // Look for findings numbers in the text
    console.log('=== SEARCHING FOR NUMBERS NEAR SEVERITY KEYWORDS ===\n');
    
    const severities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
    severities.forEach(sev => {
      const idx = pageText.indexOf(sev);
      if (idx !== -1) {
        // Get 100 chars after the keyword
        const snippet = pageText.substring(idx, idx + 100);
        console.log(`${sev}:`);
        console.log(snippet.replace(/\s+/g, ' '));
        console.log('');
      }
    });
    
    // Look for "Findings by Severity" section
    console.log('\n=== FINDINGS BY SEVERITY SECTION ===\n');
    const findingsIdx = pageText.indexOf('Findings by Severity');
    if (findingsIdx !== -1) {
      const section = pageText.substring(findingsIdx, findingsIdx + 300);
      console.log(section.replace(/\s+/g, ' '));
    }
    
    // Try to find the actual numbers with different patterns
    console.log('\n=== EXTRACTING NUMBERS (METHOD 1: After keyword) ===\n');
    const criticalMatch = pageText.match(/Critical[^\d]*(\d+)/i);
    const highMatch = pageText.match(/High[^\d]*(\d+)/i);
    const mediumMatch = pageText.match(/Medium[^\d]*(\d+)/i);
    const lowMatch = pageText.match(/Low[^\d]*(\d+)/i);
    const infoMatch = pageText.match(/Informational[^\d]*(\d+)/i);
    
    if (criticalMatch) console.log(`Critical: ${criticalMatch[1]}`);
    if (highMatch) console.log(`High: ${highMatch[1]}`);
    if (mediumMatch) console.log(`Medium: ${mediumMatch[1]}`);
    if (lowMatch) console.log(`Low: ${lowMatch[1]}`);
    if (infoMatch) console.log(`Informational: ${infoMatch[1]}`);
    
    // Method 2: Look for Found/Pending/Resolved pattern
    console.log('\n=== EXTRACTING NUMBERS (METHOD 2: Found/Pending/Resolved) ===\n');
    const foundPattern = /Critical.*?Found[:\s]*(\d+).*?Pending[:\s]*(\d+).*?Resolved[:\s]*(\d+)/is;
    const criticalFound = pageText.match(foundPattern);
    if (criticalFound) {
      console.log(`Critical: Found=${criticalFound[1]}, Pending=${criticalFound[2]}, Resolved=${criticalFound[3]}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const testSlug = process.argv[2] || 'pecunity';
analyzePage(testSlug);
