const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Project = require('./src/models/Project');

async function importFullData() {
  try {
    console.log('\n📥 Importing Full Project Data\n');
    console.log('============================================================\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Read the scraped data
    const fullData = JSON.parse(fs.readFileSync('./full-project-data.json', 'utf8'));
    console.log(`📊 Found ${fullData.length} scraped projects\n`);
    
    let updated = 0;
    let failed = 0;
    
    for (const data of fullData) {
      try {
        // Find project by slug
        const project = await Project.findOne({ slug: data.slug });
        
        if (!project) {
          console.log(`❌ Project not found: ${data.slug}`);
          failed++;
          continue;
        }
        
        // Update all fields
        const updateData = {
          // Basic info (only update if we have better data)
          ...(data.token_name && { name: data.token_name }),
          ...(data.symbol && { symbol: data.symbol }),
          ...(data.decimals && { decimals: data.decimals }),
          ...(data.supply && { supply: data.supply }),
          ...(data.platform && { platform: data.platform }),
          
          // Timeline
          ...(data.timeline && { timeline: data.timeline }),
          
          // Contract info - merge with existing
          contract_info: {
            ...project.contract_info,
            ...(data.contract_info.contract_address && { contract_address: data.contract_info.contract_address }),
            ...(data.contract_info.contract_name && { contract_name: data.contract_info.contract_name }),
            ...(data.contract_info.contract_language && { contract_language: data.contract_info.contract_language }),
            ...(data.contract_info.contract_created && { contract_created: data.contract_info.contract_created }),
            ...(data.contract_info.contract_compiler && { contract_compiler: data.contract_info.contract_compiler }),
            ...(data.contract_info.contract_license && { contract_license: data.contract_info.contract_license }),
            contract_verified: data.contract_info.contract_verified,
            ...(data.contract_info_owner && { contract_owner: data.contract_info_owner }),
            ...(data.contract_info_deployer && { contract_deployer: data.contract_info_deployer }),
          },
          
          // Overview - merge with existing
          overview: {
            ...project.overview,
            ...data.overview,
          },
          
          // Scores and findings
          ...(data.audit_score && { audit_score: data.audit_score }),
          ...(data.critical && { critical: data.critical }),
          ...(data.major && { major: data.major }),
          ...(data.medium && { medium: data.medium }),
          ...(data.minor && { minor: data.minor }),
          
          // Calculate total issues
          total_issues: (data.critical?.found || 0) + (data.major?.found || 0) + 
                       (data.medium?.found || 0) + (data.minor?.found || 0),
          
          // Community stats
          ...(data.total_votes && { total_votes: data.total_votes }),
          ...(data.page_view && { page_view: data.page_view }),
          ...(data.audit_confidence && { audit_confidence: data.audit_confidence }),
        };
        
        // Update the project
        await Project.findByIdAndUpdate(project._id, { $set: updateData });
        
        console.log(`✅ Updated ${project.name}`);
        console.log(`   Score: ${data.audit_score}, Votes: ${data.total_votes}, Views: ${data.page_view}`);
        console.log(`   Platform: ${data.platform}`);
        console.log(`   Issues: ${updateData.total_issues} (C:${data.critical?.found || 0} H:${data.major?.found || 0} M:${data.medium?.found || 0} L:${data.minor?.found || 0})`);
        
        updated++;
      } catch (error) {
        console.error(`❌ Error updating ${data.slug}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n============================================================`);
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importFullData();
