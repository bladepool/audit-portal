require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

// Normalize string for comparison
function normalizeForComparison(str) {
  return str
    .toLowerCase()
    .replace(/\$/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function findAndRemoveDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all projects
    const projects = await Project.find({}).sort({ createdAt: 1 }); // Keep oldest
    console.log(`📊 Total projects: ${projects.length}\n`);

    // Group by normalized name
    const nameGroups = new Map();
    
    projects.forEach(project => {
      const normalized = normalizeForComparison(project.name);
      if (!nameGroups.has(normalized)) {
        nameGroups.set(normalized, []);
      }
      nameGroups.get(normalized).push(project);
    });

    console.log(`📝 Unique normalized names: ${nameGroups.size}\n`);

    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    const toKeep = [];
    const toRemove = [];

    // Find duplicates
    for (const [normalized, group] of nameGroups.entries()) {
      if (group.length > 1) {
        duplicatesFound += group.length - 1;
        
        // Sort by: 1) has PDF URL, 2) status published, 3) has contract address, 4) oldest
        group.sort((a, b) => {
          if (a.audit_pdf && !b.audit_pdf) return -1;
          if (!a.audit_pdf && b.audit_pdf) return 1;
          if (a.status === 'PUBLISHED' && b.status !== 'PUBLISHED') return -1;
          if (a.status !== 'PUBLISHED' && b.status === 'PUBLISHED') return 1;
          if (a.address && !b.address) return -1;
          if (!a.address && b.address) return 1;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const keeper = group[0];
        const duplicates = group.slice(1);
        
        toKeep.push(keeper);
        toRemove.push(...duplicates);
        
        console.log(`\n🔍 Duplicates found for: ${keeper.name}`);
        console.log(`   Keeping: ${keeper.name} (${keeper._id})`);
        console.log(`   - Status: ${keeper.status}`);
        console.log(`   - PDF: ${keeper.audit_pdf ? 'Yes' : 'No'}`);
        console.log(`   - Address: ${keeper.address || 'N/A'}`);
        console.log(`   - Created: ${keeper.createdAt}`);
        
        duplicates.forEach(dup => {
          console.log(`   Removing: ${dup.name} (${dup._id})`);
          console.log(`   - Status: ${dup.status}`);
          console.log(`   - PDF: ${dup.audit_pdf ? 'Yes' : 'No'}`);
          console.log(`   - Address: ${dup.address || 'N/A'}`);
          console.log(`   - Created: ${dup.createdAt}`);
        });
      } else {
        toKeep.push(group[0]);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total projects: ${projects.length}`);
    console.log(`   Unique names: ${nameGroups.size}`);
    console.log(`   Duplicates found: ${duplicatesFound}`);
    console.log(`   Projects to keep: ${toKeep.length}`);
    console.log(`   Projects to remove: ${toRemove.length}`);
    console.log('='.repeat(60));

    // Ask for confirmation
    console.log('\n⚠️  Ready to remove duplicates. Press Ctrl+C to cancel or wait 5 seconds to proceed...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Remove duplicates
    for (const project of toRemove) {
      await Project.deleteOne({ _id: project._id });
      duplicatesRemoved++;
      console.log(`❌ Removed: ${project.name} (${project._id})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Cleanup Complete:`);
    console.log(`   Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   Projects remaining: ${await Project.countDocuments()}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findAndRemoveDuplicates();
