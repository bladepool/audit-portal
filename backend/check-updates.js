require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function checkUpdates() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const withAuditDate = await Project.countDocuments({ 
    published: true,
    'contract_info.audit_date': { $exists: true, $ne: null, $ne: '' }
  });
  
  const withCompiler = await Project.countDocuments({ 
    published: true,
    'contract_info.compiler_version': { $exists: true, $ne: null, $ne: '' }
  });
  
  const withOptimization = await Project.countDocuments({ 
    published: true,
    'contract_info.optimization': { $exists: true, $ne: null }
  });
  
  const withDescription = await Project.countDocuments({ 
    published: true,
    'overview.description': { $exists: true, $ne: null, $ne: '' }
  });
  
  const withKYC = await Project.countDocuments({ 
    published: true,
    'kyc.kyc_status': { $exists: true, $ne: null, $ne: '' }
  });
  
  console.log('\n📊 Updated Data Coverage:\n');
  console.log(`Audit Dates: ${withAuditDate}/1201`);
  console.log(`Compiler Versions: ${withCompiler}/1201`);
  console.log(`Optimization Flags: ${withOptimization}/1201`);
  console.log(`Descriptions: ${withDescription}/1201`);
  console.log(`KYC Status: ${withKYC}/1201`);
  
  // Sample one project
  const sample = await Project.findOne({ 
    published: true,
    'contract_info.audit_date': { $exists: true }
  });
  
  if (sample) {
    console.log('\n📋 Sample Updated Project:');
    console.log(`Name: ${sample.name}`);
    console.log(`Audit Date: ${sample.contract_info.audit_date}`);
    console.log(`Compiler: ${sample.contract_info.compiler_version}`);
    console.log(`Platform: ${sample.platform}`);
    console.log(`Description: ${sample.overview.description?.substring(0, 100)}...`);
    console.log(`KYC: ${sample.kyc?.kyc_status}`);
  }
  
  await mongoose.connection.close();
}

checkUpdates();
