require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function analyzeDataGaps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const totalPublished = await Project.countDocuments({ published: true });
    
    console.log('📊 Data Coverage Analysis\n');
    console.log('='.repeat(60));
    console.log(`Total Published Projects: ${totalPublished}\n`);
    
    // Contract Information
    const withAddress = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' } },
        { address: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    const withCompiler = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'contract_info.compiler_version': { $exists: true, $ne: null, $ne: '' } },
        { 'compiler_version': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    const withOptimization = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'contract_info.optimization': { $exists: true, $ne: null } },
        { 'optimization': { $exists: true, $ne: null } }
      ]
    });
    
    const withAuditDate = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'contract_info.audit_date': { $exists: true, $ne: null, $ne: '' } },
        { 'audit_date': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    console.log('📝 Contract Information:');
    console.log(`   Contract Address: ${withAddress}/${totalPublished} (${((withAddress/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Compiler Version: ${withCompiler}/${totalPublished} (${((withCompiler/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Optimization: ${withOptimization}/${totalPublished} (${((withOptimization/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Audit Date: ${withAuditDate}/${totalPublished} (${((withAuditDate/totalPublished)*100).toFixed(1)}%)`);
    console.log();
    
    // Social Links
    const withWebsite = await Project.countDocuments({ 
      published: true,
      'socials.website': { $exists: true, $ne: null, $ne: '' }
    });
    
    const withTelegram = await Project.countDocuments({ 
      published: true,
      'socials.telegram': { $exists: true, $ne: null, $ne: '' }
    });
    
    const withTwitter = await Project.countDocuments({ 
      published: true,
      'socials.twitter': { $exists: true, $ne: null, $ne: '' }
    });
    
    const withGithub = await Project.countDocuments({ 
      published: true,
      'socials.github': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log('🔗 Social Links:');
    console.log(`   Website: ${withWebsite}/${totalPublished} (${((withWebsite/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Telegram: ${withTelegram}/${totalPublished} (${((withTelegram/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Twitter: ${withTwitter}/${totalPublished} (${((withTwitter/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Github: ${withGithub}/${totalPublished} (${((withGithub/totalPublished)*100).toFixed(1)}%)`);
    console.log();
    
    // KYC Information
    const withKYC = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'kyc.kyc_status': { $exists: true, $ne: null, $ne: '' } },
        { 'kyc_status': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    const withKYCLink = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'kyc.kyc_link': { $exists: true, $ne: null, $ne: '' } },
        { 'kyc_link': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    console.log('✅ KYC Information:');
    console.log(`   KYC Status: ${withKYC}/${totalPublished} (${((withKYC/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   KYC Link: ${withKYCLink}/${totalPublished} (${((withKYCLink/totalPublished)*100).toFixed(1)}%)`);
    console.log();
    
    // Overview/Description
    const withDescription = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'overview.description': { $exists: true, $ne: null, $ne: '' } },
        { 'description': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    const withPlatform = await Project.countDocuments({ 
      published: true,
      platform: { $exists: true, $ne: null, $ne: '' }
    });
    
    const withSymbol = await Project.countDocuments({ 
      published: true,
      symbol: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log('📋 Basic Information:');
    console.log(`   Description: ${withDescription}/${totalPublished} (${((withDescription/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Platform: ${withPlatform}/${totalPublished} (${((withPlatform/totalPublished)*100).toFixed(1)}%)`);
    console.log(`   Symbol: ${withSymbol}/${totalPublished} (${((withSymbol/totalPublished)*100).toFixed(1)}%)`);
    console.log();
    
    // Findings
    const withFindings = await Project.countDocuments({ 
      published: true,
      $or: [
        { 'critical.found': { $gt: 0 } },
        { 'major.found': { $gt: 0 } },
        { 'medium.found': { $gt: 0 } },
        { 'minor.found': { $gt: 0 } }
      ]
    });
    
    console.log('🔍 Audit Findings:');
    console.log(`   With Findings: ${withFindings}/${totalPublished} (${((withFindings/totalPublished)*100).toFixed(1)}%)`);
    console.log();
    
    // Priority improvements
    console.log('='.repeat(60));
    console.log('🎯 Priority Improvements:\n');
    
    const priorities = [
      { name: 'Contract Addresses', current: withAddress, gap: totalPublished - withAddress },
      { name: 'Audit Dates', current: withAuditDate, gap: totalPublished - withAuditDate },
      { name: 'Descriptions', current: withDescription, gap: totalPublished - withDescription },
      { name: 'Symbols', current: withSymbol, gap: totalPublished - withSymbol },
      { name: 'Compiler Versions', current: withCompiler, gap: totalPublished - withCompiler },
      { name: 'Websites', current: withWebsite, gap: totalPublished - withWebsite },
      { name: 'Twitter', current: withTwitter, gap: totalPublished - withTwitter },
      { name: 'Telegram', current: withTelegram, gap: totalPublished - withTelegram }
    ];
    
    priorities.sort((a, b) => b.gap - a.gap);
    
    priorities.forEach((item, i) => {
      const percent = ((item.current / totalPublished) * 100).toFixed(1);
      console.log(`${i + 1}. ${item.name}: ${item.gap} missing (${percent}% coverage)`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n✅ Analysis complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeDataGaps();
