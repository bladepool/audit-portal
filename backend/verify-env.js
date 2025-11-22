/**
 * Environment Variables Verification Script
 * Run this on Railway to debug what's available
 */

require('dotenv').config();

console.log('=== Environment Verification ===\n');

// Check Node version
console.log('Node Version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('\n=== MongoDB Configuration ===');

// Check MongoDB URI (hide password)
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  const masked = uri.replace(/:[^@]+@/, ':****@');
  console.log('MONGODB_URI:', masked);
  console.log('MongoDB URI format:', uri.startsWith('mongodb://') ? 'mongodb://' : uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'invalid');
} else {
  console.log('❌ MONGODB_URI not set!');
}

console.log('\n=== Testing MongoDB Connection ===');

// Test MongoDB connection
const { MongoClient } = require('mongodb');

if (!process.env.MONGODB_URI) {
  console.error('❌ Cannot test connection - MONGODB_URI not set');
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db();
    console.log('Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    // Count projects
    const projectsCount = await db.collection('projects').countDocuments();
    console.log('Projects count:', projectsCount);
    
    // Test a sample query
    const sampleProject = await db.collection('projects').findOne({ published: true });
    console.log('Sample project found:', sampleProject ? sampleProject.name : 'none');
    
    console.log('\n✅ All checks passed!');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

console.log('\n=== Module Loading Test ===');

// Test loading all required modules
const modules = [
  'express',
  'cors',
  'mongoose',
  'mongodb',
  'jsonwebtoken',
  'bcryptjs',
  'dotenv',
  'axios'
];

console.log('Testing module loading...');
for (const mod of modules) {
  try {
    require(mod);
    console.log(`✅ ${mod}`);
  } catch (error) {
    console.log(`❌ ${mod}: ${error.message}`);
  }
}

console.log('\n=== File System Checks ===');

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/server.js',
  'src/routes/auth.js',
  'src/routes/projects.js',
  'src/routes/blockchains.js',
  'src/routes/advertisements.js',
  'src/routes/trustblock.js',
  'src/models/User.js',
  'src/models/Project.js',
  'src/services/trustBlockService.js',
  'src/services/goplusService.js'
];

console.log('Checking required files...');
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
  }
}

// Run the connection test
testConnection();
