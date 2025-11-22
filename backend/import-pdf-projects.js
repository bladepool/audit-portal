const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const EXTRACTED_DATA_PATH = path.join(__dirname, 'extracted-projects-from-pdfs.json');

async function importProjectsFromPDFs() {
  console.log('=== Importing Projects from PDF Data ===\n');
  
  // Load extracted data
  const extractedData = JSON.parse(fs.readFileSync(EXTRACTED_DATA_PATH, 'utf8'));
  const projects = extractedData.projects;
  
  console.log(`📊 Total projects to process: ${projects.length}`);
  
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
  
  console.log(`💾 Existing projects in database: ${existingProjects.length}\n`);
  
  // Prepare projects to import
  const toImport = [];
  const skipped = [];
  
  projects.forEach(project => {
    const normalizedName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (existingNames.has(normalizedName)) {
      skipped.push(project);
    } else {
      toImport.push({
        name: project.name,
        symbol: project.symbol,
        slug: project.slug,
        decimals: project.decimals || 18,
        supply: '',
        description: project.description || `Smart contract audit for ${project.name}`,
        logo: '',
        
        platform: project.platform || 'Binance Smart Chain',
        published: false,
        
        contract: {
          address: project.contract?.address || '',
          language: project.contract?.language || 'Solidity',
          name: project.name,
          owner: '',
          deployer: '',
          created: '',
          verified: project.contract?.verified !== false,
          compiler: '',
          license: 'No License (None)'
        },
        
        overview: {
          honeypot: project.overview?.honeypot || false,
          hidden_owner: project.overview?.hidden_owner || false,
          mint: project.overview?.mint || false,
          blacklist: project.overview?.blacklist || false,
          whitelist: project.overview?.whitelist || false,
          proxy_check: project.overview?.proxy_check || false,
          buy_tax: 0,
          sell_tax: 0,
          max_transaction: false,
          can_take_ownership: false,
          external_call: false,
          self_destruct: false,
          anti_bot: false,
          enable_trading: false,
          cannot_buy: false,
          cannot_sell: false,
          modify_tax: false,
          pause_transfer: false,
          others: false,
          pause_trade: false,
          max_wallet: false,
          trading_cooldown: false,
          anti_whale: false
        },
        
        socials: {
          website: '',
          telegram: '',
          twitter: '',
          github: '',
          facebook: '',
          instagram: '',
          reddit: '',
          cmc: '',
          cg: ''
        },
        
        critical: project.critical || { found: 0, pending: 0, resolved: 0 },
        major: project.major || { found: 0, pending: 0, resolved: 0 },
        medium: project.medium || { found: 0, pending: 0, resolved: 0 },
        minor: project.minor || { found: 0, pending: 0, resolved: 0 },
        informational: project.informational || { found: 0, pending: 0, resolved: 0 },
        
        cfg_findings: [],
        
        scores: {
          security: 0,
          auditor: 0,
          owner: 0,
          social: 0
        },
        
        audit: {
          confidence: 'Medium',
          score: 0,
          status: '',
          edition: 'Standard',
          request_date: project.first_audit,
          release_date: project.latest_audit,
          preview_date: project.first_audit
        },
        
        kyc: {
          enabled: false,
          url: '',
          score: 0,
          notes: '',
          vendor: ''
        },
        
        pdf: {
          generated: true,
          path: `Audits_Temporal/${project.latest_pdf}`,
          size: 0,
          generated_at: new Date(project.latest_audit),
          url: '',
          github_hosted: false
        },
        
        admin_notes: {
          swc: '',
          tax: '',
          kyc: '',
          social: ''
        },
        
        metadata: {
          audit_versions: project.audit_count,
          first_audit: project.first_audit,
          latest_audit: project.latest_audit,
          all_pdfs: project.all_pdfs,
          imported_from: 'PDF extraction',
          imported_at: new Date()
        },
        
        created_at: new Date(project.first_audit),
        updated_at: new Date(project.latest_audit)
      });
    }
  });
  
  console.log(`✅ Projects to import: ${toImport.length}`);
  console.log(`⏭️  Projects skipped (already exist): ${skipped.length}`);
  
  if (toImport.length === 0) {
    console.log('\n⚠️  No new projects to import');
    await client.close();
    return;
  }
  
  // Confirmation
  console.log(`\n❓ Import ${toImport.length} new projects to MongoDB?`);
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
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
      path.join(__dirname, 'import-errors.json'),
      JSON.stringify(errors, null, 2)
    );
    console.log('   Error details saved to: import-errors.json');
  }
  
  // Summary
  const finalCount = await collection.countDocuments({});
  console.log(`\n📊 Database Summary:`);
  console.log(`   Total projects: ${finalCount}`);
  console.log(`   Published: ${await collection.countDocuments({ published: true })}`);
  console.log(`   Unpublished: ${await collection.countDocuments({ published: false })}`);
  console.log(`   With PDFs: ${await collection.countDocuments({ 'pdf.generated': true })}`);
  
  // Save import summary
  const summary = {
    import_date: new Date().toISOString(),
    projects_processed: projects.length,
    projects_imported: imported,
    projects_skipped: skipped.length,
    errors: errors.length,
    database_total: finalCount,
    sample_imported: toImport.slice(0, 10).map(p => ({ name: p.name, symbol: p.symbol }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'import-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n📄 Import summary saved to: import-summary.json`);
  
  await client.close();
}

if (require.main === module) {
  importProjectsFromPDFs().catch(console.error);
}

module.exports = { importProjectsFromPDFs };
