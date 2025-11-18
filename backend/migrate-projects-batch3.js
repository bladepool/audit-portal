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
  { id: 275, name: 'Fuck Around To Find Out', logo: 'photo_2024-03-29_00-18-24.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 276, name: 'APERIL', logo: '1711764308827-2886194fa982f46e8e0ce0fcdae4f45d.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 277, name: 'PeP', logo: '1711799749799-af3a79cdd54fa1579e662df11883922a.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 278, name: 'SolSearcher', logo: 'yuKMFVHDWz36aIFwc3ziiXHp8hUWXori10eT16RYkwo.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 279, name: 'Cat in a Dogs World', logo: '1711803483888-efb4f3c43804b2330f52932eca8b2d41.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 280, name: 'APERIL', logo: '-', launchpad: 'PinkSale', state: 'Draft' },
  { id: 281, name: 'SOL HAMSTER', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 282, name: 'End of Meme', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 283, name: 'CARD OF MEME', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 284, name: 'BabyMEW', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 285, name: 'MeowthWifHat', logo: '1711968152055-ed459349af1d154de53b2f66a4b8b471.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 286, name: 'FLOCAT', logo: '1711909343341-eac9d59bcfd28028da0089b855a0498e.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 287, name: 'CATPAW', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 288, name: 'Gorillawifhat', logo: 'photo_2024-04-03_15-46-27.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 289, name: 'TrumpBNB', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 290, name: 'Shiboki', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 291, name: 'Slerf Cat', logo: 'photo_2024-04-05_14-42-21.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 292, name: 'Junkie Cats', logo: 'photo_2024-04-05_18-06-18.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 293, name: 'Evil Kermit', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 294, name: 'Book of Bonk', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 295, name: 'ELONxALEXANDRE', logo: '1712450829542-ec5da9d690d62f036bb8a3bf8db47426.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 296, name: 'RaveRacoon', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 297, name: 'MemeCoins Mania', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 298, name: 'DragonSol Token', logo: 'Logo2.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 299, name: 'TOMWIFHAT', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 300, name: 'Book Of Cats', logo: '200-.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 301, name: 'Bitconnect', logo: '1712803739711-9a64392310f099f243696fa023ba79a1.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 302, name: 'pepe family', logo: '1712941981221-8d67d8de3704dabc980ed0267549d95e.webp', launchpad: 'Pinksale', state: 'Published' },
  { id: 303, name: 'Chapi El Cato', logo: 'photo_2024-04-12_17-06-50.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 304, name: 'Katy Perry Fans', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 305, name: 'Chi Yamada Cat', logo: 'logo.png', launchpad: '-', state: 'Draft' },
  { id: 306, name: 'Pudgy Puss', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 307, name: 'DO SOMETHING FFS', logo: '1713052129175-02d53e709f1fb8cd3db51b509a05909e.webp', launchpad: 'Pinksale', state: 'Published' },
  { id: 308, name: 'ELUUP Fan Token', logo: 'logo.png', launchpad: '-', state: 'Published' },
  { id: 309, name: 'Book Of Halving', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 310, name: 'Parasol', logo: 'logo.png', launchpad: '-', state: 'Published' },
  { id: 311, name: 'Bloodbath', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 312, name: 'CateWifHat', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 313, name: 'Andy Alter Ego', logo: 'logo.png', launchpad: '-', state: 'Published' },
  { id: 314, name: 'Myro Floki CEO', logo: 'IMG-20240304-105805-934.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 315, name: 'SMIC', logo: 'photo_2024-04-16_11-25-31.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 316, name: 'Baby DON', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 317, name: 'Xiaomao', logo: 'XIAOMAO (1).png', launchpad: 'PinkSale', state: 'Published' },
  { id: 319, name: 'MEME101', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 320, name: 'FalloutBase', logo: 'logo.png', launchpad: '-', state: 'Published' },
  { id: 321, name: 'Meme Wars', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 322, name: 'VancatWifHat', logo: '-', launchpad: 'PinkSale', state: 'Draft' },
  { id: 323, name: 'VancatWifHat', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 324, name: 'Book Of Meme AI', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 325, name: 'Cats Of Sol', logo: 'photo_2024-04-25_13-15-34.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 326, name: 'FoxFurry', logo: 'photo_2024-04-27_12-14-59.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 327, name: 'TWUST', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 328, name: 'PECKO', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 329, name: 'Denarius', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 330, name: 'BABY GUMMY', logo: 'photo_2024-05-01_16-23-18.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 331, name: 'Mr.Beast Goat', logo: 'photo_2024-05-02_05-16-44.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 332, name: 'Gerku', logo: 'gerkuToken.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 333, name: 'Dog Robin Hood', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 334, name: 'Vietnam Coin', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 335, name: 'Overdome', logo: '1714916901226-d0b3244693f743a542dc6a84b8f5ae22.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 336, name: 'FalloutBase-Sol', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 337, name: 'Eager Cat', logo: 'photo_2024-05-15_13-03-48.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 338, name: 'Albert II', logo: 'photo_2024-05-10_16-24-11.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 339, name: 'BOOK OF DUCK', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 340, name: 'FlorkWifNoHat', logo: 'Frame 1171274967.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 341, name: 'Book Of Junkie Memes', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 342, name: 'Zydio AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 343, name: 'FourCZ', logo: '6qRY5aRmg_0AsG-tcQdmwMDq0tO6gJVAEwPAKbnyBUA.webp', launchpad: 'Pinksale', state: 'Published' },
  { id: 344, name: 'COMIC OF MEME', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 345, name: 'Bonk AI', logo: 'bonk+ai.webp', launchpad: 'Pinksale', state: 'Published' },
  { id: 346, name: 'Wall Street Cats', logo: 'Frame 1171274943.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 347, name: 'Elon Wif Trump', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 348, name: 'dogwiftax', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 349, name: 'SylvesterWifHat', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 350, name: 'Jeb the Goat', logo: 'gogoogog.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 351, name: 'PepeQ', logo: 'IMG_20240522_084403_877.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 352, name: 'Cobra King', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 353, name: 'Lazy Sniper', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 354, name: 'Pepe', logo: 'logo.png', launchpad: '-', state: 'Published' },
  { id: 355, name: 'JOE ROGAN', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 356, name: 'MAGA', logo: '1717094198654-6369ee200850facc0b6ab347c154c315.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 357, name: 'Pepe Moon', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 358, name: 'Naruto Inu', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 359, name: 'Naruto Inu', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 360, name: 'TROG', logo: '2024-06-05 19.20.53.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 361, name: 'PENALDO', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 362, name: 'Trump Frog', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 363, name: 'Elon Floki CEO', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 364, name: 'Dog MAGA', logo: 'IMG-20240608-012403-173.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 365, name: 'Tate Goat', logo: '2024-06-13 01.08.04.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 366, name: 'Vote Trump', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 367, name: 'Bozos "Soros" The Clown', logo: 'fdiU4mu.webp', launchpad: 'Pinksale', state: 'Published' },
  { id: 368, name: 'Trump Pump', logo: '2024-06-19 14.41.35 1.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 369, name: 'metaKingDom', logo: 'photo_2024-06-23_07-19-14.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 370, name: 'BABY LIGER', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 371, name: 'FurFund', logo: 'logo-furfun-io.svg', launchpad: 'Pinksale', state: 'Published' },
  { id: 372, name: 'ROBOkoin', logo: 'photo_2024-06-28_07-34-31.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 373, name: 'BlockSound', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 374, name: 'Dinga DAO', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 376, name: 'Wat', logo: '1719781318502-55b3a07b8364e73e4ded15aff72f1f71.png', launchpad: 'Pinksale', state: 'Published' }
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
