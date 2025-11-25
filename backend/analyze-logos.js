require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const fs = require('fs');
const path = require('path');

// Logo directories
const LOGO_DIR = path.join(__dirname, '..', 'frontend', 'public', 'logos');
const OLD_LOGO_DIR_1 = path.join(__dirname, '../frontend/public/img/projects');
const OLD_LOGO_DIR_2 = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\logos';

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function analyzeLogos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('='.repeat(60));
    console.log('🔍 LOGO ANALYSIS');
    console.log('='.repeat(60));

    // Analyze new logo directory
    if (fs.existsSync(LOGO_DIR)) {
      const currentLogos = fs.readdirSync(LOGO_DIR);
      let totalSize = 0;
      const fileTypes = {};
      
      currentLogos.forEach(file => {
        const filepath = path.join(LOGO_DIR, file);
        const stats = fs.statSync(filepath);
        totalSize += stats.size;
        const ext = path.extname(file).toLowerCase();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      });
      
      console.log(`\n📁 New Logos Directory: ${LOGO_DIR}`);
      console.log(`   Files: ${currentLogos.length}`);
      console.log(`   Total size: ${formatBytes(totalSize)}`);
      console.log(`   File types:`, fileTypes);
    } else {
      console.log(`\n📁 New Logos Directory: Not found`);
      console.log(`   Creating: ${LOGO_DIR}`);
      fs.mkdirSync(LOGO_DIR, { recursive: true });
    }
    
    // Analyze old logo directories
    if (fs.existsSync(OLD_LOGO_DIR_1)) {
      const oldLogos1 = fs.readdirSync(OLD_LOGO_DIR_1);
      console.log(`\n📁 Old Logos (img/projects): ${oldLogos1.length} files`);
    }
    
    if (fs.existsSync(OLD_LOGO_DIR_2)) {
      const oldLogos2 = fs.readdirSync(OLD_LOGO_DIR_2);
      console.log(`📁 Old Logos (Custom Contract): ${oldLogos2.length} files`);
    }

    // Database analysis
    const totalProjects = await Project.countDocuments({ published: true });
    const withLogo = await Project.countDocuments({ 
      published: true,
      logo: { $exists: true, $ne: null, $ne: '' }
    });
    const withoutLogo = totalProjects - withLogo;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE LOGO STATUS');
    console.log('='.repeat(60));
    console.log(`Total published projects: ${totalProjects}`);
    console.log(`With logos: ${withLogo} (${((withLogo/totalProjects)*100).toFixed(1)}%)`);
    console.log(`Without logos: ${withoutLogo} (${((withoutLogo/totalProjects)*100).toFixed(1)}%)`);
    
    // Analyze logo types
    const logoTypes = await Project.aggregate([
      { $match: { published: true, logo: { $exists: true, $ne: null, $ne: '' } } },
      { 
        $project: {
          logoType: {
            $cond: [
              { $regexMatch: { input: '$logo', regex: /placeholder/i } },
              'placeholder',
              {
                $cond: [
                  { $regexMatch: { input: '$logo', regex: /\/logos\// } },
                  'new',
                  'old'
                ]
              }
            ]
          }
        }
      },
      { $group: { _id: '$logoType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nLogo Types Breakdown:');
    logoTypes.forEach(type => {
      console.log(`   ${type._id}: ${type.count}`);
    });
    
    // Projects with websites but no logos
    const needLogos = await Project.countDocuments({
      published: true,
      'socials.website': { $exists: true, $ne: null, $ne: '' },
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' }
      ]
    });
    
    console.log(`\n🎯 Projects with websites but no logos: ${needLogos}`);
    
    // Sample projects without logos
    const projectsWithoutLogos = await Project.find({ 
      published: true,
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' }
      ]
    }).select('name slug socials.website').limit(10);
    
    if (projectsWithoutLogos.length > 0) {
      console.log('\n📋 Sample projects without logos (first 10):');
      projectsWithoutLogos.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        if (p.socials?.website) {
          console.log(`      Website: ${p.socials.website}`);
        }
      });
    }
    
    // Votes status
    console.log('\n' + '='.repeat(60));
    console.log('📊 VOTES STATUS');
    console.log('='.repeat(60));
    const withVotes = await Project.countDocuments({ 
      published: true,
      total_votes: { $gt: 0 }
    });
    console.log(`With votes: ${withVotes} (${((withVotes/totalProjects)*100).toFixed(1)}%)`);
    console.log(`Without votes: ${totalProjects - withVotes} (${(((totalProjects - withVotes)/totalProjects)*100).toFixed(1)}%)`);
    
    // Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMMENDED ACTIONS');
    console.log('='.repeat(60));
    
    if (needLogos > 0) {
      console.log(`\n1. Download logos from websites:`);
      console.log(`   Command: node download-logos-from-websites.js`);
      console.log(`   Target: ${Math.min(needLogos, 100)} projects (first 100)`);
    }
    
    if (withoutLogo > 0) {
      console.log(`\n2. Generate placeholder logos:`);
      console.log(`   Command: node generate-placeholder-logos.js`);
      console.log(`   Target: ${withoutLogo} projects`);
      console.log(`   Result: 100% logo coverage`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n✅ Analysis complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeLogos();
