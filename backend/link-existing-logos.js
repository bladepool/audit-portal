require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const fs = require('fs');
const path = require('path');

async function linkExistingLogos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all logo files
    const logosPath = path.join(__dirname, '../frontend/public/img/projects');
    const logoFiles = fs.readdirSync(logosPath);
    
    console.log(`📁 Found ${logoFiles.length} logo files on disk\n`);
    
    // Get projects without logos
    const projects = await Project.find({ 
      published: true,
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' }
      ]
    });
    
    console.log(`📊 Found ${projects.length} projects without logos\n`);
    console.log('🔗 Linking logos...\n');
    
    let linked = 0;
    let notFound = 0;
    
    for (const project of projects) {
      // Try to find matching logo file
      const slug = project.slug.toLowerCase();
      const name = project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try different matching patterns
      const matchingFiles = logoFiles.filter(file => {
        const fileLower = file.toLowerCase();
        const fileWithoutExt = path.parse(file).name.toLowerCase();
        
        // Direct slug match
        if (fileWithoutExt === slug) return true;
        if (fileWithoutExt.replace(/[^a-z0-9]/g, '') === slug.replace(/[^a-z0-9]/g, '')) return true;
        
        // Name match
        if (fileWithoutExt === name) return true;
        if (fileWithoutExt.replace(/[^a-z0-9]/g, '') === name) return true;
        
        // Contains match
        if (fileLower.includes(slug)) return true;
        if (slug.includes(fileWithoutExt)) return true;
        
        return false;
      });
      
      if (matchingFiles.length > 0) {
        // Use the first match (usually the best)
        const logoFile = matchingFiles[0];
        project.logo = `/img/projects/${logoFile}`;
        await project.save();
        linked++;
        console.log(`✓ [${linked}] ${project.name} → ${logoFile}`);
      } else {
        notFound++;
        if (notFound <= 10) {
          console.log(`✗ ${project.name} (${slug}) - no match found`);
        }
      }
    }
    
    if (notFound > 10) {
      console.log(`  ... and ${notFound - 10} more without matches`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Logos linked: ${linked}`);
    console.log(`   Not found: ${notFound}`);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkExistingLogos();
