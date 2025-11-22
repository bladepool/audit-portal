// Polyfills for Node 16
if (typeof ReadableStream === 'undefined') {
  try {
    const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
  } catch (e) {}
}
if (typeof Blob === 'undefined') {
  try {
    const { Blob } = require('buffer');
    global.Blob = Blob;
  } catch (e) {}
}
if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    constructor(parts, name, options) {
      super(parts, options);
      this.name = name;
      this.lastModified = Date.now();
    }
  };
}

const { scrapeProjectPage, updateProject } = require('./scrape-full-audit-data');
const mongoose = require('mongoose');
require('dotenv').config();

async function testOne() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
    
    // Test with a known project slug - you can change this
    const testSlug = process.argv[2] || 'pecunity';
    
    console.log(`Testing scrape for: ${testSlug}\n`);
    
    const data = await scrapeProjectPage(testSlug);
    
    if (data) {
      console.log('\n=== Scraped Data ===');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n=== Updating Database ===');
      await updateProject(testSlug, data);
    } else {
      console.log('No data scraped');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testOne();
