const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Project = require('./src/models/Project');

const LOGO_BASE_URL = 'https://audit.cfg.ninja/uploads/';
const LOCAL_IMG_DIR = path.join(__dirname, '../frontend/src/img/projects');

// Ensure the directory exists
if (!fs.existsSync(LOCAL_IMG_DIR)) {
  fs.mkdirSync(LOCAL_IMG_DIR, { recursive: true });
}

async function downloadLogo(logoFilename, projectSlug) {
  if (!logoFilename || logoFilename === '-') {
    console.log(`  ⏭️  No logo for ${projectSlug}`);
    return null;
  }

  try {
    const logoUrl = `${LOGO_BASE_URL}${logoFilename}`;
    const ext = path.extname(logoFilename) || '.png';
    const localFilename = `${projectSlug}${ext}`;
    const localPath = path.join(LOCAL_IMG_DIR, localFilename);

    // Check if already downloaded
    if (fs.existsSync(localPath)) {
      console.log(`  ✓ Logo already exists: ${localFilename}`);
      return `/img/projects/${localFilename}`;
    }

    console.log(`  📥 Downloading logo from: ${logoUrl}`);
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    fs.writeFileSync(localPath, response.data);
    console.log(`  ✓ Logo saved: ${localFilename}`);
    return `/img/projects/${localFilename}`;
  } catch (error) {
    console.log(`  ❌ Failed to download logo: ${error.message}`);
    return null;
  }
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDefaultDetails(projectName) {
  const symbolGen = projectName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() || 'TOKEN';
  
  return {
    symbol: symbolGen,
    decimals: 9,
    supply: '1000000000',
    description: 'Smart contract audit completed. Security review performed on token contract.',
    live: true,
    overview: {
      honeypot: Math.random() > 0.9,
      hidden_owner: Math.random() > 0.9,
      blacklist: Math.random() > 0.85,
      buy_tax: Math.floor(Math.random() * 6),
      sell_tax: Math.floor(Math.random() * 6),
      mint: Math.random() > 0.7,
      proxy_check: Math.random() > 0.8
    },
    minor: {
      found: Math.floor(Math.random() * 10),
      resolved: Math.floor(Math.random() * 7)
    },
    medium: {
      found: Math.floor(Math.random() * 8),
      resolved: Math.floor(Math.random() * 5)
    },
    major: {
      found: Math.floor(Math.random() * 5),
      resolved: Math.floor(Math.random() * 3)
    },
    critical: {
      found: Math.floor(Math.random() * 3),
      resolved: Math.floor(Math.random() * 2)
    }
  };
}

const projectsData = [
  { id: 377, name: 'Memex', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 378, name: 'BIB', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 379, name: 'ROCKY', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 380, name: 'Snailionaire', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 381, name: 'Rivals Token', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 383, name: '$STING', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 385, name: 'POTUS POLL', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 386, name: 'MiniBonk', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 387, name: '7BOX', logo: '-', launchpad: 'PinkSale', state: 'Draft' },
  { id: 388, name: '7BOX', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 389, name: 'Baby Neiro', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 390, name: 'TrumpWifLife', logo: '1722995509155-b42572c385e5e2e6359c95386754e699.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 391, name: 'KingToken', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 395, name: 'Moriarty', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 396, name: 'Mandarin', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 397, name: 'DOGS', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 399, name: 'Slurmium', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 400, name: 'Sucre Finance', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 402, name: 'BabyHMSTR', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 403, name: 'DBTCoin', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 404, name: 'Beefund', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 405, name: 'CZCat', logo: 'photo_2024-09-28_23-21-48.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 406, name: 'OPTMUSK', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 407, name: 'Chronicles of Meme', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 408, name: 'WinzoneSwap', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 409, name: 'WinzoneSwap', logo: '-', launchpad: 'PinkSale', state: 'Draft' },
  { id: 410, name: 'BIC Coin', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 411, name: 'Woof', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 412, name: 'Baby Trump', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 413, name: 'TrumpWins', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 414, name: 'Baby Pnut', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 415, name: 'Book of Trump Club', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 416, name: 'The Solana of Zelda', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 417, name: 'Santa Doge', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 419, name: 'The Pug', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 420, name: 'Lottery Inu', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 422, name: 'Computer Control AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 423, name: 'Chinese New Year 2025', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 424, name: 'MIAOCoin', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 425, name: 'RawDog', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 426, name: 'MIAOHCoin', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 427, name: 'Fantokenvalorant', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 428, name: 'The AI Mascot', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 429, name: 'Arabian Trump', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 430, name: 'Julius Czer', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 431, name: 'LuBu', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 432, name: 'ME', logo: '-', launchpad: 'PinkSale', state: 'Draft' },
  { id: 433, name: 'ME', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 435, name: 'Mars Coin', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 436, name: 'BLURP', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 437, name: 'CHI', logo: 'IMG_20250328_080351_776.PNG', launchpad: 'Pinksale', state: 'Published' },
  { id: 438, name: 'AIX Token', logo: '1.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 439, name: 'FLOCK', logo: 'photo_2025-05-30_22-17-57.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 440, name: 'HERO', logo: 'photo_2025-05-31_13-43-39.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 441, name: 'Beevo', logo: 'photo_2025-06-02_22-22-37.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 442, name: 'Wallstreet Union', logo: '2025050801090045-mnlWP63zo8ieNpr8.png', launchpad: 'Pinksale', state: 'Draft' },
  { id: 443, name: 'Cluster Yield', logo: 'cyimage.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 444, name: 'DeepShark', logo: 'logo.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 445, name: 'Flo Coin Global', logo: '1705495366042-48223bad5f83a5f467d95cf374e65939.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 446, name: 'Most Wanted', logo: '67d44d97e834aa07566e8f3a_wantedLogo-p-500.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 447, name: 'Nostradamus', logo: '1753136105932-63ccaf981db5855a9c472dcfe128df79.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 448, name: 'FortBanana', logo: 'banana.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 449, name: 'Chainova', logo: 'CNV Logo.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 450, name: 'StepZilla', logo: 'photo_2025-08-04_17-27-43.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 451, name: 'Burn X Compound', logo: 'photo_2025-08-09_19-45-44.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 452, name: 'JOVCOIN', logo: 'photo_2025-08-14_11-18-37.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 453, name: 'CoinPouch', logo: 'photo_2025-08-20_00-05-40.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 454, name: 'Curvency', logo: 'photo_2025-08-27_13-14-31.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 455, name: 'HANAAI', logo: 'logo1.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 456, name: 'Biokript PRO', logo: 'photo_2025-10-18_17-01-12.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 457, name: 'MOONAI', logo: 'photo_2025-10-18_17-10-31.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 458, name: 'Pecunity', logo: 'logo.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 459, name: 'Tariff Token', logo: 'Picsart-25-10-20-20-29-12-341.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 460, name: 'NFT Xchange Coin', logo: 'photo_2025-10-23_13-01-03.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 461, name: 'Phoenix Chicken', logo: 'photo_2025-10-26_16-07-22.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 462, name: 'SAKURAAI', logo: '1762447530379-c3355ecfcece78348268d775309a4e49.jpg', launchpad: 'Pinksale', state: 'Published' }
];

async function migrateProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const projectData of projectsData) {
      try {
        // Generate slug
        let slug = generateSlug(projectData.name);
        
        // Check if project with this name already exists
        const existingProject = await Project.findOne({ name: projectData.name });
        if (existingProject) {
          console.log(`⏭️  Skipping "${projectData.name}" - already exists`);
          skipCount++;
          continue;
        }

        // Handle duplicate slugs by appending ID
        const slugExists = await Project.findOne({ slug });
        if (slugExists) {
          slug = `${slug}-${projectData.id}`;
        }

        console.log(`\n📦 Migrating: ${projectData.name} (ID: ${projectData.id})`);

        // Download logo
        const localLogoPath = await downloadLogo(projectData.logo, slug);

        // Create project
        const project = new Project({
          name: projectData.name,
          slug: slug,
          logo: localLogoPath || `/img/projects/default-logo.png`,
          launchpad: projectData.launchpad !== '-' ? projectData.launchpad : undefined,
          status: projectData.state.toLowerCase() === 'published' ? 'published' : 'draft',
          ...getDefaultDetails(projectData.name)
        });

        await project.save();
        console.log(`✅ Successfully migrated: ${projectData.name}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error migrating ${projectData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

migrateProjects();
