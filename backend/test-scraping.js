require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function testScraping() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const projects = await Project.find({ published: true }).limit(3);
    console.log(`Testing with ${projects.length} projects:\n`);
    
    for (const project of projects) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Project: ${project.name} (${project.slug})`);
      console.log(`Current logo: ${project.logo || 'None'}`);
      console.log(`Current votes: ${project.total_votes || 0}`);
      
      try {
        const url = `https://audit.cfg.ninja/audits/${project.slug}`;
        console.log(`Fetching: ${url}`);
        
        const response = await axios.get(url, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        console.log(`Page title: ${$('title').text()}`);
        console.log(`Page size: ${response.data.length} bytes`);
        
        // Check for images
        const images = $('img');
        console.log(`Found ${images.length} images:`);
        
        images.slice(0, 5).each((i, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          const alt = $(el).attr('alt');
          console.log(`  [${i + 1}] ${alt || 'No alt'}: ${src}`);
        });
        
        // Check for vote elements
        console.log(`\nSearching for vote elements...`);
        $('[class*="vote"], [id*="vote"]').each((i, el) => {
          const classes = $(el).attr('class');
          const text = $(el).text().trim();
          if (text) {
            console.log(`  Vote element: ${classes} - "${text.substring(0, 50)}"`);
          }
        });
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    await mongoose.connection.close();
    console.log('\n\n✅ Test complete');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

testScraping();
