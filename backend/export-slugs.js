/**
 * Export project slugs to a file for scraping
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');
const fs = require('fs');

async function exportSlugs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const projects = await Project.find({ published: true })
      .select('slug name')
      .sort({ createdAt: 1 });
    
    const slugs = projects.map(p => ({
      slug: p.slug,
      name: p.name
    }));
    
    fs.writeFileSync('project-slugs.json', JSON.stringify(slugs, null, 2));
    
    console.log(`📁 Exported ${slugs.length} project slugs to project-slugs.json`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

exportSlugs();
