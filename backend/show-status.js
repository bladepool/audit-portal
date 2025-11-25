require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function showStatus() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const total = await Project.countDocuments({ published: true });
  const withLogos = await Project.countDocuments({ 
    published: true, 
    logo: { $exists: true, $ne: null, $ne: '' } 
  });
  const withVotes = await Project.countDocuments({ 
    published: true, 
    total_votes: { $gt: 0 } 
  });
  
  console.log('\n📊 Current Status:\n');
  console.log(`Total Published: ${total}`);
  console.log(`With Logos: ${withLogos} (${((withLogos/total)*100).toFixed(1)}%)`);
  console.log(`Without Logos: ${total - withLogos}`);
  console.log();
  console.log(`With Votes: ${withVotes} (${((withVotes/total)*100).toFixed(1)}%)`);
  console.log(`Without Votes: ${total - withVotes}`);
  console.log();
  
  await mongoose.connection.close();
}

showStatus();
