require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function syncAuditPdfFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count existing
    const withAuditPdfUrl = await Project.countDocuments({ 
      auditPdfUrl: { $exists: true, $ne: null, $ne: '' } 
    });
    const withAuditPdf = await Project.countDocuments({ 
      audit_pdf: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`📊 Before sync:`);
    console.log(`   Projects with auditPdfUrl: ${withAuditPdfUrl}`);
    console.log(`   Projects with audit_pdf: ${withAuditPdf}\n`);
    
    // Update all projects that have auditPdfUrl but not audit_pdf
    const result = await Project.updateMany(
      {
        auditPdfUrl: { $exists: true, $ne: null, $ne: '' },
        $or: [
          { audit_pdf: { $exists: false } },
          { audit_pdf: null },
          { audit_pdf: '' }
        ]
      },
      [{
        $set: { audit_pdf: '$auditPdfUrl' }
      }]
    );
    
    console.log(`✅ Updated ${result.modifiedCount} projects\n`);
    
    // Count after
    const afterAuditPdf = await Project.countDocuments({ 
      audit_pdf: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`📊 After sync:`);
    console.log(`   Projects with audit_pdf: ${afterAuditPdf}\n`);
    
    // Now update status to PUBLISHED for all projects with audit_pdf
    console.log('🚀 Auto-publishing projects with audit PDFs...\n');
    
    const publishResult = await Project.updateMany(
      {
        audit_pdf: { $exists: true, $ne: null, $ne: '' },
        status: { $ne: 'PUBLISHED' }
      },
      {
        $set: { status: 'PUBLISHED' }
      }
    );
    
    console.log(`✅ Published ${publishResult.modifiedCount} projects\n`);
    
    // Final count
    const finalPublished = await Project.countDocuments({ 
      status: 'PUBLISHED' 
    });
    const finalPublishedWithPdf = await Project.countDocuments({ 
      status: 'PUBLISHED',
      audit_pdf: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log('='.repeat(60));
    console.log('📊 Final Statistics:');
    console.log(`   Total projects: ${await Project.countDocuments()}`);
    console.log(`   Published: ${finalPublished}`);
    console.log(`   Published with PDF: ${finalPublishedWithPdf}`);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncAuditPdfFields();
