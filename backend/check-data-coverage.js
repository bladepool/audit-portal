const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';

async function checkCoverage() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const total = await Project.countDocuments();
    const published = await Project.countDocuments({ status: 'PUBLISHED' });
    const withOverview = await Project.countDocuments({ 'overview.honeypot': { $exists: true } });
    const withTax = await Project.countDocuments({ 'overview.buy_tax': { $exists: true } });
    const withKYC = await Project.countDocuments({ isKYC: { $exists: true, $ne: '' } });
    const withContractAddress = await Project.countDocuments({ 
      $or: [
        { address: { $exists: true, $ne: '' } },
        { 'contract_info.contract_address': { $exists: true, $ne: '' } }
      ]
    });
    const withCompiler = await Project.countDocuments({ 'contract_info.contract_compiler': { $exists: true, $ne: '' } });
    
    console.log('📊 Database Coverage Report:\n');
    console.log(`Total projects: ${total}`);
    console.log(`Published: ${published}`);
    console.log(`With contract address: ${withContractAddress}`);
    console.log(`With compiler info: ${withCompiler}`);
    console.log(`With overview/security data: ${withOverview}`);
    console.log(`With tax data: ${withTax}`);
    console.log(`With KYC data: ${withKYC}`);
    
    console.log('\n📈 Coverage Percentages:\n');
    console.log(`Published: ${((published/total)*100).toFixed(1)}%`);
    console.log(`Contract Address: ${((withContractAddress/total)*100).toFixed(1)}%`);
    console.log(`Compiler Info: ${((withCompiler/total)*100).toFixed(1)}%`);
    console.log(`Security/Overview: ${((withOverview/total)*100).toFixed(1)}%`);
    console.log(`Tax: ${((withTax/total)*100).toFixed(1)}%`);
    console.log(`KYC: ${((withKYC/total)*100).toFixed(1)}%`);
    
    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCoverage();
