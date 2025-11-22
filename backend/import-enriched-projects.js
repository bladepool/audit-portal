const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const ENRICHED_DATA_PATH = path.join(__dirname, 'enriched-projects.json');

async function importEnrichedProjects() {
  console.log('=== Importing Enriched Projects to MongoDB ===\n');
  
  // Load enriched data
  const enrichedData = JSON.parse(fs.readFileSync(ENRICHED_DATA_PATH, 'utf8'));
  const projects = enrichedData.enriched_projects;
  
  console.log(`📊 Projects to import: ${projects.length}`);
  console.log(`   With contract addresses: ${projects.filter(p => p.contract.address).length}`);
  console.log(`   With social links: ${projects.filter(p => p.socials.website || p.socials.telegram || p.socials.twitter).length}`);
  console.log(`   With findings: ${projects.filter(p => p.critical.found + p.major.found + p.medium.found + p.minor.found > 0).length}\n`);
  
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('auditportal');
  const collection = db.collection('projects');
  
  // Get existing projects
  const existingProjects = await collection.find({}).toArray();
  const existingNames = new Set(
    existingProjects.map(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  const existingAddresses = new Set(
    existingProjects
      .filter(p => p.contract?.address)
      .map(p => p.contract.address.toLowerCase())
  );
  
  console.log(`💾 Existing projects in database: ${existingProjects.length}`);
  console.log(`   With addresses: ${existingAddresses.size}\n`);
  
  // Prepare projects to import
  const toImport = [];
  const toUpdate = [];
  const skipped = [];
  
  projects.forEach(project => {
    const normalizedName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedAddress = project.contract.address?.toLowerCase();
    
    // Check if project exists
    const existsByName = existingNames.has(normalizedName);
    const existsByAddress = normalizedAddress && existingAddresses.has(normalizedAddress);
    
    if (existsByName || existsByAddress) {
      // Project exists - could update if needed
      toUpdate.push(project);
    } else {
      // New project
      toImport.push({
        name: project.name,
        symbol: project.symbol,
        slug: project.slug,
        decimals: project.decimals,
        supply: project.supply,
        description: project.description,
        logo: '',
        
        platform: project.platform,
        published: false, // Start as unpublished for review
        
        contract: project.contract,
        overview: project.overview,
        socials: project.socials,
        
        critical: project.critical,
        major: project.major,
        medium: project.medium,
        minor: project.minor,
        informational: project.informational,
        
        cfg_findings: [],
        
        scores: project.scores,
        audit: project.audit,
        kyc: project.kyc,
        
        pdf: {
          generated: true,
          path: project.pdf?.path || `Audits_Temporal/${project.latest_pdf}`,
          size: 0,
          generated_at: new Date(project.latest_audit),
          url: '',
          github_hosted: false
        },
        
        admin_notes: project.admin_notes,
        
        metadata: {
          audit_versions: project.audit_count,
          first_audit: project.first_audit,
          latest_audit: project.latest_audit,
          all_pdfs: project.all_pdfs,
          customer_folder: project.metadata?.customer_folder,
          data_source: 'customer_data_json',
          imported_at: new Date()
        },
        
        created_at: new Date(project.first_audit),
        updated_at: new Date()
      });
    }
  });
  
  console.log(`✅ New projects to import: ${toImport.length}`);
  console.log(`🔄 Existing projects (could update): ${toUpdate.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}\n`);
  
  // Show statistics of what we're importing
  console.log(`📊 Import Statistics:`);
  console.log(`   Projects with contract addresses: ${toImport.filter(p => p.contract.address).length}`);
  console.log(`   Projects with websites: ${toImport.filter(p => p.socials.website).length}`);
  console.log(`   Projects with Telegram: ${toImport.filter(p => p.socials.telegram).length}`);
  console.log(`   Projects with Twitter: ${toImport.filter(p => p.socials.twitter).length}`);
  console.log(`   Projects with findings: ${toImport.filter(p => p.critical.found + p.major.found + p.medium.found + p.minor.found > 0).length}`);
  console.log(`   Average security score: ${(toImport.reduce((sum, p) => sum + p.scores.security, 0) / toImport.length).toFixed(1)}\n`);
  
  if (toImport.length === 0) {
    console.log('⚠️  No new projects to import');
    await client.close();
    return;
  }
  
  // Confirmation
  console.log(`❓ Import ${toImport.length} enriched projects to MongoDB?`);
  console.log('   These projects have FULL DATA including:');
  console.log('   ✓ Contract addresses');
  console.log('   ✓ Social links');
  console.log('   ✓ Security findings');
  console.log('   ✓ Audit scores');
  console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Import in batches
  const BATCH_SIZE = 50;
  let imported = 0;
  let errors = [];
  
  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE);
    
    try {
      const result = await collection.insertMany(batch, { ordered: false });
      imported += result.insertedCount;
      console.log(`   Imported ${imported}/${toImport.length}...`);
    } catch (error) {
      console.error(`   Error in batch ${i}-${i + BATCH_SIZE}:`, error.message);
      errors.push({ batch: i, error: error.message });
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, 'import-enriched-errors.json'),
      JSON.stringify(errors, null, 2)
    );
    console.log('   Error details saved to: import-enriched-errors.json');
  }
  
  // Final summary
  const finalCount = await collection.countDocuments({});
  const publishedCount = await collection.countDocuments({ published: true });
  const withAddressCount = await collection.countDocuments({ 'contract.address': { $ne: '', $exists: true } });
  const withPdfCount = await collection.countDocuments({ 'pdf.generated': true });
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   Total projects: ${finalCount}`);
  console.log(`   Published: ${publishedCount}`);
  console.log(`   Unpublished: ${finalCount - publishedCount}`);
  console.log(`   With contract addresses: ${withAddressCount}`);
  console.log(`   With PDFs: ${withPdfCount}`);
  
  // Sample imported projects
  console.log(`\n📋 Sample Imported Projects:`);
  const samples = toImport.slice(0, 5);
  samples.forEach((p, i) => {
    console.log(`\n   ${i + 1}. ${p.name} (${p.symbol})`);
    console.log(`      Contract: ${p.contract.address || 'N/A'}`);
    console.log(`      Website: ${p.socials.website || 'N/A'}`);
    console.log(`      Telegram: ${p.socials.telegram || 'N/A'}`);
    console.log(`      Findings: C:${p.critical.found} H:${p.major.found} M:${p.medium.found} L:${p.minor.found}`);
    console.log(`      Security: ${p.scores.security}/100`);
  });
  
  // Save summary
  const summary = {
    import_date: new Date().toISOString(),
    projects_imported: imported,
    projects_existed: toUpdate.length,
    errors: errors.length,
    database_total: finalCount,
    database_published: publishedCount,
    database_with_addresses: withAddressCount,
    database_with_pdfs: withPdfCount,
    data_quality: {
      with_addresses: toImport.filter(p => p.contract.address).length,
      with_websites: toImport.filter(p => p.socials.website).length,
      with_telegram: toImport.filter(p => p.socials.telegram).length,
      with_twitter: toImport.filter(p => p.socials.twitter).length,
      with_findings: toImport.filter(p => p.critical.found + p.major.found + p.medium.found + p.minor.found > 0).length,
      avg_security_score: (toImport.reduce((sum, p) => sum + p.scores.security, 0) / toImport.length).toFixed(1)
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'import-enriched-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n📄 Import summary saved to: import-enriched-summary.json`);
  
  console.log(`\n🎉 Success! Added ${imported} high-quality projects with full data!`);
  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Review imported projects in admin panel`);
  console.log(`   2. Generate PDFs for these ${imported} projects`);
  console.log(`   3. Upload PDFs to GitHub`);
  console.log(`   4. Set published=true when ready`);
  console.log(`   5. Work on remaining ${enrichedData.summary.unmatched} unmatched projects`);
  
  await client.close();
}

if (require.main === module) {
  importEnrichedProjects().catch(console.error);
}

module.exports = { importEnrichedProjects };
