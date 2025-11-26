/**
 * Test IPFS Upload with Database Settings
 * This script tests the IPFS upload functionality using settings from the database
 * Run: node test-ipfs-upload.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { IPFSUploader } = require('./src/utils/ipfs');

async function testIPFSUpload() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Initialize IPFS uploader
    console.log('Initializing IPFS Uploader...');
    const uploader = new IPFSUploader();
    
    // Load settings from database
    await uploader.loadSettings();
    console.log('✓ Settings loaded\n');

    // Create a test file (simple text file)
    const testContent = `Test IPFS Upload
Generated: ${new Date().toISOString()}
Portal: Audit Portal
Purpose: Testing IPFS upload with Pinata

This is a test file to verify IPFS upload functionality.
Providers configured:
- Tatum (Primary)
- Pinata (Fallback with JWT)
- Web3.Storage (Optional)
- NFT.Storage (Optional)
`;

    const testBuffer = Buffer.from(testContent, 'utf-8');
    const testFilename = `audit-portal-test-${Date.now()}.txt`;

    console.log('Uploading test file to IPFS...');
    console.log(`Filename: ${testFilename}`);
    console.log(`Size: ${testBuffer.length} bytes\n`);

    // Upload to IPFS
    const result = await uploader.upload(testBuffer, testFilename);

    console.log('\n✓ Upload successful!');
    console.log(`  Provider: ${result.provider}`);
    console.log(`  IPFS Hash: ${result.ipfsHash}`);
    console.log(`  Gateway URL: ${result.url}`);
    if (result.gatewayUrl) {
      console.log(`  Provider Gateway: ${result.gatewayUrl}`);
    }

    // Get all gateway URLs
    console.log('\nAll Gateway URLs:');
    const gateways = uploader.getGatewayUrls(result.ipfsHash);
    Object.entries(gateways).forEach(([name, url]) => {
      console.log(`  ${name}: ${url}`);
    });

    console.log('\n✓ Test completed successfully!');
    console.log('\nYou can view the file at any of the gateway URLs above.');

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testIPFSUpload();
