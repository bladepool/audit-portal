require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const fs = require('fs');
const path = require('path');

async function analyzeLogos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const totalProjects = await Project.countDocuments({ published: true });
    const withLogo = await Project.countDocuments({ 
      published: true,
      logo: { $exists: true, $ne: null, $ne: '' }
    });
    const withoutLogo = totalProjects - withLogo;
    
    console.log('📊 Logo Status:');
    console.log(`   Total published: ${totalProjects}`);
    console.log(`   With logo: ${withLogo}`);
    console.log(`   Without logo: ${withoutLogo}`);
    console.log();
    
    // Check existing logo files
    const logosPath = path.join(__dirname, '../frontend/public/img/projects');
    const logoFiles = fs.readdirSync(logosPath);
    console.log(`📁 Logo files on disk: ${logoFiles.length}`);
    console.log();
    
    // Get projects without logos
    const projectsWithoutLogos = await Project.find({ 
      published: true,
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' }
      ]
    }).select('name slug').limit(20);
    
    console.log('📋 First 20 projects without logos:');
    projectsWithoutLogos.forEach((p, i) => {
      // Check if file exists on disk
      const possibleFiles = logoFiles.filter(f => 
        f.toLowerCase().includes(p.slug.toLowerCase())
      );
      console.log(`   ${i + 1}. ${p.name} (${p.slug})`);
      if (possibleFiles.length > 0) {
        console.log(`      Found on disk: ${possibleFiles.join(', ')}`);
      }
    });
    
    // Check votes
    console.log('\n📊 Votes Status:');
    const withVotes = await Project.countDocuments({ 
      published: true,
      total_votes: { $gt: 0 }
    });
    const withoutVotes = totalProjects - withVotes;
    console.log(`   With votes: ${withVotes}`);
    console.log(`   Without votes: ${withoutVotes}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeLogos();
