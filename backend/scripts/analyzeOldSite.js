/**
 * Script to analyze the old site (https://audit.cfg.ninja) 
 * and compare with our current database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../src/models/Project');

// We'll skip web scraping for now and focus on database analysis
async function fetchOldSiteProjects() {
  console.log('📡 Note: Direct scraping skipped. Will analyze existing database.\n');
  console.log('💡 To get the exact old site project list:');
  console.log('   1. Check old site API endpoints');
  console.log('   2. Export from old site database');
  console.log('   3. Manually compile list from old site\n');
  
  return [];
}

// Compare with current database
async function compareProjects() {
  console.log('🔍 Analyzing current database...\n');
  
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
  
  const totalProjects = await Project.countDocuments();
  const publishedProjects = await Project.countDocuments({ published: true });
  const unpublishedProjects = await Project.countDocuments({ published: false });
  
  console.log('📊 Current Database Statistics:');
  console.log(`   Total Projects: ${totalProjects}`);
  console.log(`   Published: ${publishedProjects}`);
  console.log(`   Unpublished: ${unpublishedProjects}\n`);
  
  // Get list of unpublished projects
  const unpublished = await Project.find({ published: false })
    .select('name slug createdAt')
    .sort({ createdAt: -1 })
    .limit(20);
  
  console.log('📋 Sample Unpublished Projects (first 20):');
  unpublished.forEach((project, idx) => {
    console.log(`   ${idx + 1}. ${project.name} (${project.slug})`);
  });
  
  console.log(`\n   ... and ${unpublishedProjects - 20} more unpublished projects`);
  
  // Analysis
  console.log('\n💡 Analysis:');
  console.log(`   Old site claims: 376 projects`);
  console.log(`   Our DB has: ${totalProjects} projects`);
  console.log(`   Published: ${publishedProjects} projects`);
  console.log(`   Gap: ${376 - publishedProjects} projects need publishing\n`);
  
  if (unpublishedProjects >= (376 - publishedProjects)) {
    console.log('✅ Good news! We have enough projects in DB to reach 376.');
    console.log(`   Solution: Publish ${376 - publishedProjects} of the ${unpublishedProjects} unpublished projects.\n`);
  } else {
    console.log(`⚠️  We need to import ${376 - totalProjects} more projects.\n`);
  }
  
  await mongoose.disconnect();
}

// Main execution
async function main() {
  console.log('🚀 Starting Old Site Analysis\n');
  console.log('='.repeat(60) + '\n');
  
  // Try to fetch from old site
  const oldSiteProjects = await fetchOldSiteProjects();
  
  // Analyze current database
  await compareProjects();
  
  console.log('='.repeat(60));
  console.log('✅ Analysis complete!\n');
}

main().catch(console.error);
