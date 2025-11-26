/**
 * Initialize IPFS Provider Settings
 * This script initializes the database with IPFS provider API keys
 * Run: node scripts/init-ipfs-settings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../src/models/Settings');

const IPFS_SETTINGS = {
  tatum_api_key: {
    value: 't-69266c94cfecb979898695e4-37b9d1c3668248c6b1c3b1be',
    description: 'Tatum API key for IPFS storage (50MB/month free) - dashboard.tatum.io'
  },
  pinata_api_key: {
    value: 'b3533dad84166424fcbb',
    description: 'Pinata API key for IPFS storage (1GB free) - app.pinata.cloud'
  },
  pinata_secret_key: {
    value: '3654a22737a9482f7432e52777c63b6f02b6e239a4c837f931d1da27fe19b981',
    description: 'Pinata Secret API key for authentication'
  },
  pinata_jwt: {
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2OTA5MmRiYi0xZDg0LTQwOWUtODM0MS0xMDU4MTRhNDdjZmYiLCJlbWFpbCI6InNtYXJ0aW5lenByQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiMzUzM2RhZDg0MTY2NDI0ZmNiYiIsInNjb3BlZEtleVNlY3JldCI6IjM2NTRhMjI3MzdhOTQ4MmY3NDMyZTUyNzc3YzYzYjZmMDJiNmUyMzlhNGM4MzdmOTMxZDFkYTI3ZmUxOWI5ODEiLCJleHAiOjE3OTU2NjE5OTN9.ebhg3k2fdiUtyVHBog0o6ccgws_qOkPHcIBd-1Fda08',
    description: 'Pinata JWT token (preferred authentication method) - app.pinata.cloud → API Keys'
  },
  web3_storage_token: {
    value: '',
    description: 'Web3.Storage token for IPFS (unlimited free) - web3.storage'
  },
  nft_storage_token: {
    value: '',
    description: 'NFT.Storage token for IPFS (unlimited free) - nft.storage'
  }
};

async function initIPFSSettings() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    console.log('Initializing IPFS Provider Settings...\n');

    let updated = 0;
    let created = 0;

    for (const [key, data] of Object.entries(IPFS_SETTINGS)) {
      const existing = await Settings.findOne({ key });
      
      if (existing) {
        // Update existing setting
        existing.value = data.value;
        existing.description = data.description;
        existing.updatedAt = new Date();
        await existing.save();
        console.log(`✓ Updated: ${key}`);
        updated++;
      } else {
        // Create new setting
        await Settings.create({
          key,
          value: data.value,
          description: data.description,
          updatedAt: new Date()
        });
        console.log(`✓ Created: ${key}`);
        created++;
      }
    }

    console.log(`\n✓ Initialization complete!`);
    console.log(`  Created: ${created} settings`);
    console.log(`  Updated: ${updated} settings`);
    console.log(`\nIPFS Providers configured:`);
    console.log(`  ✓ Tatum (Primary) - 50MB/month`);
    console.log(`  ✓ Pinata (Fallback) - 1GB storage`);
    console.log(`  ○ Web3.Storage (Optional) - Unlimited`);
    console.log(`  ○ NFT.Storage (Optional) - Unlimited`);
    console.log(`\nNote: Web3.Storage and NFT.Storage tokens are not set.`);
    console.log(`You can add them via Admin Settings UI if needed.`);

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error initializing IPFS settings:', error);
    process.exit(1);
  }
}

// Run the script
initIPFSSettings();
