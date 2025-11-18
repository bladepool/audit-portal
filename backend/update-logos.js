const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Project = require('./src/models/Project');

const LOCAL_IMG_DIR = path.join(__dirname, '../frontend/public/img/projects');

// Ensure the directory exists
if (!fs.existsSync(LOCAL_IMG_DIR)) {
  fs.mkdirSync(LOCAL_IMG_DIR, { recursive: true });
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function httpsGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGetBuffer(res.headers.location).then(resolve).catch(reject);
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function scrapeLogoUrl(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`  🔍 Scraping: ${url}`);
    
    const html = await httpsGet(url);
    
    // Simple regex to find S3 bucket URLs (avoid thumbnails)
    const s3Regex = /https:\/\/analytixaudit-bucket\.s3\.[^"'\s]+\.(png|jpg|jpeg|webp|svg)/gi;
    const matches = html.match(s3Regex);
    
    if (matches && matches.length > 0) {
      // Filter out thumbnails and get unique URLs
      const uniqueUrls = [...new Set(matches)];
      const mainLogo = uniqueUrls.find(url => !url.includes('thumbnail_')) || uniqueUrls[0];
      
      console.log(`  ✓ Found logo: ${mainLogo.substring(0, 80)}...`);
      return mainLogo;
    }

    console.log(`  ⚠️ No S3 logo found on page`);
    return null;
  } catch (error) {
    console.log(`  ❌ Scraping failed: ${error.message}`);
    return null;
  }
}

async function downloadLogo(logoUrl, projectSlug) {
  if (!logoUrl) return null;

  try {
    // Determine file extension from URL
    const urlPath = new URL(logoUrl).pathname;
    const ext = path.extname(urlPath) || '.png';
    const localFilename = `${projectSlug}${ext}`;
    const localPath = path.join(LOCAL_IMG_DIR, localFilename);

    // Check if already downloaded
    if (fs.existsSync(localPath)) {
      console.log(`  ✓ Logo already exists locally`);
      return `/img/projects/${localFilename}`;
    }

    console.log(`  📥 Downloading logo...`);
    const buffer = await httpsGetBuffer(logoUrl);

    fs.writeFileSync(localPath, buffer);
    console.log(`  ✅ Saved: ${localFilename}`);
    return `/img/projects/${localFilename}`;
  } catch (error) {
    console.log(`  ❌ Download failed: ${error.message}`);
    return null;
  }
}

async function updateProjectLogos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all projects
    const projects = await Project.find({}).sort({ name: 1 });
    console.log(`Found ${projects.length} projects to process\n`);

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const project of projects) {
      console.log(`\n📦 Processing: ${project.name} (${project.slug})`);

      // Skip if logo already downloaded (not default)
      if (project.logo && !project.logo.includes('default-logo')) {
        const localPath = path.join(__dirname, '../frontend/public', project.logo);
        if (fs.existsSync(localPath)) {
          console.log(`  ⏭️ Logo already exists, skipping`);
          skipCount++;
          continue;
        }
      }

      try {
        // Scrape logo URL from project page
        const logoUrl = await scrapeLogoUrl(project.slug);
        
        if (logoUrl) {
          // Download logo
          const localLogoPath = await downloadLogo(logoUrl, project.slug);
          
          if (localLogoPath) {
            // Update project in database
            project.logo = localLogoPath;
            await project.save();
            console.log(`  ✅ Updated database with logo path`);
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Logo Update Summary:');
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️ Skipped (already had logos): ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  updateProjectLogos();
}

module.exports = { updateProjectLogos, scrapeLogoUrl, downloadLogo };
