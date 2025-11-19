/**
 * Script to publish the next 200 projects to match old site's 376 total
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../src/models/Project');

async function publishProjects() {
  console.log('🚀 Publishing Projects to Match Old Site\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
    
    // Get current counts
    const totalProjects = await Project.countDocuments();
    const publishedCount = await Project.countDocuments({ published: true });
    const unpublishedCount = await Project.countDocuments({ published: false });
    
    console.log('📊 Current Status:');
    console.log(`   Total: ${totalProjects}`);
    console.log(`   Published: ${publishedCount}`);
    console.log(`   Unpublished: ${unpublishedCount}\n`);
    
    const targetPublished = 376;
    const needToPublish = targetPublished - publishedCount;
    
    if (needToPublish <= 0) {
      console.log('✅ Already have 376+ published projects!');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`🎯 Target: Publish ${needToPublish} more projects to reach ${targetPublished}\n`);
    
    // Get unpublished projects sorted by creation date (oldest first)
    // This ensures we publish the ones that have been waiting longest
    const projectsToPublish = await Project.find({ published: false })
      .sort({ createdAt: 1 })
      .limit(needToPublish);
    
    console.log('📝 Projects to be published:');
    console.log('─'.repeat(60));
    
    // Update each project
    for (let i = 0; i < projectsToPublish.length; i++) {
      const project = projectsToPublish[i];
      console.log(`   ${i + 1}. ${project.name} (${project.slug})`);
      
      // Update the project
      await Project.updateOne(
        { _id: project._id },
        { $set: { published: true } }
      );
    }
    
    console.log('─'.repeat(60));
    console.log(`\n✅ Successfully published ${projectsToPublish.length} projects!\n`);
    
    // Get new counts
    const newPublishedCount = await Project.countDocuments({ published: true });
    
    console.log('📊 Updated Status:');
    console.log(`   Total: ${totalProjects}`);
    console.log(`   Published: ${newPublishedCount}`);
    console.log(`   Unpublished: ${totalProjects - newPublishedCount}\n`);
    
    console.log('='.repeat(60));
    console.log('🎉 Migration Complete!\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Dry run option - just show what would be published without actually doing it
async function dryRun() {
  console.log('🔍 DRY RUN - Showing what would be published\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
    
    const publishedCount = await Project.countDocuments({ published: true });
    const targetPublished = 376;
    const needToPublish = targetPublished - publishedCount;
    
    console.log(`📊 Would publish ${needToPublish} projects\n`);
    
    const projectsToPublish = await Project.find({ published: false })
      .sort({ createdAt: 1 })
      .limit(needToPublish)
      .select('name slug createdAt');
    
    console.log('📝 Projects that would be published:');
    console.log('─'.repeat(60));
    
    projectsToPublish.forEach((project, idx) => {
      console.log(`   ${idx + 1}. ${project.name} (${project.slug})`);
    });
    
    console.log('─'.repeat(60));
    console.log(`\n💡 Run without --dry-run flag to actually publish these projects\n`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Main execution
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  dryRun().catch(console.error);
} else {
  // Ask for confirmation
  console.log('⚠️  This will publish 200 projects to match the old site total.\n');
  console.log('💡 Run with --dry-run flag to preview first.\n');
  console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
  
  setTimeout(() => {
    publishProjects().catch(console.error);
  }, 3000);
}
