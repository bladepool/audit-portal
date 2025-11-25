require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function countProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const total = await Project.countDocuments();
    const withPdf = await Project.countDocuments({ 
      audit_pdf: { $exists: true, $ne: null, $ne: '' } 
    });
    const published = await Project.countDocuments({ 
      status: { $regex: /published/i } 
    });
    const publishedWithPdf = await Project.countDocuments({ 
      status: { $regex: /published/i }, 
      audit_pdf: { $exists: true, $ne: null, $ne: '' } 
    });
    const draftWithPdf = await Project.countDocuments({ 
      status: { $ne: 'PUBLISHED', $ne: 'published' }, 
      audit_pdf: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log('📊 Project Statistics:\n');
    console.log(`Total projects: ${total}`);
    console.log(`With audit_pdf: ${withPdf}`);
    console.log(`Published: ${published}`);
    console.log(`Published + PDF: ${publishedWithPdf}`);
    console.log(`Draft + PDF: ${draftWithPdf}`);
    
    console.log('\n💡 Action needed:');
    console.log(`   ${draftWithPdf} projects have PDFs but are still draft`);
    console.log(`   These should be auto-published to match the live site`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

countProjects();
