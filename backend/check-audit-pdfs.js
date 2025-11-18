require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function checkAuditPdfs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const projects = await Project.find({}).select('name slug auditPdfUrl').sort({ name: 1 });
    
    console.log(`\nTotal Projects: ${projects.length}\n`);
    
    const withPdf = projects.filter(p => p.auditPdfUrl && p.auditPdfUrl.trim() !== '');
    const withoutPdf = projects.filter(p => !p.auditPdfUrl || p.auditPdfUrl.trim() === '');
    
    console.log(`Projects WITH audit PDF: ${withPdf.length}`);
    console.log(`Projects WITHOUT audit PDF: ${withoutPdf.length}\n`);
    
    if (withPdf.length > 0) {
      console.log('Sample projects WITH PDF:');
      withPdf.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.slug}): ${p.auditPdfUrl}`);
      });
    }
    
    if (withoutPdf.length > 0) {
      console.log('\nFirst 20 projects WITHOUT PDF:');
      withoutPdf.slice(0, 20).forEach(p => {
        console.log(`  - ${p.name} (${p.slug})`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAuditPdfs();
