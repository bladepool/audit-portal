const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const CUSTOMERS_DATA_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Customers Data';
const EXTRACTED_DATA_PATH = path.join(__dirname, 'extracted-projects-from-pdfs.json');

/**
 * Match project names from PDFs with Customer Data folders
 * Extract data.json from matched folders
 */
async function extractFromCustomerData() {
  console.log('=== Extracting Data from Customers Data Folders ===\n');
  
  // Load the basic extracted data from PDFs
  const extractedData = JSON.parse(fs.readFileSync(EXTRACTED_DATA_PATH, 'utf8'));
  const pdfProjects = extractedData.projects;
  
  console.log(`📊 PDF Projects: ${pdfProjects.length}`);
  
  // Get all customer data folders
  const customerFolders = fs.readdirSync(CUSTOMERS_DATA_PATH)
    .filter(f => {
      const fullPath = path.join(CUSTOMERS_DATA_PATH, f);
      return fs.statSync(fullPath).isDirectory();
    });
  
  console.log(`📁 Customer Data Folders: ${customerFolders.length}\n`);
  
  // Normalize names for matching
  const normalizeProjectName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };
  
  // Create mapping of normalized names to customer folders
  const customerFolderMap = new Map();
  customerFolders.forEach(folder => {
    const normalized = normalizeProjectName(folder);
    customerFolderMap.set(normalized, folder);
  });
  
  // Check each customer folder for data.json
  const foldersWithData = [];
  customerFolders.forEach(folder => {
    const dataJsonPath = path.join(CUSTOMERS_DATA_PATH, folder, 'data.json');
    if (fs.existsSync(dataJsonPath)) {
      foldersWithData.push(folder);
    }
  });
  
  console.log(`✅ Folders with data.json: ${foldersWithData.length}`);
  console.log(`\nSample folders with data.json:`);
  foldersWithData.slice(0, 10).forEach(f => console.log(`   - ${f}`));
  
  // Match PDF projects with customer data folders
  const matched = [];
  const unmatched = [];
  
  pdfProjects.forEach(project => {
    const normalizedProjectName = normalizeProjectName(project.name);
    
    if (customerFolderMap.has(normalizedProjectName)) {
      const folderName = customerFolderMap.get(normalizedProjectName);
      const dataJsonPath = path.join(CUSTOMERS_DATA_PATH, folderName, 'data.json');
      
      matched.push({
        project: project,
        customerFolder: folderName,
        hasDataJson: fs.existsSync(dataJsonPath),
        dataJsonPath: dataJsonPath
      });
    } else {
      unmatched.push(project);
    }
  });
  
  console.log(`\n📊 Matching Results:`);
  console.log(`   ✅ Matched: ${matched.length}`);
  console.log(`   ❌ Unmatched: ${unmatched.length}`);
  console.log(`   📄 With data.json: ${matched.filter(m => m.hasDataJson).length}`);
  
  // Extract full data from matched projects
  const enrichedProjects = [];
  const extractionErrors = [];
  
  console.log(`\n🔄 Extracting data from matched projects...\n`);
  
  for (const match of matched) {
    if (!match.hasDataJson) continue;
    
    try {
      const jsonData = JSON.parse(fs.readFileSync(match.dataJsonPath, 'utf8'));
      
      // Extract comprehensive data
      const enriched = {
        ...match.project,
        
        // Update from JSON
        name: jsonData.name || match.project.name,
        symbol: jsonData.symbol || match.project.symbol,
        decimals: parseInt(jsonData.decimals) || 18,
        supply: jsonData.supply || '',
        description: jsonData.description || match.project.description,
        
        platform: jsonData.Platform || 'Binance Smart Chain',
        
        contract: {
          address: jsonData.address || '',
          language: jsonData.Language || 'Solidity',
          name: jsonData.ContractName || jsonData.name,
          owner: jsonData.owner === 'Yes' ? jsonData.ownerAddress : '',
          deployer: '',
          created: jsonData.DateCreated || '',
          verified: jsonData.isTestNetAvailable !== 'Yes',
          compiler: jsonData.compiler || '',
          license: jsonData.LicenseType || 'No License (None)'
        },
        
        overview: {
          honeypot: jsonData.HoneyPot === 'Detected',
          hidden_owner: jsonData.HiddenOwner === 'Detected',
          mint: jsonData.MintCheck !== 'Pass',
          blacklist: jsonData.Blacklist === 'Detected',
          whitelist: jsonData.Whitelist === 'Detected',
          proxy_check: jsonData.ProxyCheck === 'Detected',
          buy_tax: parseFloat(jsonData.BuyTax) || 0,
          sell_tax: parseFloat(jsonData.SaleTax) || 0,
          max_transaction: jsonData.MaxTxCheck !== 'Pass',
          can_take_ownership: jsonData.CanTakeOwnership === 'Detected',
          external_call: jsonData.ExternalCall === 'Detected',
          self_destruct: jsonData.SelfDestruct === 'Detected',
          anti_bot: jsonData.AntiBot === 'Detected',
          enable_trading: jsonData.EnableTradeCheck === 'true',
          cannot_buy: jsonData.CannotBuy !== 'Pass',
          cannot_sell: jsonData.CannotSale !== 'Pass',
          modify_tax: jsonData.EditTax !== 'No',
          pause_transfer: jsonData.TransferPause === 'Detected',
          others: jsonData.Other !== '',
          pause_trade: jsonData.PauseTradeCheck === 'Detected',
          max_wallet: false,
          trading_cooldown: jsonData.CoolDown === 'Detected',
          anti_whale: jsonData.AntiWhale === 'Detected',
          enable_trade_text: jsonData.EnableTradeText || ''
        },
        
        socials: {
          website: jsonData.Url || '',
          telegram: jsonData.Telegram || '',
          twitter: jsonData.Twitter || '',
          github: jsonData.GitHub || '',
          facebook: jsonData.Facebook || '',
          instagram: jsonData.Instagram || '',
          reddit: jsonData.Reddit || '',
          cmc: jsonData.CMC || '',
          cg: jsonData.CG || ''
        },
        
        critical: {
          found: parseInt(jsonData.CriticalFound) || 0,
          pending: parseInt(jsonData.CriticalPending) || 0,
          resolved: parseInt(jsonData.CriticalRes) || 0
        },
        major: {
          found: parseInt(jsonData.HighFound) || 0,
          pending: parseInt(jsonData.HighPending) || 0,
          resolved: parseInt(jsonData.HighRes) || 0
        },
        medium: {
          found: parseInt(jsonData.MediumFound) || 0,
          pending: parseInt(jsonData.MediumPending) || 0,
          resolved: parseInt(jsonData.MediumRes) || 0
        },
        minor: {
          found: parseInt(jsonData.LowFound) || 0,
          pending: parseInt(jsonData.LowPending) || 0,
          resolved: parseInt(jsonData.LowRes) || 0
        },
        informational: {
          found: parseInt(jsonData.InfoFound) || 0,
          pending: parseInt(jsonData.InfoPending) || 0,
          resolved: parseInt(jsonData.InfoRes) || 0
        },
        
        scores: {
          security: parseInt(jsonData.SecurityScore) || 0,
          auditor: parseInt(jsonData.AuditorScore) || 0,
          owner: parseInt(jsonData.ownerScore) || 0,
          social: parseInt(jsonData.SocialScore) || 0
        },
        
        audit: {
          confidence: jsonData.ConfidenceLevel || jsonData.auditConfidence || 'Medium',
          score: parseInt(jsonData.AuditScore) || 0,
          status: jsonData.AuditStatus || '',
          edition: jsonData.auditEdition || 'Standard',
          request_date: jsonData.audit_request || match.project.first_audit,
          release_date: jsonData.audit_release || match.project.latest_audit,
          preview_date: jsonData.audit_preview || match.project.first_audit
        },
        
        kyc: {
          enabled: jsonData.isKYC === 'Yes',
          url: jsonData.KYCURL || '',
          score: parseInt(jsonData.KYCScore) || 0,
          notes: jsonData.KYCScoreNotes || '',
          vendor: jsonData.KYCVendor || ''
        },
        
        admin_notes: {
          swc: jsonData.AuditNotesSWC || '',
          tax: jsonData.AuditNotesTax || '',
          kyc: jsonData.AuditNotesKYC || '',
          social: jsonData.AuditorNotesSocial || ''
        },
        
        metadata: {
          ...match.project.metadata,
          customer_folder: match.customerFolder,
          data_extracted_from: 'customer_data_json'
        }
      };
      
      enrichedProjects.push(enriched);
      
      if (enrichedProjects.length % 50 === 0) {
        console.log(`   Processed ${enrichedProjects.length}/${matched.filter(m => m.hasDataJson).length}...`);
      }
      
    } catch (error) {
      extractionErrors.push({
        project: match.project.name,
        folder: match.customerFolder,
        error: error.message
      });
    }
  }
  
  console.log(`\n✅ Extraction complete!`);
  console.log(`   Enriched: ${enrichedProjects.length}`);
  console.log(`   Errors: ${extractionErrors.length}`);
  
  // Save enriched data
  const outputData = {
    summary: {
      total_pdf_projects: pdfProjects.length,
      matched_with_customer_data: matched.length,
      with_data_json: matched.filter(m => m.hasDataJson).length,
      successfully_enriched: enrichedProjects.length,
      extraction_errors: extractionErrors.length,
      unmatched: unmatched.length
    },
    enriched_projects: enrichedProjects,
    unmatched_projects: unmatched.map(p => ({
      name: p.name,
      symbol: p.symbol,
      latest_pdf: p.latest_pdf
    })),
    extraction_errors: extractionErrors
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'enriched-projects.json'),
    JSON.stringify(outputData, null, 2)
  );
  
  console.log(`\n📄 Saved to: enriched-projects.json`);
  
  // Show sample enriched project
  if (enrichedProjects.length > 0) {
    const sample = enrichedProjects[0];
    console.log(`\n📋 Sample Enriched Project: ${sample.name}`);
    console.log(`   Contract: ${sample.contract.address || 'N/A'}`);
    console.log(`   Website: ${sample.socials.website || 'N/A'}`);
    console.log(`   Telegram: ${sample.socials.telegram || 'N/A'}`);
    console.log(`   Twitter: ${sample.socials.twitter || 'N/A'}`);
    console.log(`   Findings: C:${sample.critical.found} H:${sample.major.found} M:${sample.medium.found} L:${sample.minor.found}`);
    console.log(`   Security Score: ${sample.scores.security}`);
  }
  
  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Review enriched-projects.json`);
  console.log(`   2. Run import script to add to MongoDB`);
  console.log(`   3. Handle ${unmatched.length} unmatched projects separately`);
  
  return outputData;
}

if (require.main === module) {
  extractFromCustomerData().catch(console.error);
}

module.exports = { extractFromCustomerData };
