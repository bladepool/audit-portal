require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

const BASE_URL = 'https://audit.cfg.ninja';
const DELAY_MS = 1000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeProjectData(page, slug) {
  try {
    const url = `${BASE_URL}/audits/${slug}`;
    console.log(`  Navigating to: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for content to load
    await sleep(2000);
    
    // Extract logo URL
    const logoUrl = await page.evaluate(() => {
      const selectors = [
        '.project-logo img',
        '.token-logo img',
        'img.logo',
        '.card-img-top',
        '.project-header img',
        'img[alt*="logo" i]',
        'img[alt*="token" i]',
      ];
      
      for (const selector of selectors) {
        const img = document.querySelector(selector);
        if (img && img.src && !img.src.includes('default') && !img.src.includes('placeholder')) {
          return img.src;
        }
      }
      
      // Check meta tags
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.content) {
        return ogImage.content;
      }
      
      return null;
    });
    
    // Extract vote counts
    const votes = await page.evaluate(() => {
      let secure = 0;
      let insecure = 0;
      
      // Look for vote elements
      const voteElements = document.querySelectorAll('[class*="vote"], .stat-number, .badge');
      
      voteElements.forEach(el => {
        const text = el.textContent || el.innerText;
        const classStr = el.className.toLowerCase();
        const match = text.match(/(\d+)/);
        
        if (match) {
          const num = parseInt(match[1]);
          if (classStr.includes('secure') || classStr.includes('safe') || classStr.includes('pass')) {
            secure = Math.max(secure, num);
          } else if (classStr.includes('insecure') || classStr.includes('unsafe') || classStr.includes('fail')) {
            insecure = Math.max(insecure, num);
          }
        }
      });
      
      // Also check for specific vote count displays
      const secureEl = document.querySelector('[class*="secure-vote"]');
      const insecureEl = document.querySelector('[class*="insecure-vote"]');
      
      if (secureEl) {
        const match = secureEl.textContent.match(/(\d+)/);
        if (match) secure = parseInt(match[1]);
      }
      
      if (insecureEl) {
        const match = insecureEl.textContent.match(/(\d+)/);
        if (match) insecure = parseInt(match[1]);
      }
      
      return { secure, insecure };
    });
    
    return {
      logoUrl,
      secureVotes: votes.secure,
      insecureVotes: votes.insecure,
      totalVotes: votes.secure + votes.insecure
    };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function downloadLogo(logoUrl, projectSlug) {
  try {
    if (!logoUrl || logoUrl.includes('default') || logoUrl.includes('placeholder')) {
      return null;
    }
    
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const contentType = response.headers['content-type'];
    let ext = '.png';
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('svg')) ext = '.svg';
      else if (contentType.includes('webp')) ext = '.webp';
    }
    
    const filename = `${projectSlug}${ext}`;
    const logoPath = path.join(__dirname, '../frontend/public/logos', filename);
    
    const logosDir = path.join(__dirname, '../frontend/public/logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }
    
    fs.writeFileSync(logoPath, response.data);
    console.log(`    ✓ Downloaded: ${filename}`);
    
    return `/logos/${filename}`;
  } catch (error) {
    console.log(`    ❌ Download failed: ${error.message}`);
    return null;
  }
}

async function migrateWithBrowser() {
  let browser;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Get all published projects
    const projects = await Project.find({ 
      published: true,
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' },
        { total_votes: { $lte: 0 } }
      ]
    }).sort({ name: 1 });
    
    console.log(`📊 Found ${projects.length} projects needing updates\n`);
    
    let updated = 0;
    let logosDownloaded = 0;
    let votesUpdated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`\n[${i + 1}/${projects.length}] ${project.name} (${project.slug})`);
      
      try {
        const data = await scrapeProjectData(page, project.slug);
        
        if (!data) {
          skipped++;
          continue;
        }
        
        let hasUpdates = false;
        
        if (data.logoUrl && (!project.logo || project.logo === '')) {
          console.log(`  📷 Logo: ${data.logoUrl.substring(0, 60)}...`);
          const localPath = await downloadLogo(data.logoUrl, project.slug);
          
          if (localPath) {
            project.logo = localPath;
            logosDownloaded++;
            hasUpdates = true;
          }
        }
        
        if (data.totalVotes > 0 && (!project.total_votes || project.total_votes === 0)) {
          console.log(`  🗳️  Votes: ${data.secureVotes} secure, ${data.insecureVotes} insecure`);
          project.secure_votes = data.secureVotes;
          project.insecure_votes = data.insecureVotes;
          project.total_votes = data.totalVotes;
          votesUpdated++;
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          await project.save();
          updated++;
          console.log('  ✅ Updated');
        } else {
          console.log('  ⚠️  No updates needed');
          skipped++;
        }
        
        await sleep(DELAY_MS);
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        errors++;
      }
      
      // Save progress every 50 projects
      if ((i + 1) % 50 === 0) {
        console.log(`\n💾 Progress saved: ${i + 1}/${projects.length}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total projects processed: ${projects.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Logos downloaded: ${logosDownloaded}`);
    console.log(`   Votes migrated: ${votesUpdated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('='.repeat(60));
    
    await browser.close();
    await mongoose.connection.close();
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

migrateWithBrowser();
