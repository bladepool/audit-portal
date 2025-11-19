const mongoose = require('mongoose');
const Project = require('../src/models/Project');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Fetch production project list
async function fetchProductionProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'audit.cfg.ninja',
      path: '/api/projects',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', (e) => {
      console.log('Could not fetch production projects:', e.message);
      resolve([]);
    });
  });
}

// Fetch specific project from production
async function fetchProductionProject(slug) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'audit.cfg.ninja',
      path: `/api/projects/${slug}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.log(`Could not fetch ${slug}:`, e.message);
      resolve(null);
    });
  });
}

// Download logo from production
async function downloadLogo(logoUrl, slug) {
  if (!logoUrl || logoUrl.startsWith('/img/projects/')) {
    return logoUrl;
  }

  return new Promise((resolve) => {
    const url = logoUrl.replace('https://audit.cfg.ninja', '');
    const options = {
      hostname: 'audit.cfg.ninja',
      path: url,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const ext = path.extname(url) || '.png';
      const logoPath = path.join(__dirname, '../../frontend/public/img/projects', `${slug}${ext}`);
      const dir = path.dirname(logoPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = fs.createWriteStream(logoPath);
      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(`/img/projects/${slug}${ext}`);
      });

      file.on('error', (err) => {
        fs.unlink(logoPath, () => {});
        resolve(null);
      });
    }).on('error', (e) => {
      resolve(null);
    });
  });
}

async function syncProject(slug, localProject) {
  console.log(`\nSyncing ${slug}...`);
  
  const productionData = await fetchProductionProject(slug);
  if (!productionData) {
    console.log(`  ⚠ Not found on production`);
    return null;
  }

  const updates = {};
  let hasUpdates = false;

  // Check and sync logo
  if (productionData.logo && (!localProject?.logo || localProject.logo === '/img/projects/default.png')) {
    console.log(`  → Syncing logo...`);
    const localLogo = await downloadLogo(productionData.logo, slug);
    if (localLogo) {
      updates.logo = localLogo;
      hasUpdates = true;
      console.log(`    ✓ Logo synced`);
    }
  }

  // Check and sync PDF URL
  if (productionData.audit_pdf && !localProject?.audit_pdf) {
    updates.audit_pdf = productionData.audit_pdf;
    updates.auditPdfUrl = productionData.audit_pdf;
    hasUpdates = true;
    console.log(`    ✓ PDF URL synced`);
  }

  // Sync missing fields
  const fieldsToSync = [
    'launchpad', 'launchpad_link', 'page_view', 'total_votes',
    'platform', 'codebase', 'auditToolVersion', 'auditEdition',
    'paymentHash', 'isKYC', 'kycURL', 'kycScore'
  ];

  for (const field of fieldsToSync) {
    if (productionData[field] && !localProject?.[field]) {
      updates[field] = productionData[field];
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    if (localProject) {
      await Project.findByIdAndUpdate(localProject._id, updates);
      console.log(`  ✓ Updated ${Object.keys(updates).length} fields`);
    } else {
      // Create new project
      const newProject = new Project({
        ...productionData,
        ...updates,
        slug: slug
      });
      await newProject.save();
      console.log(`  ✓ Created new project`);
    }
    return updates;
  } else {
    console.log(`  ✓ Already up to date`);
    return null;
  }
}

async function syncAll() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    console.log('Fetching production projects...');
    const productionProjects = await fetchProductionProjects();
    console.log(`✓ Found ${productionProjects.length} projects on production\n`);

    const localProjects = await Project.find({});
    const localSlugs = new Set(localProjects.map(p => p.slug));

    console.log(`Local projects: ${localProjects.length}`);
    console.log('='.repeat(60));

    let synced = 0;
    let created = 0;
    let failed = 0;

    for (const prodProject of productionProjects.slice(0, 10)) { // Limit to 10 for testing
      const slug = prodProject.slug;
      const localProject = localProjects.find(p => p.slug === slug);
      
      try {
        const result = await syncProject(slug, localProject);
        if (result) {
          if (localProject) {
            synced++;
          } else {
            created++;
          }
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ SYNC COMPLETE');
    console.log('='.repeat(60));
    console.log(`Updated: ${synced}`);
    console.log(`Created: ${created}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

console.log('CFG Ninja - Production Sync Tool');
console.log('='.repeat(60));
syncAll();
