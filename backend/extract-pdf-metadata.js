require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const fs = require('fs');
const path = require('path');

async function extractDataFromPDFs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get projects with audit PDFs but missing data
    const projects = await Project.find({ 
      published: true,
      $or: [
        { audit_pdf: { $exists: true, $ne: null, $ne: '' } },
        { auditPdfUrl: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).limit(10);
    
    console.log(`📊 Found ${projects.length} projects with audit PDFs\n`);
    
    let updated = 0;
    
    for (const project of projects) {
      console.log(`\n${project.name} (${project.slug})`);
      
      // Extract audit date from PDF filename if available
      const pdfUrl = project.audit_pdf || project.auditPdfUrl;
      if (pdfUrl) {
        // Format: 20220309_CFGNINJA_ProjectName_Audit.pdf
        const dateMatch = pdfUrl.match(/(\d{8})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          const auditDate = `${year}-${month}-${day}`;
          
          if (!project.contract_info) project.contract_info = {};
          project.contract_info.audit_date = auditDate;
          
          console.log(`  ✓ Set audit date: ${auditDate}`);
          updated++;
        }
        
        // Extract symbol from filename if missing
        const symbolMatch = pdfUrl.match(/_([A-Z0-9]+)_Audit\.pdf/i);
        if (symbolMatch && !project.symbol) {
          project.symbol = symbolMatch[1];
          console.log(`  ✓ Set symbol: ${project.symbol}`);
        }
      }
      
      // Set default platform if missing
      if (!project.platform) {
        project.platform = 'Binance Smart Chain'; // Most common
        console.log(`  ✓ Set default platform: ${project.platform}`);
      }
      
      // Generate basic description if missing
      if (!project.overview) project.overview = {};
      if (!project.overview.description) {
        project.overview.description = `${project.name} is a cryptocurrency project audited by CFG Ninja. View the full audit report for detailed security analysis.`;
        console.log(`  ✓ Set default description`);
      }
      
      await project.save();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Updated ${updated} projects`);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extractDataFromPDFs();
