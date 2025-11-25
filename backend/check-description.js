require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function checkDescription() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const withDesc = await Project.countDocuments({ 
    published: true, 
    description: { $exists: true, $ne: null, $ne: '' } 
  });
  
  const withoutDesc = await Project.countDocuments({ 
    published: true, 
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: '' }
    ]
  });
  
  console.log(`\nWith description: ${withDesc}`);
  console.log(`Without description: ${withoutDesc}`);
  
  if (withoutDesc > 0) {
    console.log(`\n⚠️  Description is a required field in the schema!`);
    console.log(`All projects should have descriptions.`);
    
    const sample = await Project.findOne({ 
      published: true,
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    
    if (sample) {
      console.log(`\nSample project without description:`);
      console.log(`Name: ${sample.name}`);
      console.log(`Description: "${sample.description}"`);
    }
  }
  
  await mongoose.connection.close();
}

checkDescription();
