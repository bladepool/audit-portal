const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const DATA_JSON_PATH = path.join(CUSTOM_CONTRACT_PATH, 'data.json');
const AUDITS_TEMPORAL_PATH = path.join(CUSTOM_CONTRACT_PATH, 'Audits_Temporal');
const EXTRACTED_DATA_PATH = path.join(__dirname, 'extracted-projects-from-pdfs.json');

/**
 * Strategy: For each PDF, temporarily replace data.json with a template,
 * then use pdf.js to regenerate and extract embedded data from the PDF
 * 
 * Alternative: Parse PDF text directly to extract key fields
 */
async function extractFullDataFromPDFs() {
  console.log('=== Extracting Full Data from PDFs ===\n');
  
  // Load the basic extracted data
  const extractedData = JSON.parse(fs.readFileSync(EXTRACTED_DATA_PATH, 'utf8'));
  const projects = extractedData.projects;
  
  console.log(`📊 Projects to enrich: ${projects.length}`);
  console.log(`\n💡 Strategy: Check if PDFs were generated from data.json files`);
  console.log('   If yes: Look for backup .json files matching each project\n');
  
  // Check for historical JSON files
  const allFiles = fs.readdirSync(CUSTOM_CONTRACT_PATH);
  const jsonBackups = allFiles.filter(f => 
    f.endsWith('.json') && 
    !['package.json', 'package-lock.json', 'data.json'].includes(f)
  );
  
  console.log(`📁 Found ${jsonBackups.length} backup JSON files:`);
  jsonBackups.forEach(f => console.log(`   - ${f}`));
  
  // Check if there's a pattern or archive folder
  const customerDataPath = path.join(CUSTOM_CONTRACT_PATH, 'Customers Data');
  const hasCustomerData = fs.existsSync(customerDataPath);
  
  if (hasCustomerData) {
    console.log(`\n✅ Found "Customers Data" folder!`);
    const customerFiles = fs.readdirSync(customerDataPath);
    console.log(`   Files: ${customerFiles.length}`);
    
    // Sample first few
    console.log(`\n   Sample files:`);
    customerFiles.slice(0, 10).forEach(f => console.log(`   - ${f}`));
  }
  
  // Look for any data archive or historical data
  const possibleArchives = [
    'Customers Data',
    'Customer Data',
    'Archive',
    'Backups',
    'Historical',
    'Data'
  ];
  
  console.log(`\n🔍 Searching for data archives...`);
  const foundArchives = possibleArchives.filter(dir => 
    fs.existsSync(path.join(CUSTOM_CONTRACT_PATH, dir))
  );
  
  if (foundArchives.length > 0) {
    console.log(`\n✅ Found archives:`);
    foundArchives.forEach(dir => {
      const archivePath = path.join(CUSTOM_CONTRACT_PATH, dir);
      const files = fs.readdirSync(archivePath);
      console.log(`   📂 ${dir}: ${files.length} files`);
      
      // Check for JSON files
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      if (jsonFiles.length > 0) {
        console.log(`      JSON files: ${jsonFiles.length}`);
        console.log(`      Sample: ${jsonFiles.slice(0, 3).join(', ')}`);
      }
    });
  } else {
    console.log(`   ❌ No data archives found`);
  }
  
  // Alternative: Extract text from PDFs using pdf-parse
  console.log(`\n💡 Alternative Approach: Extract data directly from PDF text`);
  console.log(`   This would require installing: npm install pdf-parse`);
  
  // Check if pdf-parse is available
  let pdfParseAvailable = false;
  try {
    require.resolve('pdf-parse');
    pdfParseAvailable = true;
    console.log(`   ✅ pdf-parse is installed`);
  } catch {
    console.log(`   ⚠️  pdf-parse not installed`);
    console.log(`   Run: npm install pdf-parse --save-dev`);
  }
  
  if (pdfParseAvailable) {
    console.log(`\n🚀 Can extract data from PDFs!`);
    console.log(`   This will parse PDF text and extract:`);
    console.log(`   - Contract Address`);
    console.log(`   - Platform/Blockchain`);
    console.log(`   - Social Links (Website, Telegram, Twitter)`);
    console.log(`   - Token Info (Decimals, Supply)`);
    console.log(`   - Security Flags (Honeypot, Mint, etc.)`);
    console.log(`   - Findings (Critical, High, Medium, Low)`);
  }
  
  // Recommendations
  console.log(`\n📋 Recommendations:`);
  console.log(`\n1. CHECK CUSTOMERS DATA FOLDER`);
  console.log(`   ✓ If it contains JSON files for each project → Extract from there`);
  console.log(`   ✓ Much faster and more accurate than PDF parsing`);
  
  console.log(`\n2. INSTALL PDF PARSER`);
  console.log(`   npm install pdf-parse --save-dev`);
  console.log(`   Then create a script to extract text from PDFs`);
  
  console.log(`\n3. HYBRID APPROACH`);
  console.log(`   ✓ Use Customer Data JSON files where available`);
  console.log(`   ✓ Parse PDFs for missing projects`);
  console.log(`   ✓ Manual review for edge cases`);
  
  // Save analysis
  const analysis = {
    total_projects: projects.length,
    backup_json_files: jsonBackups.length,
    customer_data_folder: hasCustomerData,
    found_archives: foundArchives,
    pdf_parse_available: pdfParseAvailable,
    recommendations: [
      'Check Customers Data folder for JSON files',
      'Install pdf-parse for direct PDF text extraction',
      'Use hybrid approach: JSON files + PDF parsing + manual review'
    ],
    next_steps: [
      'Explore Customers Data folder structure',
      'Match project names to available JSON files',
      'Extract data from matched JSON files',
      'Parse PDFs for remaining projects',
      'Import enriched data to MongoDB'
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'data-extraction-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );
  
  console.log(`\n✅ Analysis saved to: data-extraction-analysis.json`);
}

if (require.main === module) {
  extractFullDataFromPDFs().catch(console.error);
}

module.exports = { extractFullDataFromPDFs };
