require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function addDatabaseIndexes() {
  try {
    console.log('\n📊 Adding Database Indexes for Performance...\n');
    
    const collection = Project.collection;
    
    // Get existing indexes
    const existingIndexes = await collection.indexes();
    console.log('Current indexes:', existingIndexes.length);
    console.log('='.repeat(60));
    
    const indexesToCreate = [
      // Core search/filter indexes
      { keys: { published: 1, audit_score: -1 }, name: 'published_score' },
      { keys: { published: 1, name: 1 }, name: 'published_name' },
      { keys: { published: 1, platform: 1 }, name: 'published_platform' },
      { keys: { published: 1, 'timeline.audit_release': -1 }, name: 'published_date' },
      
      // Search indexes
      { keys: { name: 'text', description: 'text' }, name: 'text_search' },
      { keys: { slug: 1 }, name: 'slug_lookup', unique: true },
      
      // Filter indexes
      { keys: { status: 1 }, name: 'status_filter' },
      { keys: { 'contract_info.contract_address': 1 }, name: 'contract_address' },
      
      // Sorting indexes
      { keys: { total_votes: -1 }, name: 'votes_desc' },
      { keys: { createdAt: -1 }, name: 'created_desc' },
      { keys: { updatedAt: -1 }, name: 'updated_desc' },
      
      // Compound indexes for common queries
      { keys: { published: 1, status: 1, audit_score: -1 }, name: 'published_status_score' },
      { keys: { published: 1, platform: 1, audit_score: -1 }, name: 'published_platform_score' }
    ];
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const index of indexesToCreate) {
      try {
        const indexName = index.name;
        const exists = existingIndexes.some(idx => idx.name === indexName);
        
        if (exists) {
          console.log(`⏭️  Index "${indexName}" already exists`);
          skipped++;
          continue;
        }
        
        const options = { 
          name: indexName,
          background: true
        };
        
        if (index.unique) {
          options.unique = true;
        }
        
        await collection.createIndex(index.keys, options);
        console.log(`✅ Created index: ${indexName}`);
        created++;
        
      } catch (err) {
        console.error(`❌ Error creating index ${index.name}:`, err.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Index Creation Summary:');
    console.log('='.repeat(60));
    console.log(`Total indexes to create: ${indexesToCreate.length}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    // Get updated indexes
    const updatedIndexes = await collection.indexes();
    console.log(`\nTotal indexes now: ${updatedIndexes.length}`);
    
    // Show all indexes
    console.log('\n📋 All Database Indexes:');
    console.log('='.repeat(60));
    updatedIndexes.forEach((idx, i) => {
      const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
      console.log(`${i + 1}. ${idx.name}`);
      console.log(`   Keys: {${keys}}`);
      if (idx.unique) console.log(`   Unique: true`);
    });
    
    // Analyze query performance
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Testing Index Performance:');
    console.log('='.repeat(60));
    
    const queries = [
      { name: 'Published projects by score', query: { published: true }, sort: { audit_score: -1 }, limit: 10 },
      { name: 'Published projects by platform', query: { published: true, platform: 'Binance Smart Chain' }, limit: 10 },
      { name: 'Published projects by date', query: { published: true }, sort: { 'timeline.audit_release': -1 }, limit: 10 },
      { name: 'Text search', query: { $text: { $search: 'token' } }, limit: 10 }
    ];
    
    for (const test of queries) {
      const start = Date.now();
      await Project.find(test.query).sort(test.sort || {}).limit(test.limit);
      const duration = Date.now() - start;
      console.log(`✓ ${test.name}: ${duration}ms`);
    }
    
    console.log('\n✅ Database optimization complete!');
    
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addDatabaseIndexes();
