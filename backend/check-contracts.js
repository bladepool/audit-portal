const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

async function checkContracts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const total = await Project.countDocuments({ published: true });
    const withAddress = await Project.countDocuments({ 
      published: true, 
      'contract_info.contract_address': { $exists: true, $ne: '' } 
    });
    
    console.log('\n📊 Contract Address Statistics:');
    console.log(`Total Published: ${total}`);
    console.log(`With Contract Address: ${withAddress}`);
    console.log(`Without Contract Address: ${total - withAddress}`);
    
    // Get a sample project with contract address
    const sample = await Project.findOne({ 
      published: true, 
      'contract_info.contract_address': { $exists: true, $ne: '' } 
    }).select('name symbol contract_info.contract_address platform');
    
    if (sample) {
      console.log('\n📝 Sample Project:');
      console.log(`Name: ${sample.name}`);
      console.log(`Symbol: ${sample.symbol}`);
      console.log(`Platform: ${sample.platform}`);
      console.log(`Contract: ${sample.contract_info.contract_address}`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkContracts();
