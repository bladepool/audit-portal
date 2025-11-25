require('dotenv').config();
const axios = require('axios');

async function checkOldSiteAPI() {
  const BASE_URL = 'https://audit.cfg.ninja';
  
  console.log('🔍 Checking old site for API endpoints...\n');
  
  const endpoints = [
    '/api/projects',
    '/api/audits',
    '/api/votes',
    '/api/v1/projects',
    '/data/projects.json',
    '/projects.json',
    '/audits.json',
    '/api/stats',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = BASE_URL + endpoint;
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      console.log(`  ✅ SUCCESS! Status: ${response.status}`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);
      console.log(`  Size: ${response.data.length || JSON.stringify(response.data).length} bytes`);
      
      if (typeof response.data === 'object') {
        console.log(`  Keys: ${Object.keys(response.data).slice(0, 10).join(', ')}`);
      }
      console.log();
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ ${error.response.status} ${error.response.statusText}`);
      } else {
        console.log(`  ❌ ${error.message}`);
      }
    }
  }
  
  // Try the homepage to see what it loads
  console.log('\n🔍 Checking homepage...');
  try {
    const response = await axios.get(BASE_URL, { timeout: 10000 });
    console.log(`✅ Homepage loads: ${response.data.length} bytes`);
    
    // Check for script tags that might load data
    const scriptMatches = response.data.match(/<script[^>]*src=["']([^"']+)["']/g);
    if (scriptMatches) {
      console.log('\n📜 Script files found:');
      scriptMatches.slice(0, 10).forEach(match => {
        const src = match.match(/src=["']([^"']+)["']/)[1];
        console.log(`  - ${src}`);
      });
    }
    
    // Check for data attributes or embedded JSON
    if (response.data.includes('window.__INITIAL_STATE__') || 
        response.data.includes('window.__DATA__') ||
        response.data.includes('__NEXT_DATA__')) {
      console.log('\n✅ Found embedded data in HTML!');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Analysis complete');
}

checkOldSiteAPI();
