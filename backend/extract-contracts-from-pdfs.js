require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('./src/models/Project');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (err) {
  console.log('⚠️  pdf-parse not installed. Install with: npm install pdf-parse');
  process.exit(1);
}

const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Contract address patterns
const PATTERNS = {
  // EVM addresses (Ethereum, BSC, etc.)
  evmAddress: /\b(0x[a-fA-F0-9]{40})\b/g,
  
  // Solana addresses (base58, typically 32-44 chars)
  solanaAddress: /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g,
  
  // Common patterns in audit reports
  contractAddress: /(?:Contract\s+Address|Token\s+Address|Deployed\s+at|Address)[:\s]+([0-9a-fA-FxA-Fa-z]+)/gi,
  evmAddressExplicit: /(?:0x[a-fA-F0-9]{40})/g
};

function normalizeForComparison(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isValidEvmAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidSolanaAddress(address) {
  // Basic validation: 32-44 chars, base58
  if (address.length < 32 || address.length > 44) return false;
  // Exclude common false positives
  const excluded = ['CFGNINJA', 'CRITICAL', 'MEDIUM', 'FIXED', 'ACCEPTED'];
  return !excluded.some(ex => address.includes(ex));
}

function extractContractAddresses(text, platform) {
  const addresses = new Set();
  
  // Strategy 1: Look for explicit contract address mentions
  const explicitMatches = [...text.matchAll(PATTERNS.contractAddress)];
  explicitMatches.forEach(match => {
    const addr = match[1].trim();
    if (isValidEvmAddress(addr)) {
      addresses.add(addr);
    }
  });
  
  // Strategy 2: Find all EVM addresses
  if (!platform || platform.toLowerCase().includes('bsc') || 
      platform.toLowerCase().includes('ethereum') ||
      platform.toLowerCase().includes('bnb') ||
      platform.toLowerCase().includes('eth')) {
    const evmMatches = [...text.matchAll(PATTERNS.evmAddress)];
    evmMatches.forEach(match => {
      const addr = match[1];
      if (isValidEvmAddress(addr)) {
        addresses.add(addr);
      }
    });
  }
  
  // Strategy 3: Solana addresses
  if (platform && platform.toLowerCase().includes('solana')) {
    const solanaMatches = [...text.matchAll(PATTERNS.solanaAddress)];
    solanaMatches.forEach(match => {
      const addr = match[1];
      if (isValidSolanaAddress(addr)) {
        addresses.add(addr);
      }
    });
  }
  
  return Array.from(addresses);
}

async function extractFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.error(`Error parsing PDF ${pdfPath}:`, err.message);
    return null;
  }
}

async function extractContractsFromPDFs() {
  try {
    console.log('\n📊 Starting Contract Address Extraction from PDFs...\n');
    
    const pdfFiles = fs.readdirSync(AUDITS_TEMPORAL_PATH)
      .filter(f => f.endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files\n`);
    
    let stats = {
      totalProcessed: 0,
      contractsAdded: 0,
      matched: 0,
      notMatched: 0,
      errors: 0,
      alreadyHaveContract: 0
    };
    
    // Process PDFs in batches
    const BATCH_SIZE = 100;
    const totalToProcess = Math.min(BATCH_SIZE, pdfFiles.length);
    
    for (let i = 0; i < totalToProcess; i++) {
      const file = pdfFiles[i];
      stats.totalProcessed++;
      
      if (stats.totalProcessed % 10 === 0) {
        console.log(`Progress: ${stats.totalProcessed}/${totalToProcess}`);
      }
      
      try {
        // Extract project name from filename
        // Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
        const parts = file.replace('.pdf', '').split('_');
        if (parts.length < 3) continue;
        
        const projectName = parts.slice(2, -2).join(' ');
        const normalizedName = normalizeForComparison(projectName);
        
        // Find matching project
        const projects = await Project.find({
          $or: [
            { name: { $regex: new RegExp(projectName, 'i') } },
            { slug: { $regex: new RegExp(normalizedName, 'i') } }
          ]
        });
        
        let matchedProject = null;
        
        for (const proj of projects) {
          if (normalizeForComparison(proj.name) === normalizedName) {
            matchedProject = proj;
            break;
          }
        }
        
        if (!matchedProject && projects.length > 0) {
          matchedProject = projects[0];
        }
        
        if (!matchedProject) {
          stats.notMatched++;
          continue;
        }
        
        stats.matched++;
        
        // Skip if already has contract address
        if (matchedProject.contract_info?.contract_address) {
          stats.alreadyHaveContract++;
          continue;
        }
        
        // Extract text from PDF
        const pdfPath = path.join(AUDITS_TEMPORAL_PATH, file);
        const text = await extractFromPDF(pdfPath);
        
        if (!text) {
          stats.errors++;
          continue;
        }
        
        // Extract contract addresses
        const addresses = extractContractAddresses(text, matchedProject.platform);
        
        if (addresses.length > 0) {
          // Use the first address found (usually the main contract)
          const contractAddress = addresses[0];
          
          await Project.findByIdAndUpdate(matchedProject._id, {
            $set: { 'contract_info.contract_address': contractAddress }
          });
          
          console.log(`✅ ${matchedProject.name}: ${contractAddress}`);
          stats.contractsAdded++;
        }
        
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
        stats.errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Extraction Summary:');
    console.log('='.repeat(60));
    console.log(`Total PDFs processed: ${stats.totalProcessed}`);
    console.log(`Projects matched: ${stats.matched}`);
    console.log(`Projects not matched: ${stats.notMatched}`);
    console.log(`Already had contract: ${stats.alreadyHaveContract}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\n✅ Contract addresses added: ${stats.contractsAdded}`);
    console.log('='.repeat(60));
    
    // Show updated coverage
    const totalPublished = await Project.countDocuments({ published: true });
    const withContracts = await Project.countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`\n📊 Contract Address Coverage: ${withContracts}/${totalPublished} (${((withContracts/totalPublished)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error extracting contracts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Extraction complete');
  }
}

extractContractsFromPDFs();
