const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

async function checkPlatforms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const projects = await Project.find({ published: true })
      .select('name platform ecosystem')
      .lean();
    
    console.log('\n📊 Platform/Ecosystem Distribution:\n');
    
    // Count by platform
    const platformCounts = {};
    const ecosystemCounts = {};
    
    projects.forEach(p => {
      const platform = p.platform || 'Unknown';
      const ecosystem = p.ecosystem || 'Unknown';
      
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      ecosystemCounts[ecosystem] = (ecosystemCounts[ecosystem] || 0) + 1;
    });
    
    console.log('By Platform:');
    Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count}`);
      });
    
    console.log('\nBy Ecosystem:');
    Object.entries(ecosystemCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ecosystem, count]) => {
        console.log(`  ${ecosystem}: ${count}`);
      });
    
    console.log(`\nTotal Projects: ${projects.length}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlatforms();
