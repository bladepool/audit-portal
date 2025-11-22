const https = require('https');
const fs = require('fs');

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

async function downloadPage(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`Downloading: ${url}`);
    
    const html = await httpGet(url);
    const filename = `page-${slug}.html`;
    
    fs.writeFileSync(filename, html);
    console.log(`Saved to ${filename}`);
    console.log(`Size: ${html.length} bytes`);
    
    // Look for __NEXT_DATA__ which contains the initial props
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (nextDataMatch) {
      console.log('\n=== FOUND __NEXT_DATA__ ===');
      const jsonData = nextDataMatch[1];
      fs.writeFileSync(`page-${slug}-data.json`, jsonData);
      console.log(`Saved Next.js data to page-${slug}-data.json`);
      
      // Parse and show findings
      try {
        const data = JSON.parse(jsonData);
        console.log('\nParsed JSON structure:');
        console.log(JSON.stringify(data, null, 2).substring(0, 1000));
      } catch (e) {
        console.log('Could not parse JSON:', e.message);
      }
    } else {
      console.log('\n__NEXT_DATA__ not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const testSlug = process.argv[2] || 'pecunity';
downloadPage(testSlug);
