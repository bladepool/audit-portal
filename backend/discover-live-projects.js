require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

const BASE_URL = 'https://audit.cfg.ninja';
const DELAY_MS = 1000; // 1 second between requests

// Normalize string for comparison
function normalizeForComparison(str) {
  return str
    .toLowerCase()
    .replace(/\$/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get all project slugs from the site
async function getAllProjectSlugsAdvanced() {
  const slugs = new Set();
  
  try {
    console.log('🔍 Method 1: Checking homepage...');
    const response = await axios.get(BASE_URL, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Find all links that look like project pages
    $('a[href*="/audits/"], a[href^="/audits/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('/audits/')) {
        const slug = href.split('/audits/')[1]?.split('?')[0]?.split('#')[0];
        if (slug && slug.length > 0 && !slug.includes('/')) {
          slugs.add(slug);
        }
      }
    });
    
    console.log(`   Found ${slugs.size} slugs from homepage\n`);
    
    // Try common pagination patterns
    console.log('🔍 Method 2: Trying pagination...');
    for (let page = 1; page <= 20; page++) {
      try {
        const pageUrl = `${BASE_URL}?page=${page}`;
        const pageResponse = await axios.get(pageUrl, { timeout: 10000 });
        const page$ = cheerio.load(pageResponse.data);
        
        let foundNew = 0;
        page$('a[href*="/audits/"], a[href^="/audits/"]').each((i, elem) => {
          const href = page$(elem).attr('href');
          if (href && href.includes('/audits/')) {
            const slug = href.split('/audits/')[1]?.split('?')[0]?.split('#')[0];
            if (slug && slug.length > 0 && !slug.includes('/')) {
              if (!slugs.has(slug)) foundNew++;
              slugs.add(slug);
            }
          }
        });
        
        console.log(`   Page ${page}: Found ${foundNew} new slugs (total: ${slugs.size})`);
        
        if (foundNew === 0) {
          console.log(`   No new slugs on page ${page}, stopping pagination\n`);
          break;
        }
        
        await sleep(DELAY_MS);
      } catch (error) {
        console.log(`   Page ${page}: Error - ${error.message}`);
        break;
      }
    }
    
    // Try sitemap
    console.log('🔍 Method 3: Checking for sitemap...');
    try {
      const sitemapUrl = `${BASE_URL}/sitemap.xml`;
      const sitemapResponse = await axios.get(sitemapUrl, { timeout: 10000 });
      const sitemap$ = cheerio.load(sitemapResponse.data, { xmlMode: true });
      
      sitemap$('loc').each((i, elem) => {
        const url = sitemap$(elem).text();
        if (url.includes('/audits/')) {
          const slug = url.split('/audits/')[1]?.split('?')[0]?.split('#')[0];
          if (slug && slug.length > 0 && !slug.includes('/')) {
            slugs.add(slug);
          }
        }
      });
      
      console.log(`   Found ${slugs.size} total slugs from sitemap\n`);
    } catch (error) {
      console.log(`   Sitemap not found or error: ${error.message}\n`);
    }
    
    // Try robots.txt for sitemap links
    console.log('🔍 Method 4: Checking robots.txt...');
    try {
      const robotsUrl = `${BASE_URL}/robots.txt`;
      const robotsResponse = await axios.get(robotsUrl, { timeout: 10000 });
      const robotsText = robotsResponse.data;
      
      const sitemapMatches = robotsText.match(/Sitemap:\s*(https?:\/\/[^\s]+)/gi);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const sitemapUrl = match.split('Sitemap:')[1].trim();
          console.log(`   Found sitemap: ${sitemapUrl}`);
          
          try {
            const sitemapResponse = await axios.get(sitemapUrl, { timeout: 10000 });
            const sitemap$ = cheerio.load(sitemapResponse.data, { xmlMode: true });
            
            sitemap$('loc').each((i, elem) => {
              const url = sitemap$(elem).text();
              if (url.includes('/audits/')) {
                const slug = url.split('/audits/')[1]?.split('?')[0]?.split('#')[0];
                if (slug && slug.length > 0 && !slug.includes('/')) {
                  slugs.add(slug);
                }
              }
            });
          } catch (error) {
            console.log(`   Error fetching sitemap: ${error.message}`);
          }
        }
      }
      console.log(`   Total slugs after robots.txt check: ${slugs.size}\n`);
    } catch (error) {
      console.log(`   Robots.txt not found or error: ${error.message}\n`);
    }
    
  } catch (error) {
    console.error(`❌ Error fetching slugs: ${error.message}`);
  }
  
  return Array.from(slugs);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all project slugs from live site
    console.log('🌐 Discovering projects from audit.cfg.ninja...\n');
    const liveSlugs = await getAllProjectSlugsAdvanced();
    
    console.log('='.repeat(60));
    console.log(`📊 Discovery Summary:`);
    console.log(`   Total unique slugs found: ${liveSlugs.length}`);
    console.log('='.repeat(60));
    
    if (liveSlugs.length === 0) {
      console.log('\n❌ No project slugs discovered. The site might require JavaScript or have protection.');
      process.exit(1);
    }
    
    console.log('\n📋 Sample slugs:');
    liveSlugs.slice(0, 10).forEach(slug => console.log(`   - ${slug}`));
    
    // Get all projects from database
    const dbProjects = await Project.find({});
    const dbSlugs = new Set(dbProjects.map(p => p.slug).filter(Boolean));
    const dbNormalizedNames = new Set(dbProjects.map(p => normalizeForComparison(p.name)));
    
    console.log(`\n📊 Database has ${dbProjects.length} projects with ${dbSlugs.size} slugs\n`);
    
    // Compare
    const missingInDb = liveSlugs.filter(slug => !dbSlugs.has(slug));
    
    console.log('='.repeat(60));
    console.log(`🔍 Comparison Results:`);
    console.log(`   Live site slugs: ${liveSlugs.length}`);
    console.log(`   Database projects: ${dbProjects.length}`);
    console.log(`   Missing in database: ${missingInDb.length}`);
    console.log('='.repeat(60));
    
    if (missingInDb.length > 0) {
      console.log('\n📋 Missing slugs (first 50):');
      missingInDb.slice(0, 50).forEach(slug => console.log(`   - ${slug}`));
      
      console.log(`\n💾 Saved missing slugs to missing-slugs.json`);
      const fs = require('fs');
      fs.writeFileSync(
        './missing-slugs.json',
        JSON.stringify(missingInDb, null, 2)
      );
    } else {
      console.log('\n✅ All live site projects are in the database!');
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
