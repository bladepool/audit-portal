const https = require('https');
const cheerio = require('cheerio');

// Simple HTTPS GET request
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

async function testPlatformExtraction(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`Testing platform extraction for: ${url}\n`);
    
    const html = await httpGet(url);
    const $ = cheerio.load(html);
    const pageText = $('body').text();
    
    let platform = null;
    
    // Method 1: Look for label-value pairs
    console.log('Method 1: Looking for label-value pairs...');
    const platformLabels = $('.label, .info-label, .detail-label, span').filter((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      return text === 'platform' || text === 'network' || text === 'blockchain' || text === 'chain';
    });
    
    if (platformLabels.length > 0) {
      const platformValue = platformLabels.first().next().text().trim() || 
                           platformLabels.first().parent().find('.value, .info-value, .detail-value').text().trim();
      if (platformValue) {
        platform = platformValue;
        console.log(`  Found: "${platform}"`);
      }
    } else {
      console.log('  No label elements found');
    }
    
    // Method 2: Search in page text for common platform patterns
    if (!platform) {
      console.log('\nMethod 2: Searching page text for patterns...');
      const platformPatterns = [
        /(?:Platform|Network|Chain|Blockchain)[:\s]+([A-Za-z0-9\s]+?)(?:\n|<|$)/i,
        /(?:Built on|Deployed on)[:\s]+([A-Za-z0-9\s]+?)(?:\n|<|$)/i
      ];
      
      for (const pattern of platformPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          platform = match[1].trim();
          console.log(`  Found with pattern: "${platform}"`);
          break;
        }
      }
      
      if (!platform) {
        console.log('  No patterns matched');
      }
    }
    
    // Method 3: Look in specific sections
    if (!platform) {
      console.log('\nMethod 3: Looking in specific sections...');
      const analysisSection = $('.token-analysis, .project-info, .contract-info, .audit-info');
      if (analysisSection.length > 0) {
        const analysisText = analysisSection.text();
        const platformMatch = analysisText.match(/(?:Platform|Network)[:\s]+([A-Za-z0-9\s]+?)(?:\n|,|;|$)/i);
        if (platformMatch) {
          platform = platformMatch[1].trim();
          console.log(`  Found in section: "${platform}"`);
        } else {
          console.log('  No match in sections');
        }
      } else {
        console.log('  No analysis sections found');
      }
    }
    
    // Print a snippet of relevant text
    console.log('\n--- Relevant page text snippet ---');
    const platformIndex = pageText.toLowerCase().indexOf('platform');
    if (platformIndex !== -1) {
      console.log(pageText.substring(platformIndex, platformIndex + 200));
    } else {
      console.log('Word "platform" not found in page text');
    }
    
    console.log('\n--- Final result ---');
    console.log(`Platform: ${platform || 'NOT FOUND'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test with a specific project slug
const testSlug = process.argv[2] || 'pecunity';
testPlatformExtraction(testSlug);
