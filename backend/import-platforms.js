const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Project = require('./src/models/Project');

async function importPlatforms() {
  try {
    console.log('\n📥 Importing Platform Data\n');
    console.log('============================================================\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Read the scraped data
    const platformData = JSON.parse(fs.readFileSync('./platform-data.json', 'utf8'));
    console.log(`📊 Found ${platformData.length} scraped results\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const item of platformData) {
      if (!item.platform && !item.ecosystem) {
        console.log(`⏭️  Skipping ${item.name} - No platform/ecosystem data`);
        skipped++;
        continue;
      }
      
      const updateData = {};
      
      if (item.platform) {
        updateData.platform = item.platform;
      }
      
      if (item.ecosystem) {
        updateData.ecosystem = item.ecosystem;
      }
      
      const result = await Project.findOneAndUpdate(
        { slug: item.slug },
        { $set: updateData },
        { new: true }
      );
      
      if (result) {
        console.log(`✅ Updated ${item.name}:`);
        if (item.platform) console.log(`   Platform: ${item.platform}`);
        if (item.ecosystem) console.log(`   Ecosystem: ${item.ecosystem}`);
        updated++;
      } else {
        console.log(`❌ Project not found: ${item.name} (${item.slug})`);
      }
    }
    
    console.log(`\n============================================================`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${platformData.length - updated - skipped}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importPlatforms();
