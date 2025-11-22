/**
 * Test PDF Generation Service
 * Generates a test PDF from a MongoDB project
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const AuditPDFGenerator = require('./src/services/pdfGeneratorService');
const fs = require('fs');

async function testPDFGeneration() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Test with a project that has good data
    const testSlug = 'mars-coin'; // One of our newly found Solana projects
    console.log(`Testing PDF generation for: ${testSlug}\n`);
    
    const project = await db.collection('projects').findOne({ 
      slug: testSlug,
      published: true 
    });
    
    if (!project) {
      console.error(`✗ Project "${testSlug}" not found`);
      return;
    }
    
    console.log('Project Details:');
    console.log(`  Name: ${project.name}`);
    console.log(`  Symbol: ${project.symbol || 'N/A'}`);
    console.log(`  Platform: ${project.platform}`);
    console.log(`  Contract: ${project.contract_info?.contract_address || 'N/A'}`);
    console.log(`  Audit Date: ${project.audit_date || 'N/A'}`);
    console.log('');
    
    console.log('Generating PDF...');
    const generator = new AuditPDFGenerator(project);
    const pdfBuffer = await generator.generate();
    
    const filename = `test-${testSlug}-audit-report.pdf`;
    fs.writeFileSync(filename, pdfBuffer);
    
    console.log(`✓ PDF generated successfully!`);
    console.log(`  File: ${filename}`);
    console.log(`  Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log('');
    
    // Test a few more projects with different characteristics
    const testCases = [
      { slug: 'pecunity', desc: 'Full featured project with findings' },
      { slug: 'anonymous-dao', desc: 'BSC project' },
      { slug: 'wrekt', desc: 'Another Solana project' }
    ];
    
    console.log('Testing additional projects...\n');
    
    for (const testCase of testCases) {
      try {
        const proj = await db.collection('projects').findOne({ 
          slug: testCase.slug,
          published: true 
        });
        
        if (!proj) {
          console.log(`⚠ ${testCase.slug}: Not found`);
          continue;
        }
        
        const gen = new AuditPDFGenerator(proj);
        const pdf = await gen.generate();
        const fname = `test-${testCase.slug}-audit-report.pdf`;
        fs.writeFileSync(fname, pdf);
        
        console.log(`✓ ${testCase.slug}: ${(pdf.length / 1024).toFixed(2)} KB - ${testCase.desc}`);
      } catch (error) {
        console.log(`✗ ${testCase.slug}: ${error.message}`);
      }
    }
    
    console.log('\n✅ PDF Generation Test Complete!');
    console.log('\nGenerated files:');
    const pdfFiles = fs.readdirSync('.').filter(f => f.startsWith('test-') && f.endsWith('.pdf'));
    pdfFiles.forEach(f => {
      const stats = fs.statSync(f);
      console.log(`  - ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testPDFGeneration();
