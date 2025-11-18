const https = require('https');

// Test scraping a few known projects
const testProjects = [
  'slerf-cat',
  'xfrog'
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testScrape(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`\n🔍 Testing: ${url}`);
    
    const html = await httpsGet(url);
    
    // Simple regex to find S3 bucket URLs
    const s3Regex = /https:\/\/analytixaudit-bucket\.s3\.[^"'\s]+\.(png|jpg|jpeg|webp|svg)/gi;
    const matches = html.match(s3Regex);
    
    if (matches && matches.length > 0) {
      console.log(`✅ Found ${matches.length} S3 logo URLs:`);
      matches.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
      return matches[0]; // Return first match
    } else {
      console.log(`❌ No S3 logo URLs found`);
      
      // Try to find any image URLs
      const imgRegex = /src=["']([^"']+\.(png|jpg|jpeg|webp|svg))["']/gi;
      const imgMatches = [];
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        imgMatches.push(match[1]);
      }
      
      if (imgMatches.length > 0) {
        console.log(`Found ${imgMatches.length} other image URLs:`);
        imgMatches.slice(0, 5).forEach((url, i) => {
          console.log(`  ${i + 1}. ${url.substring(0, 100)}`);
        });
      }
    }
    
    return null;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  for (const slug of testProjects) {
    await testScrape(slug);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests();
