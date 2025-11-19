/**
 * Import scraped contract addresses into the database
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');
const fs = require('fs');

async function importAddresses() {
  console.log('📥 Importing Contract Addresses\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Read the scraped data
    const scrapedData = JSON.parse(fs.readFileSync('contract-addresses.json', 'utf8'));
    
    console.log(`📊 Found ${scrapedData.length} scraped results\n`);
    
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    
    for (const item of scrapedData) {
      if (!item.address || !item.found) {
        console.log(`⏭️  Skipping ${item.name} - No address found`);
        skipped++;
        continue;
      }
      
      try {
        // Update the project
        const result = await Project.updateOne(
          { slug: item.slug },
          { 
            $set: { 
              'contract_info.contract_address': item.address 
            } 
          }
        );
        
        if (result.matchedCount > 0) {
          console.log(`✅ Updated ${item.name}: ${item.address}`);
          updated++;
        } else {
          console.log(`❌ Project not found in DB: ${item.name}`);
          notFound++;
        }
      } catch (error) {
        console.error(`⚠️  Error updating ${item.name}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Import Statistics:');
    console.log(`   Total Scraped: ${scrapedData.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (no address): ${skipped}`);
    console.log(`   ❌ Not Found in DB: ${notFound}`);
    
    // Verify final count
    const totalWithAddress = await Project.countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: '' }
    });
    
    console.log(`\n   📈 Total projects with addresses: ${totalWithAddress}`);
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Import Complete!\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importAddresses();
