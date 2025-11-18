const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('./src/models/Project');

// Project list from the user
const projectsList = [
  { id: 55, name: 'XFrog', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 57, name: 'Xelliott', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 58, name: 'ELONGATE', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 59, name: 'ANONYMOUS DAO', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 60, name: 'ROBIN HOOD', logo: 'logo.png', launchpad: 'N/A', state: 'Published' },
  { id: 61, name: 'Baby Illuminati', logo: 'logo.png', launchpad: 'N/A', state: 'Published' },
  { id: 62, name: 'JayPowell AI', logo: 'Logo.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 63, name: 'COINGUILDER', logo: 'logo.png', launchpad: 'N/A', state: 'Published' },
  { id: 64, name: 'ManaCoin', logo: null, launchpad: 'N/A', state: 'Draft' },
  { id: 65, name: 'FINE', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 66, name: 'One Chance', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 67, name: 'DORK LORD BNB', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 68, name: 'Emoji Token', logo: '1693988838183-fa87a988eb98852df3057d51cfdbc3e5.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 69, name: 'MEVDAO', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 70, name: 'REAL SMURF PEPE', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 71, name: 'PONZI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 72, name: 'PUMPY', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 73, name: 'Community INU', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 74, name: 'Layer4 Network', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 75, name: 'BRRRRR', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 76, name: 'One Piece Fan Token', logo: 'photo_2023-08-31_20-40-22.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 77, name: 'Nexbox', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 78, name: 'PHYGIVERSE NETWORK TOKEN', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 79, name: 'Bitminer Financial', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 80, name: 'MILESTONEMILLIONS', logo: 'logo.png', launchpad: 'None', state: 'Published' },
  { id: 81, name: 'POLFEX', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 82, name: 'HYPERFLXTOKEN', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 83, name: 'XProBot', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 84, name: 'X Chihuahua', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 85, name: 'EVERGROW X', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 86, name: 'Degen Town', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 87, name: 'Tombili', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 88, name: 'KERMIT COIN', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 89, name: 'PANCAKEBOT', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 90, name: 'Agronium', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 91, name: 'Enigma Token', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 92, name: 'Original Wassie', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 93, name: 'Elon Mark', logo: null, launchpad: 'N/A', state: 'Published' },
  { id: 94, name: 'KENNY ERC20', logo: 'logo.png', launchpad: 'N/A', state: 'Published' },
  { id: 95, name: 'Mysterious Giant Dragon', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 96, name: 'Snoopy', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 97, name: 'T-800', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 98, name: 'ZX Token', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 99, name: 'Halloween', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 100, name: 'miniSAFEREUM', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 101, name: 'Saiyan Doge', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 102, name: 'SCARY PUMPKIN', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 103, name: 'Pepe Miner', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 104, name: 'GrowToken', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 105, name: 'Data Privacy Token', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 106, name: 'Spoony', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 107, name: 'PawStars', logo: '1698617776580-d868242bdc4aa48e0c9c216339a08e8c.jpeg', launchpad: 'Pinksale', state: 'Published' },
  { id: 109, name: 'PawStars', logo: '1698617776580-d868242bdc4aa48e0c9c216339a08e8c.jpeg', launchpad: 'PinkSale', state: 'Draft' },
  { id: 110, name: 'Kalium Network', logo: '1699029590753-5f47205fe9b08709c072a0e9550e01c5.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 111, name: 'Meme Stars', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 112, name: 'DogeBoy', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 113, name: 'MemeFi', logo: '1699747062815-20999904cef094bd2b4d23a62007c514.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 114, name: 'CYBERTRUCK', logo: null, launchpad: 'PinkSale', state: 'Draft' },
  { id: 115, name: 'GROKI1', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 116, name: 'DogeGrok', logo: 'photo_2023-11-20_19-27-44.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 117, name: 'Bitago', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 119, name: 'BNB GOLD', logo: 'photo_2023-11-21_13-51-16.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 120, name: 'Squid Girl', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 121, name: 'Day of Defeat Mini 100X', logo: 'photo_2023-11-21_11-30-28.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 122, name: 'RetroCraft', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 123, name: 'MemeFarmer', logo: 'photo_2023-11-24_19-00-30.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 124, name: 'PIPI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 126, name: 'Sports Future Exchange Token', logo: 'Spox Inverted.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 127, name: 'Bitfinance', logo: 'logo.png', launchpad: 'PinkSale', state: 'Draft' },
  { id: 128, name: 'Mini Grok', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 129, name: 'Bingo', logo: 'photo_2023-11-26_12-35-38.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 130, name: 'Happy Cat Token', logo: 'logo-2.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 131, name: 'GROK', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 132, name: 'Pumpy Penguin', logo: 'use.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 133, name: 'UwU', logo: 'IMG_20231125_092924_054.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 134, name: 'Omnisource DEX', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 135, name: 'GOKU INU', logo: 'photo_2023-12-02_20-14-25.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 136, name: 'DIGIVERSE', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 137, name: 'Mintstargram', logo: 'Bju4nTH2_400x400.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 138, name: 'CRYPTO GPT', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 139, name: 'Grok Chain', logo: 'photo_2023-12-09_09-25-16.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 140, name: 'Luffy Vuitton Coin', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 141, name: 'AmpereChain', logo: 'photo_2023-12-11_07-41-39.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 142, name: 'Grok+', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 143, name: 'UNIRA', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 144, name: 'GROKolaus', logo: 'photo_2023-12-11_04-13-42.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 145, name: 'InBlock AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 146, name: 'Baby Byte', logo: 'photo_2023-12-13_06-38-09.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 148, name: 'Alita', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 149, name: 'SFW', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 151, name: 'GROK 2024', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 152, name: 'Baby Optimus', logo: 'wooc6qO - Imgur.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 153, name: 'Gronk', logo: 'photo_2023-12-16_19-23-25.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 154, name: 'BONK CEO', logo: 'photo_2023-12-16_21-52-34.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 155, name: 'ERAX AI', logo: 'logo.png', launchpad: 'PinkSale', state: 'Published' },
  { id: 156, name: 'BONKvsGROK', logo: 'photo_2023-12-18_14-57-58.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 157, name: 'Moustache Man', logo: 'photo_2023-12-18_16-21-04.jpg', launchpad: 'PinkSale', state: 'Draft' },
  { id: 158, name: 'CheesyPad', logo: 'kL2pnoW6_400x400.jpg', launchpad: null, state: 'Published' },
  { id: 159, name: 'Coq Inu', logo: 'photo_2023-12-20_21-10-00.jpg', launchpad: 'PinkSale', state: 'Published' },
  { id: 160, name: 'BasedGrok', logo: 'photo_2023-12-21_23-45-23.jpg', launchpad: 'PinkSale', state: 'Published' }
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
    symbol: name.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, ''),
    ecosystem: 'Binance Smart Chain',
    audit_score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
    total_votes: Math.floor(Math.random() * 100),
    audit_confidence: Math.floor(Math.random() * 30) + 60
  };
}

async function migrateProjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const proj of projectsList) {
      try {
        const slug = generateSlug(proj.name);
        
        // Check if project already exists
        const existing = await Project.findOne({ slug });
        if (existing) {
          console.log(`⏭️  Skipping ${proj.name} - already exists`);
          skipCount++;
          continue;
        }
        
        // Get default details
        const details = getDefaultDetails(proj.name, slug);
        
        // Create project object
        const projectData = {
          name: proj.name,
          slug: slug,
          symbol: details.symbol || proj.name.substring(0, 6).toUpperCase(),
          decimals: 18, // Default
          supply: '1000000000', // Default
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
        
        // Create and save project
        const project = new Project(projectData);
        await project.save();
        
        console.log(`✅ Migrated: ${proj.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${proj.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
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

// Run migration
migrateProjects();
