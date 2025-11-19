const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

async function countProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const total = await Project.countDocuments();
    const published = await Project.countDocuments({ published: true });
    const draft = await Project.countDocuments({ published: false });
    
    console.log('\n📊 Project Statistics:');
    console.log(`Total Projects: ${total}`);
    console.log(`Published: ${published}`);
    console.log(`Draft: ${draft}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

countProjects();
