require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function analyzeProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all projects
    const projects = await Project.find({});
    
    // Analyze status field
    const statusCounts = {};
    const withPdf = [];
    const withoutPdf = [];
    const withAddress = [];
    const withoutAddress = [];
    const publishedWithPdf = [];
    const draftWithPdf = [];
    
    projects.forEach(project => {
      const status = project.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (project.audit_pdf) {
        withPdf.push(project);
        if (status.toLowerCase() === 'published') {
          publishedWithPdf.push(project);
        } else {
          draftWithPdf.push(project);
        }
      } else {
        withoutPdf.push(project);
      }
      
      if (project.address) {
        withAddress.push(project);
      } else {
        withoutAddress.push(project);
      }
    });
    
    console.log('📊 Status Distribution:');
    Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log('\n📄 PDF Status:');
    console.log(`   With PDF: ${withPdf.length}`);
    console.log(`   Without PDF: ${withoutPdf.length}`);
    
    console.log('\n📝 Published Projects with PDF:');
    console.log(`   Published + PDF: ${publishedWithPdf.length}`);
    console.log(`   Draft + PDF: ${draftWithPdf.length}`);
    
    console.log('\n🔗 Contract Address Status:');
    console.log(`   With address: ${withAddress.length}`);
    console.log(`   Without address: ${withoutAddress.length}`);
    
    console.log('\n🎯 Recommended Action:');
    console.log(`   Projects with PDF but draft status: ${draftWithPdf.length}`);
    console.log(`   These could be auto-published since they have audit PDFs`);
    
    // Show sample draft projects with PDFs
    console.log('\n📋 Sample draft projects with PDFs (first 20):');
    draftWithPdf.slice(0, 20).forEach(p => {
      console.log(`   - ${p.name} (${p.slug})`);
      console.log(`     PDF: ${p.audit_pdf ? 'Yes' : 'No'}`);
      console.log(`     Address: ${p.address || 'N/A'}`);
    });
    
    console.log('\n💡 Suggestion:');
    console.log('   Update all projects with audit_pdf to status="PUBLISHED"');
    console.log('   This would give us ~770 published projects instead of 184');
    
    await mongoose.connection.close();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeProjects();
