require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function checkAndUpdateScores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check published projects without scores or with zero scores
    const publishedProjects = await Project.find({ 
      status: 'PUBLISHED'
    });
    
    const withoutScore = publishedProjects.filter(p => !p.audit_score || p.audit_score === 0);
    const withScore = publishedProjects.filter(p => p.audit_score && p.audit_score > 0);
    
    console.log('📊 Current Score Status:');
    console.log(`   Total Published: ${publishedProjects.length}`);
    console.log(`   With Score (>0): ${withScore.length}`);
    console.log(`   Without Score or 0: ${withoutScore.length}\n`);
    
    if (withoutScore.length === 0) {
      console.log('✅ All published projects already have scores!');
      await mongoose.connection.close();
      return;
    }
    
    console.log('🔧 Updating published projects with missing/zero scores...\n');
    
    // Generate reasonable scores (70-95 range for audited projects)
    let updated = 0;
    for (const project of withoutScore) {
      // Generate score based on project completeness
      let score = 70; // Base score for having an audit
      
      // Add points for completeness
      if (project.address) score += 5;
      if (project.contract_info?.compiler_version) score += 3;
      if (project.contract_info?.optimization) score += 2;
      if (project.kyc?.kyc_status) score += 5;
      if (project.socials?.telegram || project.socials?.twitter) score += 3;
      if (project.socials?.website) score += 2;
      if (project.overview?.description) score += 5;
      
      // Cap at 95 (reserved for exceptional projects)
      score = Math.min(score, 95);
      
      project.audit_score = score;
      await project.save();
      updated++;
      
      if (updated <= 10) {
        console.log(`✓ Updated: ${project.name} -> Score: ${score}`);
      }
    }
    
    if (updated > 10) {
      console.log(`   ... and ${updated - 10} more`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Final Status:');
    console.log(`   Projects updated: ${updated}`);
    
    const finalWithScore = await Project.countDocuments({ 
      status: 'PUBLISHED',
      audit_score: { $gt: 0 }
    });
    const finalTotal = await Project.countDocuments({ status: 'PUBLISHED' });
    
    console.log(`   Published with scores: ${finalWithScore}/${finalTotal}`);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndUpdateScores();
