require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

const BASE_URL = 'https://audit.cfg.ninja';
const DELAY_MS = 500; // 500ms between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeProjectLogo(slug) {
  try {
    const url = `${BASE_URL}/audits/${slug}`;
    console.log(`  Fetching: ${url}`);
    
    const response = await axios.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Try multiple selectors for logo
    let logoUrl = null;
    
    // Look for logo in common locations
    const selectors = [
      '.project-logo img',
      '.token-logo img',
      'img[alt*="logo" i]',
      'img[alt*="token" i]',
      '.card-img-top',
      '.project-header img',
      'meta[property="og:image"]'
    ];
    
    for (const selector of selectors) {
      if (selector.startsWith('meta')) {
        logoUrl = $(selector).attr('content');
      } else {
        const img = $(selector).first();
        logoUrl = img.attr('src') || img.attr('data-src');
      }
      
      if (logoUrl) {
        // Make absolute URL
        if (logoUrl.startsWith('//')) {
          logoUrl = 'https:' + logoUrl;
        } else if (logoUrl.startsWith('/')) {
          logoUrl = BASE_URL + logoUrl;
        } else if (!logoUrl.startsWith('http')) {
          logoUrl = BASE_URL + '/' + logoUrl;
        }
        break;
      }
    }
    
    // Also get votes data
    let secureVotes = 0;
    let insecureVotes = 0;
    
    // Try to find vote counts
    $('.vote-secure, .secure-vote, [class*="secure"]').each((i, el) => {
      const text = $(el).text();
      const match = text.match(/(\d+)/);
      if (match) secureVotes = Math.max(secureVotes, parseInt(match[1]));
    });
    
    $('.vote-insecure, .insecure-vote, [class*="insecure"]').each((i, el) => {
      const text = $(el).text();
      const match = text.match(/(\d+)/);
      if (match) insecureVotes = Math.max(insecureVotes, parseInt(match[1]));
    });
    
    return {
      logoUrl,
      secureVotes,
      insecureVotes,
      totalVotes: secureVotes + insecureVotes
    };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function downloadLogo(logoUrl, projectSlug) {
  try {
    if (!logoUrl || logoUrl.includes('default-logo') || logoUrl.includes('placeholder')) {
      return null;
    }
    
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Determine file extension from content-type or URL
    const contentType = response.headers['content-type'];
    let ext = '.png';
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('svg')) ext = '.svg';
      else if (contentType.includes('webp')) ext = '.webp';
    } else {
      const urlExt = path.extname(logoUrl).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.svg', '.webp'].includes(urlExt)) {
        ext = urlExt;
      }
    }
    
    const filename = `${projectSlug}${ext}`;
    const logoPath = path.join(__dirname, '../frontend/public/logos', filename);
    
    // Create logos directory if it doesn't exist
    const logosDir = path.join(__dirname, '../frontend/public/logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }
    
    fs.writeFileSync(logoPath, response.data);
    console.log(`    ✓ Downloaded logo: ${filename}`);
    
    return `/logos/${filename}`;
  } catch (error) {
    console.log(`    ❌ Failed to download logo: ${error.message}`);
    return null;
  }
}

async function migrateLogosAndVotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all published projects
    const projects = await Project.find({ published: true }).sort({ name: 1 });
    
    console.log(`📊 Found ${projects.length} published projects\n`);
    console.log('🔍 Starting migration...\n');
    
    let updated = 0;
    let logosDownloaded = 0;
    let votesUpdated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const project of projects) {
      console.log(`\n[${updated + skipped + errors + 1}/${projects.length}] ${project.name} (${project.slug})`);
      
      try {
        const data = await scrapeProjectLogo(project.slug);
        
        if (!data) {
          console.log('  ⚠️  No data found');
          skipped++;
          await sleep(DELAY_MS);
          continue;
        }
        
        let hasUpdates = false;
        
        // Update logo if found
        if (data.logoUrl) {
          console.log(`  📷 Logo found: ${data.logoUrl}`);
          const localLogoPath = await downloadLogo(data.logoUrl, project.slug);
          
          if (localLogoPath) {
            project.logo = localLogoPath;
            logosDownloaded++;
            hasUpdates = true;
          }
        } else {
          console.log('  ⚠️  No logo found');
        }
        
        // Update votes if found
        if (data.totalVotes > 0) {
          console.log(`  🗳️  Votes: ${data.secureVotes} secure, ${data.insecureVotes} insecure`);
          project.secure_votes = data.secureVotes;
          project.insecure_votes = data.insecureVotes;
          project.total_votes = data.totalVotes;
          votesUpdated++;
          hasUpdates = true;
        } else {
          console.log('  ℹ️  No votes found');
        }
        
        if (hasUpdates) {
          await project.save();
          updated++;
          console.log('  ✅ Updated');
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        errors++;
      }
      
      await sleep(DELAY_MS);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total projects: ${projects.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Logos downloaded: ${logosDownloaded}`);
    console.log(`   Votes migrated: ${votesUpdated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrateLogosAndVotes();
