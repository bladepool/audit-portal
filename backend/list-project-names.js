require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const fs = require('fs');

async function listProjectNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const projects = await Project.find({}).select('name').sort({ name: 1 });
    
    console.log(`Total Projects: ${projects.length}\n`);
    
    const names = projects.map(p => p.name);
    fs.writeFileSync('project-names.json', JSON.stringify(names, null, 2));
    
    console.log('First 50 project names:');
    names.slice(0, 50).forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });
    
    console.log(`\n... and ${names.length - 50} more`);
    console.log('\nSaved all project names to project-names.json');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listProjectNames();
