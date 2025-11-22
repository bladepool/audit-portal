const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const DATA_JSON_PATH = path.join(CUSTOM_CONTRACT_PATH, 'data.json');
const AUDITS_TEMPORAL_PATH = path.join(CUSTOM_CONTRACT_PATH, 'Audits_Temporal');

async function analyzeJsonData() {
  console.log('=== Analyzing data.json for Missing Projects ===\n');
  
  // Read data.json
  const jsonData = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
  console.log(`✅ Loaded data.json`);
  console.log(`   Project: ${jsonData.name} (${jsonData.symbol})`);
  console.log(`   Platform: ${jsonData.Platform}`);
  console.log(`   Address: ${jsonData.address}`);
  console.log(`   Audit Edition: ${jsonData.auditEdition}`);
  
  // List all PDFs
  const pdfs = fs.readdirSync(AUDITS_TEMPORAL_PATH)
    .filter(f => f.endsWith('.pdf'))
    .sort();
  
  console.log(`\n📁 Found ${pdfs.length} PDFs in Audits_Temporal`);
  
  // Extract unique project names from PDFs
  const projectNames = new Set();
  pdfs.forEach(pdf => {
    // Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
    const parts = pdf.split('_');
    if (parts.length >= 3) {
      // Remove date and CFGNINJA prefix
      const nameStartIndex = 2;
      const nameParts = [];
      
      for (let i = nameStartIndex; i < parts.length; i++) {
        const part = parts[i];
        // Stop before SYMBOL (usually all caps) or "Audit.pdf"
        if (part === 'Audit.pdf' || (i === parts.length - 2 && parts[i + 1] === 'Audit.pdf')) {
          break;
        }
        nameParts.push(part);
      }
      
      const projectName = nameParts.join(' ').trim();
      if (projectName) {
        projectNames.add(projectName);
      }
    }
  });
  
  console.log(`\n📊 Unique projects in PDFs: ${projectNames.size}`);
  console.log('\nSample project names:');
  Array.from(projectNames).slice(0, 20).forEach(name => {
    console.log(`   - ${name}`);
  });
  
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('auditportal');
  
  // Get all projects from database
  const dbProjects = await db.collection('projects').find({}).toArray();
  console.log(`\n💾 Projects in MongoDB: ${dbProjects.length}`);
  console.log(`   Published: ${dbProjects.filter(p => p.published).length}`);
  console.log(`   Unpublished: ${dbProjects.filter(p => !p.published).length}`);
  
  // Normalize names for comparison
  const normalizeProjectName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const dbProjectNamesNormalized = new Set(
    dbProjects.map(p => normalizeProjectName(p.name))
  );
  
  // Find projects in PDFs but not in database
  const missingProjects = [];
  projectNames.forEach(pdfName => {
    const normalized = normalizeProjectName(pdfName);
    if (!dbProjectNamesNormalized.has(normalized)) {
      missingProjects.push(pdfName);
    }
  });
  
  console.log(`\n❌ Projects in PDFs but NOT in MongoDB: ${missingProjects.length}`);
  if (missingProjects.length > 0) {
    console.log('\nMissing projects (first 50):');
    missingProjects.slice(0, 50).forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });
  }
  
  // Save detailed analysis
  const analysis = {
    summary: {
      total_pdfs: pdfs.length,
      unique_projects_in_pdfs: projectNames.size,
      projects_in_database: dbProjects.length,
      published_in_database: dbProjects.filter(p => p.published).length,
      missing_from_database: missingProjects.length,
      coverage_percentage: ((dbProjects.length / projectNames.size) * 100).toFixed(2) + '%'
    },
    current_data_json: {
      name: jsonData.name,
      symbol: jsonData.symbol,
      address: jsonData.address,
      platform: jsonData.Platform,
      decimals: jsonData.decimals,
      supply: jsonData.supply,
      description: jsonData.description,
      audit_edition: jsonData.auditEdition,
      owner: jsonData.owner,
      owner_address: jsonData.ownerAddress,
      compiler: jsonData.compiler,
      language: jsonData.Language,
      contract_name: jsonData.ContractName,
      website: jsonData.Url,
      telegram: jsonData.Telegram,
      twitter: jsonData.Twitter,
      github: jsonData.GitHub,
      kyc: jsonData.isKYC === 'Yes',
      kyc_url: jsonData.KYCURL,
      buy_tax: jsonData.BuyTax,
      sell_tax: jsonData.SaleTax,
      honeypot: jsonData.HoneyPot,
      mint: jsonData.MintCheck,
      blacklist: jsonData.Blacklist,
      whitelist: jsonData.Whitelist,
      findings: {
        critical: {
          found: parseInt(jsonData.CriticalFound) || 0,
          pending: parseInt(jsonData.CriticalPending) || 0,
          resolved: parseInt(jsonData.CriticalRes) || 0
        },
        high: {
          found: parseInt(jsonData.HighFound) || 0,
          pending: parseInt(jsonData.HighPending) || 0,
          resolved: parseInt(jsonData.HighRes) || 0
        },
        medium: {
          found: parseInt(jsonData.MediumFound) || 0,
          pending: parseInt(jsonData.MediumPending) || 0,
          resolved: parseInt(jsonData.MediumRes) || 0
        },
        low: {
          found: parseInt(jsonData.LowFound) || 0,
          pending: parseInt(jsonData.LowPending) || 0,
          resolved: parseInt(jsonData.LowRes) || 0
        },
        informational: {
          found: parseInt(jsonData.InfoFound) || 0,
          pending: parseInt(jsonData.InfoPending) || 0,
          resolved: parseInt(jsonData.InfoRes) || 0
        }
      },
      scores: {
        security: parseInt(jsonData.SecurityScore) || 0,
        auditor: parseInt(jsonData.AuditorScore) || 0,
        owner: parseInt(jsonData.ownerScore) || 0,
        social: parseInt(jsonData.SocialScore) || 0
      },
      audit_status: jsonData.AuditStatus
    },
    all_pdf_projects: Array.from(projectNames).sort(),
    missing_from_database: missingProjects.sort(),
    sample_pdfs: pdfs.slice(0, 20)
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'json-data-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );
  
  console.log('\n✅ Analysis saved to: json-data-analysis.json');
  
  // Key data fields available in data.json
  console.log('\n📋 Key Data Fields Available in data.json:');
  console.log('   ✅ Basic: name, symbol, decimals, supply, description');
  console.log('   ✅ Contract: address, platform, compiler, language, owner');
  console.log('   ✅ Social: website, telegram, twitter, github');
  console.log('   ✅ Security: honeypot, mint, blacklist, whitelist, taxes');
  console.log('   ✅ KYC: status, URL, score');
  console.log('   ✅ Findings: all severities with counts (found/pending/resolved)');
  console.log('   ✅ Scores: security, auditor, owner, social');
  console.log('   ✅ CFG Findings: 26 custom test cases with details');
  console.log('   ✅ Audit metadata: edition, dates, status');
  
  console.log('\n💡 Next Steps:');
  console.log('   1. The data.json file contains the LATEST/CURRENT audit data');
  console.log('   2. There are 960 PDFs representing historical audits');
  console.log('   3. Need to extract data from EACH PDF to populate database');
  console.log('   4. Can potentially use PDF text extraction to get project details');
  console.log('   5. Alternative: Check if there are historical data.json backups');
  
  await client.close();
}

analyzeJsonData().catch(console.error);
