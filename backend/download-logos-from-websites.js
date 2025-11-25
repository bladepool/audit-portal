require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Project = require('./src/models/Project');

// Logo output directory
const LOGO_DIR = path.join(__dirname, '..', 'frontend', 'public', 'logos');

// Ensure logo directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

function generateFilename(projectName, url) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = path.extname(new URL(url).pathname) || '.png';
  return `${slug}${ext}`;
}

async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    fs.writeFileSync(filepath, response.data);
    return true;
  } catch (err) {
    return false;
  }
}

async function findLogoUrls(websiteUrl) {
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const logos = [];
    
    // Strategy 1: Open Graph image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      logos.push({ url: ogImage, priority: 1, source: 'og:image' });
    }
    
    // Strategy 2: Twitter card image
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage) {
      logos.push({ url: twitterImage, priority: 2, source: 'twitter:image' });
    }
    
    // Strategy 3: Apple touch icon
    const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href') || 
                           $('link[rel="apple-touch-icon-precomposed"]').attr('href');
    if (appleTouchIcon) {
      logos.push({ url: appleTouchIcon, priority: 3, source: 'apple-touch-icon' });
    }
    
    // Strategy 4: Favicon
    const favicon = $('link[rel="icon"]').attr('href') || 
                    $('link[rel="shortcut icon"]').attr('href');
    if (favicon) {
      logos.push({ url: favicon, priority: 4, source: 'favicon' });
    }
    
    // Strategy 5: Look for <img> with "logo" in class or src
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt') || '';
      const className = $(elem).attr('class') || '';
      
      if (src && (
        src.toLowerCase().includes('logo') ||
        alt.toLowerCase().includes('logo') ||
        className.toLowerCase().includes('logo')
      )) {
        logos.push({ url: src, priority: 5, source: 'img-logo' });
      }
    });
    
    // Convert relative URLs to absolute
    const baseUrl = new URL(websiteUrl);
    logos.forEach(logo => {
      try {
        logo.url = new URL(logo.url, baseUrl.origin).href;
      } catch (err) {
        // Invalid URL, skip
      }
    });
    
    // Sort by priority and remove duplicates
    const uniqueLogos = [...new Map(logos.map(l => [l.url, l])).values()];
    uniqueLogos.sort((a, b) => a.priority - b.priority);
    
    return uniqueLogos;
    
  } catch (err) {
    console.error(`Error fetching ${websiteUrl}:`, err.message);
    return [];
  }
}

async function downloadLogosFromWebsites() {
  try {
    console.log('\n🎨 Starting Logo Download from Websites...\n');
    
    // Find projects with websites but no logos
    const projects = await Project.find({
      published: true,
      'socials.website': { $exists: true, $ne: null, $ne: '' },
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' }
      ]
    }).limit(100); // Process first 100
    
    console.log(`Found ${projects.length} projects with websites but no logos\n`);
    
    let stats = {
      totalProcessed: 0,
      logosDownloaded: 0,
      failures: 0,
      skipped: 0
    };
    
    for (const project of projects) {
      stats.totalProcessed++;
      console.log(`\n[${stats.totalProcessed}/${projects.length}] Processing: ${project.name}`);
      console.log(`Website: ${project.socials.website}`);
      
      try {
        // Find logo URLs from website
        const logoOptions = await findLogoUrls(project.socials.website);
        
        if (logoOptions.length === 0) {
          console.log('⚠️  No logo found on website');
          stats.skipped++;
          continue;
        }
        
        console.log(`Found ${logoOptions.length} logo options`);
        
        // Try each logo URL until one succeeds
        let downloaded = false;
        for (const logo of logoOptions) {
          console.log(`Trying: ${logo.source} - ${logo.url.substring(0, 60)}...`);
          
          const filename = generateFilename(project.name, logo.url);
          const filepath = path.join(LOGO_DIR, filename);
          
          const success = await downloadImage(logo.url, filepath);
          
          if (success) {
            // Verify file is not too small (likely error page)
            const stats_file = fs.statSync(filepath);
            if (stats_file.size < 500) {
              fs.unlinkSync(filepath);
              console.log('❌ File too small, likely error');
              continue;
            }
            
            // Update project with logo path
            await Project.findByIdAndUpdate(project._id, {
              $set: { logo: `/logos/${filename}` }
            });
            
            console.log(`✅ Downloaded logo: ${filename} (${Math.round(stats_file.size / 1024)}KB)`);
            stats.logosDownloaded++;
            downloaded = true;
            break;
          }
        }
        
        if (!downloaded) {
          console.log('❌ Failed to download any logo');
          stats.failures++;
        }
        
        // Small delay to be polite
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`Error processing ${project.name}:`, err.message);
        stats.failures++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Download Summary:');
    console.log('='.repeat(60));
    console.log(`Total projects processed: ${stats.totalProcessed}`);
    console.log(`Logos downloaded: ${stats.logosDownloaded}`);
    console.log(`Failed: ${stats.failures}`);
    console.log(`Skipped (no logo found): ${stats.skipped}`);
    console.log('='.repeat(60));
    
    // Calculate new coverage
    const totalPublished = await Project.countDocuments({ published: true });
    const withLogos = await Project.countDocuments({ 
      published: true,
      logo: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`\n📊 Current Logo Coverage: ${withLogos}/${totalPublished} (${((withLogos/totalPublished)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error downloading logos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Download complete');
  }
}

downloadLogosFromWebsites();
