require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function checkSample() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get sample project with PDF
    const withPdf = await Project.findOne({ auditPdfUrl: { $exists: true, $ne: '' } });
    
    if (withPdf) {
      console.log('Sample project WITH PDF:');
      console.log(`  Name: ${withPdf.name}`);
      console.log(`  Slug: ${withPdf.slug}`);
      console.log(`  PDF: ${withPdf.auditPdfUrl}\n`);
    } else {
      console.log('No projects with PDF found');
    }
    
    // Count total
    const total = await Project.countDocuments();
    const withPdfs = await Project.countDocuments({ auditPdfUrl: { $exists: true, $ne: '' } });
    const withoutPdfs = await Project.countDocuments({ $or: [{ auditPdfUrl: { $exists: false } }, { auditPdfUrl: '' }] });
    
    console.log(`Total projects: ${total}`);
    console.log(`With PDF: ${withPdfs}`);
    console.log(`Without PDF: ${withoutPdfs}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSample();
