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

async function testFindings(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`Testing findings for: ${url}\n`);
    
    const html = await httpGet(url);
    const $ = cheerio.load(html);
    const pageText = $('body').text();
    
    const jsonMatch = pageText.match(/\\"critical\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const majorMatch = pageText.match(/\\"major\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const mediumMatch = pageText.match(/\\"medium\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const minorMatch = pageText.match(/\\"minor\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const infoMatch = pageText.match(/\\"informational\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    
    console.log('=== EXTRACTED FINDINGS ===\n');
    if (jsonMatch) {
      console.log(`Critical: found=${jsonMatch[1]}, pending=${jsonMatch[2]}, resolved=${jsonMatch[3]}`);
    }
    if (majorMatch) {
      console.log(`High/Major: found=${majorMatch[1]}, pending=${majorMatch[2]}, resolved=${majorMatch[3]}`);
    }
    if (mediumMatch) {
      console.log(`Medium: found=${mediumMatch[1]}, pending=${mediumMatch[2]}, resolved=${mediumMatch[3]}`);
    }
    if (minorMatch) {
      console.log(`Low/Minor: found=${minorMatch[1]}, pending=${minorMatch[2]}, resolved=${minorMatch[3]}`);
    }
    if (infoMatch) {
      console.log(`Informational: found=${infoMatch[1]}, pending=${infoMatch[2]}, resolved=${infoMatch[3]}`);
    }
    
    const total = (jsonMatch ? parseInt(jsonMatch[1]) : 0) +
                  (majorMatch ? parseInt(majorMatch[1]) : 0) +
                  (mediumMatch ? parseInt(mediumMatch[1]) : 0) +
                  (minorMatch ? parseInt(minorMatch[1]) : 0) +
                  (infoMatch ? parseInt(infoMatch[1]) : 0);
    
    console.log(`\nTotal: ${total} findings`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const testSlug = process.argv[2] || 'pecunity';
testFindings(testSlug);
