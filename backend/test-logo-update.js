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
    const s3Regex = /https:\/\/analytixaudit-bucket\.s3\.[^"'\s]+\.(png|jpg|jpeg|webp|svg)/gi;
    const matches = html.match(s3Regex);
    
    if (matches && matches.length > 0) {
      const uniqueUrls = [...new Set(matches)];
      const mainLogo = uniqueUrls.find(url => !url.includes('thumbnail_')) || uniqueUrls[0];
      console.log(`  ✓ Found logo`);
      return mainLogo;
    }

    console.log(`  ⚠️ No S3 logo found`);
    return null;
  } catch (error) {
    console.log(`  ❌ Scraping failed: ${error.message}`);
    return null;
  }
}

async function downloadLogo(logoUrl, projectSlug) {
  if (!logoUrl) return null;

  try {
    const urlPath = new URL(logoUrl).pathname;
    const ext = path.extname(urlPath) || '.png';
    const localFilename = `${projectSlug}${ext}`;
    const localPath = path.join(LOCAL_IMG_DIR, localFilename);

    if (fs.existsSync(localPath)) {
      console.log(`  ✓ Logo already exists`);
      return `/img/projects/${localFilename}`;
    }

    console.log(`  📥 Downloading...`);
    const buffer = await httpsGetBuffer(logoUrl);
    fs.writeFileSync(localPath, buffer);
    console.log(`  ✅ Saved: ${localFilename}`);
    return `/img/projects/${localFilename}`;
  } catch (error) {
    console.log(`  ❌ Download failed: ${error.message}`);
    return null;
  }
}

async function testUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test on just 5 projects
    const projects = await Project.find({}).limit(5).sort({ name: 1 });
    console.log(`Testing with ${projects.length} projects\n`);

    for (const project of projects) {
      console.log(`\n📦 ${project.name} (${project.slug})`);
      
      const logoUrl = await scrapeLogoUrl(project.slug);
      if (logoUrl) {
        const localPath = await downloadLogo(logoUrl, project.slug);
        if (localPath) {
          project.logo = localPath;
          await project.save();
          console.log(`  ✅ Database updated`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testUpdate();
