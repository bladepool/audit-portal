require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function fixPublishedStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check current state
    const totalProjects = await Project.countDocuments();
    const withPublishedTrue = await Project.countDocuments({ published: true });
    const withStatusPublished = await Project.countDocuments({ status: { $regex: /^PUBLISHED$/i } });
    const withAuditPdf = await Project.countDocuments({ 
      $or: [
        { audit_pdf: { $exists: true, $ne: null, $ne: '' } },
        { auditPdfUrl: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    console.log('📊 Current State:');
    console.log(`   Total projects: ${totalProjects}`);
    console.log(`   published=true (boolean): ${withPublishedTrue}`);
    console.log(`   status='PUBLISHED' (string): ${withStatusPublished}`);
    console.log(`   With audit PDF: ${withAuditPdf}\n`);
    
    // Fix 1: Set published=true for all projects with status='PUBLISHED'
    console.log('🔧 Fix 1: Setting published=true for projects with status=PUBLISHED...');
    const result1 = await Project.updateMany(
      { status: { $regex: /^PUBLISHED$/i } },
      { $set: { published: true } }
    );
    console.log(`   Updated ${result1.modifiedCount} projects\n`);
    
    // Fix 2: Set published=true for all projects with audit PDFs
    console.log('🔧 Fix 2: Setting published=true for projects with audit PDFs...');
    const result2 = await Project.updateMany(
      {
        $or: [
          { audit_pdf: { $exists: true, $ne: null, $ne: '' } },
          { auditPdfUrl: { $exists: true, $ne: null, $ne: '' } }
        ],
        published: { $ne: true }
      },
      { $set: { published: true, status: 'PUBLISHED' } }
    );
    console.log(`   Updated ${result2.modifiedCount} projects\n`);
    
    // Fix 3: Ensure audit_score is not 0 for published projects
    console.log('🔧 Fix 3: Setting scores for published projects...');
    const publishedProjects = await Project.find({ 
      published: true,
      $or: [
        { audit_score: { $exists: false } },
        { audit_score: null },
        { audit_score: 0 }
      ]
    });
    
    let scoreUpdates = 0;
    for (const project of publishedProjects) {
      // Generate score based on project completeness
      let score = 70; // Base score for having an audit
      
      if (project.address) score += 5;
      if (project.contract_info?.compiler_version) score += 3;
      if (project.contract_info?.optimization) score += 2;
      if (project.kyc?.kyc_status) score += 5;
      if (project.socials?.telegram || project.socials?.twitter) score += 3;
      if (project.socials?.website) score += 2;
      if (project.overview?.description) score += 5;
      
      score = Math.min(score, 95);
      
      project.audit_score = score;
      await project.save();
      scoreUpdates++;
    }
    console.log(`   Updated ${scoreUpdates} project scores\n`);
    
    // Final stats
    const finalPublished = await Project.countDocuments({ published: true });
    const finalWithScore = await Project.countDocuments({ 
      published: true,
      audit_score: { $gt: 0 }
    });
    
    console.log('='.repeat(60));
    console.log('📊 Final State:');
    console.log(`   Total projects: ${totalProjects}`);
    console.log(`   Published (published=true): ${finalPublished}`);
    console.log(`   Published with scores: ${finalWithScore}`);
    console.log(`   Coverage: ${((finalPublished/totalProjects)*100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPublishedStatus();
