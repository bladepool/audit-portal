require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function extractNextJSData() {
  try {
    console.log('🔍 Fetching homepage...\n');
    
    const response = await axios.get('https://audit.cfg.ninja', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Extract Next.js data
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    
    if (nextDataMatch) {
      console.log('✅ Found __NEXT_DATA__!\n');
      
      try {
        const data = JSON.parse(nextDataMatch[1]);
        
        console.log('📊 Data structure:');
        console.log(`  Keys: ${Object.keys(data).join(', ')}`);
        
        if (data.props) {
          console.log(`  Props keys: ${Object.keys(data.props).join(', ')}`);
          
          if (data.props.pageProps) {
            console.log(`  PageProps keys: ${Object.keys(data.props.pageProps).join(', ')}`);
            
            // Look for projects data
            const pageProps = data.props.pageProps;
            
            if (pageProps.projects) {
              console.log(`\n✅ Found ${pageProps.projects.length} projects!`);
              console.log('\n📋 Sample project:');
              console.log(JSON.stringify(pageProps.projects[0], null, 2).substring(0, 500));
              
              // Save to file
              fs.writeFileSync('./old-site-projects.json', JSON.stringify(pageProps.projects, null, 2));
              console.log(`\n💾 Saved all projects to old-site-projects.json`);
            }
            
            if (pageProps.audits) {
              console.log(`\n✅ Found ${pageProps.audits.length} audits!`);
              fs.writeFileSync('./old-site-audits.json', JSON.stringify(pageProps.audits, null, 2));
              console.log(`💾 Saved all audits to old-site-audits.json`);
            }
            
            // Save full data for inspection
            fs.writeFileSync('./old-site-full-data.json', JSON.stringify(data, null, 2));
            console.log(`\n💾 Saved full Next.js data to old-site-full-data.json`);
          }
        }
        
      } catch (parseError) {
        console.log('❌ Error parsing JSON:', parseError.message);
      }
    } else {
      console.log('❌ No __NEXT_DATA__ found');
    }
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extractNextJSData();
