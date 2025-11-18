const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('./src/models/Project');

// Project list - Batch 2 (IDs 161-274)
const projectsList = [
  { id: 161, name: 'MiniBonk', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 162, name: 'Wojakpot', logo: 'logod.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 163, name: 'Baby analoS BSC', logo: 'IMG_1105.JPG', launchpad: 'Pinksale', state: 'Published' },
  { id: 164, name: 'dogwifhat', logo: 'photo_2023-12-27_17-47-11.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 165, name: 'HALVING4', logo: 'photo_2023-12-27_22-07-22.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 166, name: 'Wolf Invest', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 167, name: 'UNODEX', logo: 'UNODEX-LOGO-WEBSITE.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 168, name: 'Elon Grok Cat', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 169, name: 'DRAGON YEAR', logo: 'photo_2023-12-31_04-35-05.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 170, name: 'Moustache Man MM', logo: 'photo_2023-12-18_16-21-04.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 171, name: 'test2024', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 172, name: 'testB', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 173, name: 'TEST2024KB', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 174, name: 'Doggie Swap', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 175, name: 'Baby BNB', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 176, name: 'testB', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 177, name: 'Optimus Elon AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 178, name: 'Optimus Elon AI', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 179, name: 'Bitcoin ETF', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 180, name: 'HALVING2024', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 181, name: 'HALVING2024', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 183, name: 'Alita Grok v2', logo: 'photo_2024-01-09_23-33-51.jpg', launchpad: 'PinkSale', state: 'Draft' },
  { id: 184, name: 'Perfect World AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 185, name: 'BabyCakePie', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 186, name: 'Arcade Finance', logo: 'photo_2024-01-09_18-57-19.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 187, name: 'TROY', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 188, name: 'RoboBonk', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 189, name: 'BABY WIF INU', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 190, name: '$GARY', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 191, name: 'Innovator', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 192, name: 'BURGER AI', logo: 'photo_2024-01-10_06-43-22.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 194, name: 'Mini Myro', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 195, name: 'PEACHY', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 196, name: 'BabyMickey', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 197, name: 'Mini Myro', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 199, name: 'BABYSAMOYED', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 201, name: 'PEACHY', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 205, name: 'BABY SHENLONG', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 206, name: 'Trending Tool', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 211, name: 'CryptoPlanes Reborn', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 212, name: 'Baby USDT', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 213, name: 'Lil Myro', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 214, name: 'King Myro', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 215, name: 'MyroCeo', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 216, name: 'Baby Mario', logo: 'photo_2024-01-30_11-45-40.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 217, name: 'Skillon', logo: 'photo_2024-01-31_15-40-38.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 218, name: 'Insurrection', logo: 'photo_2024-02-01_06-05-36.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 219, name: 'Meeow', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 220, name: 'XQUOK', logo: 'logo.png', launchpad: 'Binance Chain', state: 'Published' },
  { id: 221, name: 'Blast Domains', logo: 'photo_2023-12-19_07-33-58.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 222, name: 'KING BABY CEO', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 223, name: 'AZURE WALLET', logo: 'App Icon.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 224, name: 'BRO', logo: 'photo_2024-02-10_08-43-29.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 225, name: 'BONKO', logo: 'photo_2024-02-07_22-54-25.jpg', launchpad: 'Solana', state: 'Published' },
  { id: 226, name: 'BitcoinMemeHub', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 227, name: 'BABY JARED', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 228, name: 'SolanaFORK', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 229, name: 'HealthyOcean', logo: 'logo.png', launchpad: 'BNBCHAIN', state: 'Published' },
  { id: 230, name: 'GROK 404', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 231, name: 'WREKT', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 232, name: 'Libra Finance', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 233, name: 'Frog Bsc', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 234, name: 'AI Sora', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 235, name: 'Ltradex', logo: 'photo_2024-02-20_15-38-23.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 236, name: 'Solnado Cash', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 237, name: 'circle index', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 238, name: 'AIDOGE', logo: 'photo_2024-02-24_07-41-01.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 240, name: 'Babykrypto', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 241, name: 'Chadlink', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 242, name: 'Gege', logo: null, launchpad: 'PinkSale', state: 'Published' },
  { id: 243, name: 'BABY IRBIS', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 244, name: 'LTRADEX', logo: 'photo_2024-02-29_22-12-43.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 245, name: 'TOM', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 246, name: 'PEPE AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 247, name: 'XL', logo: 'photo_2024-03-07_09-20-44.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 249, name: 'NEKO', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 250, name: 'OP_CAT', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 251, name: 'MiniPepe Coin', logo: 'photo_2024-03-14_08-57-39.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 252, name: 'SafemoonTon', logo: 'logo.png', launchpad: 'TONSCAN', state: 'Published' },
  { id: 253, name: 'Hemule wif hat', logo: 'photo_2024-03-18_16-00-44.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 254, name: 'MemeCash', logo: 'logo.png', launchpad: 'BNBCHAIN', state: 'Published' },
  { id: 255, name: 'ShibaWifHat', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 256, name: 'BABY GIGGLE LEARN', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 257, name: 'BOOK OF NPC', logo: 'photo_2024-03-20_14-46-14.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 258, name: 'Donald Pump', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 259, name: 'MERV THE CROC', logo: '1710961206764-0a763fac295e690f6a7b12d75b8eebb5.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 260, name: 'Cats Of Sol', logo: '1711039213391-48bc7a91af8847137b880faf98ee0b9c.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 261, name: 'House Of Meme', logo: 'logo.png', launchpad: 'BNBCHAIN', state: 'Published' },
  { id: 262, name: 'FuturesAI', logo: 'logo.png', launchpad: 'PINKSALE', state: 'Published' },
  { id: 263, name: 'BabyDoge 2.0', logo: '1711191117355-6484ffd87f4241662b86bc0aae9d0f9c.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 264, name: 'AI Freedom Token', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 265, name: 'Baby DON', logo: 'download.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 266, name: 'Innit For The Tehc', logo: 'logo.png', launchpad: 'Solana', state: 'Published' },
  { id: 268, name: 'Solar - Artificial Intelligence', logo: 'logo.png', launchpad: null, state: 'Published' },
  { id: 269, name: 'CATDOGE', logo: 'photo_2024-03-26_16-20-14.jpg', launchpad: 'Solana', state: 'Published' },
  { id: 270, name: 'LOBOTOMY DASH', logo: '1711412054702-93cd89262e9a59fcc1e7fab067e41be8.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 271, name: 'Meme Crap Book', logo: '1711403494790-e143c7c267f40ac67ab8362cdefcf2e1.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 272, name: 'SOLEPE', logo: 'logo.png', launchpad: 'Pinksale', state: 'Published' },
  { id: 273, name: 'KANGU', logo: 'photo_2024-03-28_15-03-00.jpg', launchpad: 'Pinksale', state: 'Published' },
  { id: 274, name: 'Slerf Cat', logo: '1711650828183-0dd017d19285094a744d6a315fc6b809.png', launchpad: 'Pinksale', state: 'Published' }
];

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get default project details
function getDefaultDetails(name, slug) {
  return {
    description: `${name} is a cryptocurrency project audited by CFG.NINJA.`,
    symbol: name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    ecosystem: 'Binance Smart Chain',
    audit_score: Math.floor(Math.random() * 30) + 60,
    total_votes: Math.floor(Math.random() * 100),
    audit_confidence: Math.floor(Math.random() * 30) + 60
  };
}

async function migrateProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const proj of projectsList) {
      try {
        let slug = generateSlug(proj.name);
        
        // Handle duplicate names by appending ID
        const existing = await Project.findOne({ slug });
        if (existing) {
          slug = `${slug}-${proj.id}`;
          const stillExists = await Project.findOne({ slug });
          if (stillExists) {
            console.log(`⏭️  Skipping ${proj.name} - already exists`);
            skipCount++;
            continue;
          }
        }
        
        const details = getDefaultDetails(proj.name, slug);
        
        const projectData = {
          name: proj.name,
          slug: slug,
          symbol: details.symbol || proj.name.substring(0, 6).toUpperCase(),
          decimals: 18,
          supply: '1000000000',
          description: details.description,
          logo: proj.logo ? `https://audit.cfg.ninja/uploads/${proj.logo}` : null,
          launchpad: proj.launchpad && proj.launchpad !== 'N/A' && proj.launchpad !== 'None' ? proj.launchpad : null,
          published: proj.state === 'Published',
          ecosystem: details.ecosystem,
          audit_score: details.audit_score,
          total_votes: details.total_votes,
          audit_confidence: details.audit_confidence.toString(),
          page_view: 0,
          socials: {
            website: `https://audit.cfg.ninja/${slug}`
          },
          overview: {
            honeypot: false,
            hidden_owner: false,
            trading_cooldown: false,
            max_tax: false,
            anit_whale: false,
            blacklist: false,
            buy_tax: 0,
            sell_tax: 0
          }
        };
        
        const project = new Project(projectData);
        await project.save();
        
        console.log(`✅ Migrated: ${proj.name} (${slug})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${proj.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary - Batch 2:');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${projectsList.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateProjects();
