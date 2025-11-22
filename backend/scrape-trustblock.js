const https = require('https');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeTrustBlock() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('auditportal');
    const projects = db.collection('projects');
    
    // Get all projects
    const allProjects = await projects.find({ published: true }).toArray();
    console.log(`\nTotal published projects: ${allProjects.length}`);
    
    // Scrape TrustBlock auditor page
    console.log('\nFetching TrustBlock page...');
    const url = 'https://app.trustblock.run/auditor/cfg-ninja';
    const html = await httpGet(url);
    const $ = cheerio.load(html);
    
    console.log('Page loaded, analyzing content...\n');
    
    // Find all audit cards/links
    const trustBlockProjects = [];
    
    // Look for project links, names, or audit entries
    $('a[href*="/audit/"], a[href*="/report/"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (text && href) {
        trustBlockProjects.push({ name: text, url: href });
      }
    });
    
    // Alternative: look for project cards
    $('.project-card, .audit-card, [class*="audit"]').each((i, el) => {
      const name = $(el).find('.name, .title, h2, h3').first().text().trim();
      const link = $(el).find('a').attr('href');
      if (name && link) {
        trustBlockProjects.push({ name, url: link });
      }
    });
    
    console.log(`Found ${trustBlockProjects.length} projects on TrustBlock`);
    
    if (trustBlockProjects.length > 0) {
      console.log('\nSample TrustBlock projects:');
      trustBlockProjects.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name}: ${p.url}`);
      });
      
      // Try to match with our projects
      let matched = 0;
      let updated = 0;
      
      for (const tbProject of trustBlockProjects) {
        // Try to find matching project in our database
        const match = allProjects.find(p => 
          p.name.toLowerCase() === tbProject.name.toLowerCase() ||
          p.symbol?.toLowerCase() === tbProject.name.toLowerCase()
        );
        
        if (match) {
          matched++;
          // Update with TrustBlock URL
          const fullUrl = tbProject.url.startsWith('http') 
            ? tbProject.url 
            : `https://app.trustblock.run${tbProject.url}`;
          
          await projects.updateOne(
            { _id: match._id },
            { $set: { trustblock_url: fullUrl } }
          );
          updated++;
          console.log(`  ✓ Matched: ${match.name} → ${fullUrl}`);
        }
      }
      
      console.log(`\n✓ Matched ${matched} projects`);
      console.log(`✓ Updated ${updated} with TrustBlock URLs`);
    } else {
      console.log('\nNo projects found on TrustBlock page.');
      console.log('The page may require authentication or use JavaScript rendering.');
      console.log('\nPage text sample:');
      console.log($('body').text().substring(0, 500));
    }
    
    // Show projects without TrustBlock URLs
    const withoutTrustBlock = await projects.countDocuments({ 
      published: true, 
      trustblock_url: { $exists: false } 
    });
    
    console.log(`\nProjects without TrustBlock URL: ${withoutTrustBlock}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

scrapeTrustBlock();
