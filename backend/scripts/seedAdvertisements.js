/**
 * Seed script to populate advertisements from the old site
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Advertisement = require('../src/models/Advertisement');

const advertisements = [
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/Bladepool',
    published: true, // Published - Default advertisement
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://assuredefi.com/#marketing',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://chinesewhalers.com/',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://pinksale.finance',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/Crewfire',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/Dwen_Exchange',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/MiniBonkToken',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/listing_ops',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/meowthwifhatSOL',
    published: false, // Draft
  },
  {
    ad_image: 'https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png',
    ad_url: 'https://t.me/slerfcat',
    published: false, // Draft
  },
];

async function seedAdvertisements() {
  console.log('🌱 Seeding Advertisements\n');
  console.log('='.repeat(60) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
    console.log('✅ Connected to MongoDB\n');

    // Clear existing advertisements
    const existingCount = await Advertisement.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing advertisements`);
      const answer = 'yes'; // Auto-confirm for seeding
      
      if (answer.toLowerCase() === 'yes') {
        await Advertisement.deleteMany({});
        console.log('🗑️  Cleared existing advertisements\n');
      } else {
        console.log('❌ Seeding cancelled');
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // Insert advertisements
    console.log('📝 Inserting advertisements...\n');
    
    for (let i = 0; i < advertisements.length; i++) {
      const ad = advertisements[i];
      await Advertisement.create(ad);
      console.log(`   ${i + 1}. ${ad.ad_url} - ${ad.published ? 'Published' : 'Draft'}`);
    }

    console.log(`\n✅ Successfully seeded ${advertisements.length} advertisements!\n`);

    // Show statistics
    const total = await Advertisement.countDocuments();
    const published = await Advertisement.countDocuments({ published: true });
    const draft = await Advertisement.countDocuments({ published: false });

    console.log('📊 Statistics:');
    console.log(`   Total: ${total}`);
    console.log(`   Published: ${published}`);
    console.log(`   Draft: ${draft}\n`);

    console.log('='.repeat(60));
    console.log('🎉 Seeding Complete!\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdvertisements();
