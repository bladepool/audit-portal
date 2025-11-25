const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./src/models/Project');

// Path to the Audits_Temporal folder with JSON and PDF files
const AUDITS_FOLDER = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/audit-portal');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Extract data from PDF text (requires Node 20+ for pdf-parse)
const extractFromPDF = async (pdfPath, filename) => {
  try {
    // Note: PDF parsing requires Node.js 20+ 
    // For now, return basic data from filename
    console.log(`   ⚠️  PDF parsing requires Node.js 20+. Extracting basic info from filename...`);
    
    const extracted = {
      name: '',
      symbol: '',
      contractAddress: '',
      platform: 'Binance Smart Chain',
      owner: '',
      supply: '',
      decimals: '18',
      auditScore: 0,
      verified: false,
      website: '',
      telegram: '',
      twitter: '',
      github: ''
    };
    
    // Extract project name and symbol from filename
    // Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
    const nameMatch = filename.match(/\d{8}_CFGNINJA_(.+?)_([A-Z0-9$]+)_Audit\.pdf/i);
    if (nameMatch) {
      extracted.name = nameMatch[1].replace(/_/g, ' ').trim();
      extracted.symbol = nameMatch[2].replace(/\$/g, '').trim();
    }
    
    return extracted;
  } catch (error) {
    console.error(`Error extracting from PDF: ${error.message}`);
    return null;
  }
};

// Extract contract address from JSON data (handles multiple structures)
const extractContractAddress = (data) => {
  // Check direct fields first
  if (data.address) return data.address;
  if (data.Address) return data.Address;
  if (data.contractAddress) return data.contractAddress;
  if (data.contract_address) return data.contract_address;
  
  // Check contracts array (new structure)
  if (data.contracts && Array.isArray(data.contracts) && data.contracts.length > 0) {
    return data.contracts[0].evmAddress || data.contracts[0].address || '';
  }
  
  return '';
};

// Extract platform/blockchain from data
const extractPlatform = (data) => {
  let platform = data.Platform || data.platform || data.blockchain || '';
  
  // Check contracts array for chain info
  if (!platform && data.contracts && Array.isArray(data.contracts) && data.contracts.length > 0) {
    platform = data.contracts[0].chain || data.contracts[0].Chain || '';
  }
  
  // Normalize platform names
  if (platform.match(/BSC|BNB|Binance|BNBCHAIN/i)) return 'Binance Smart Chain';
  if (platform.match(/ETH|Ethereum/i)) return 'Ethereum';
  if (platform.match(/Polygon|MATIC/i)) return 'Polygon';
  if (platform.match(/Avalanche|AVAX/i)) return 'Avalanche';
  if (platform.match(/Solana|SOL/i)) return 'Solana';
  if (platform.match(/Arbitrum/i)) return 'Arbitrum';
  if (platform.match(/Optimism/i)) return 'Optimism';
  if (platform.match(/Fantom|FTM/i)) return 'Fantom';
  
  return platform || 'Binance Smart Chain'; // Default to BSC
};

// Generate slug from name and symbol
const generateSlug = (name, symbol) => {
  const base = (name || symbol || 'project').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base;
};

// Parse date from filename (format: YYYYMMDD_CFGNINJA_Name_Symbol_Audit.json)
const extractDateFromFilename = (filename) => {
  const match = filename.match(/^(\d{8})/);
  if (match) {
    const dateStr = match[1];
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
};

// Helper function to extract symbol from filename
const extractSymbolFromFilename = (filename) => {
  // Pattern: 20231216_CFGNINJA_GROK 2024_GRK24_Audit.json
  const match = filename.match(/_CFGNINJA_(.+?)_([A-Z0-9$]+)_Audit\./i);
  if (match && match[2]) {
    return match[2].replace(/\$/g, '').toUpperCase();
  }
  return '';
};

// Map JSON data to Project schema
const mapJsonToProject = (jsonData, filename) => {
  const contractAddress = extractContractAddress(jsonData);
  const platform = extractPlatform(jsonData);
  const auditDate = extractDateFromFilename(filename);
  
  // Handle new JSON structure with nested "project" object
  const projectData = jsonData.project || jsonData;
  const linksData = projectData.links || {};
  
  // Try to get symbol from JSON, fallback to filename extraction
  let symbol = projectData.symbol || jsonData.symbol || '';
  if (!symbol || symbol === 'UNK') {
    symbol = extractSymbolFromFilename(filename) || 'UNK';
  }
  
  return {
    name: projectData.name || jsonData.name || 'Unknown',
    symbol: symbol,
    decimals: parseInt(jsonData.decimals || projectData.decimals) || 18,
    supply: jsonData.supply || projectData.supply || '0',
    description: (() => {
      // Try to get description from various sources
      let desc = '';
      if (typeof jsonData.description === 'string') {
        desc = jsonData.description;
      } else if (typeof jsonData.description?.summary === 'string') {
        desc = jsonData.description.summary;
      } else if (typeof projectData.description === 'string') {
        desc = projectData.description;
      }
      // Fallback to default if empty
      return desc || `Audit for ${projectData.name || 'project'}`;
    })(),
    logo: jsonData.logo || '',
    slug: generateSlug(jsonData.name, jsonData.symbol),
    audit_pdf: jsonData.audit_pdf || jsonData.auditPdf || '',
    
    // Contract Info
    contract: {
      name: jsonData.contract?.name || jsonData.contractName || jsonData.name || '',
      language: jsonData.contract?.language || jsonData.baseToken || 'Solidity',
      owner: jsonData.contract?.owner || jsonData.owner || jsonData.ownerAddress || '',
      deployer: jsonData.contract?.deployer || '',
      address: contractAddress,
      created: jsonData.contract?.created || jsonData.DateCreated || auditDate,
      verified: jsonData.contract?.verified !== false,
      compiler: jsonData.contract?.compiler || '',
      license: jsonData.contract?.license || 'No License (None)'
    },
    
    // Socials
    socials: {
      telegram: linksData.Telegram || linksData.telegram || jsonData.socials?.telegram || jsonData.telegram || '',
      twitter: linksData.twitter || linksData.Twitter || jsonData.socials?.twitter || jsonData.twitter || '',
      website: linksData.website || linksData.Website || jsonData.socials?.website || jsonData.website || '',
      github: linksData.github || linksData.Github || jsonData.socials?.github || jsonData.github || jsonData.Codebase || '',
      trustblock: jsonData.socials?.trustblock || jsonData.trustblock || ''
    },
    
    // Platform
    platform: platform,
    codebase: jsonData.Codebase || jsonData.github || '',
    
    // Timeline
    timeline: {
      audit_request: jsonData.audit_request || auditDate,
      onboarding_process: jsonData.onboarding_process || auditDate,
      audit_preview: jsonData.audit_preview || auditDate,
      audit_release: jsonData.audit_release || auditDate
    },
    
    // Scores
    audit_score: parseInt(jsonData.audit_score || jsonData.auditScore) || 0,
    audit_confidence: jsonData.audit_confidence || jsonData.auditConfidence || 'Medium',
    ownerScore: parseInt(jsonData.ownerScore) || 0,
    socialScore: parseInt(jsonData.socialScore) || 0,
    securityScore: parseInt(jsonData.securityScore) || 0,
    auditorScore: parseInt(jsonData.auditorScore) || 0,
    
    // Edition & Version
    auditEdition: jsonData.auditEdition || 'Standard',
    auditToolVersion: jsonData.auditToolVersion || '3.4',
    
    // Publishing
    published: false, // Default to unpublished for review
    status: 'draft',
    
    // Meta
    page_view: 0,
    total_votes: 0,
    
    // Advanced flags
    isEVMContract: jsonData.isEVMContract !== 'No',
    isSolana: jsonData.isSolana === 'Yes',
    isNFT: jsonData.isNFT === 'Yes' || jsonData.type === 'NFT',
    isToken: jsonData.isToken === 'Yes' || jsonData.type === 'Token' || jsonData.TOCToken === 'Yes',
    isStaking: jsonData.isStaking === 'Yes' || jsonData.type === 'Staking',
    
    // Graph & Inheritance
    isGraph: jsonData.isGraph === 'Yes',
    graph_url: jsonData.graph_url || '',
    isInheritance: jsonData.isInheritance === 'Yes',
    inheritance_url: jsonData.inheritance_url || ''
  };
};

// Merge PDF and JSON data, filling in missing values
const mergeData = (jsonData, pdfData, filename) => {
  const merged = mapJsonToProject(jsonData, filename);
  
  // Check if PDF data was successfully extracted
  if (!pdfData || typeof pdfData !== 'object') return merged;
  
  // Fill missing contract address
  if (!merged.contract?.address && pdfData.contractAddress) {
    merged.contract.address = pdfData.contractAddress;
    console.log(`   📝 Added contract address from PDF: ${pdfData.contractAddress}`);
  }
  
  // Fill missing platform
  if (!merged.platform && pdfData.platform) {
    merged.platform = pdfData.platform;
    console.log(`   📝 Added platform from PDF: ${pdfData.platform}`);
  }
  
  // Fill missing owner
  if (!merged.contract.owner && pdfData.owner) {
    merged.contract.owner = pdfData.owner;
    console.log(`   📝 Added owner from PDF: ${pdfData.owner}`);
  }
  
  // Fill missing supply
  if (!merged.supply && pdfData.supply) {
    merged.supply = pdfData.supply;
    console.log(`   📝 Added supply from PDF: ${pdfData.supply}`);
  }
  
  // Fill missing socials
  if (!merged.socials.website && pdfData.website) {
    merged.socials.website = pdfData.website;
    console.log(`   📝 Added website from PDF`);
  }
  if (!merged.socials.telegram && pdfData.telegram) {
    merged.socials.telegram = pdfData.telegram;
    console.log(`   📝 Added Telegram from PDF`);
  }
  if (!merged.socials.twitter && pdfData.twitter) {
    merged.socials.twitter = pdfData.twitter;
    console.log(`   📝 Added Twitter from PDF`);
  }
  if (!merged.socials.github && pdfData.github) {
    merged.socials.github = pdfData.github;
    console.log(`   📝 Added GitHub from PDF`);
  }
  
  // Update audit score if PDF has higher
  if (pdfData.auditScore > merged.audit_score) {
    merged.audit_score = pdfData.auditScore;
    console.log(`   📝 Updated audit score from PDF: ${pdfData.auditScore}`);
  }
  
  // Update verified status
  if (pdfData.verified && !merged.contract.verified) {
    merged.contract.verified = true;
    console.log(`   📝 Marked as verified from PDF`);
  }
  
  return merged;
};

// Validate if project has minimum required data for publishing
const validateForPublishing = (projectData) => {
  const required = {
    name: projectData.name && projectData.name !== 'Unknown',
    symbol: projectData.symbol && projectData.symbol !== 'UNK',
    platform: projectData.platform && projectData.platform !== '',
    contractAddress: projectData.contract.address && projectData.contract.address !== ''
  };
  
  const missing = [];
  if (!required.name) missing.push('name');
  if (!required.symbol) missing.push('symbol');
  if (!required.platform) missing.push('platform');
  if (!required.contractAddress) missing.push('contract address');
  
  const canPublish = required.name && required.symbol && required.platform;
  
  return {
    canPublish,
    missing,
    readyForPublish: canPublish && required.contractAddress
  };
};

// Import all JSON and PDF files
const importAudits = async () => {
  try {
    console.log('🔍 Scanning for audit files in:', AUDITS_FOLDER);
    
    const files = fs.readdirSync(AUDITS_FOLDER);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('trust_'));
    const pdfFiles = files.filter(f => f.endsWith('.pdf') && !f.startsWith('trust_'));
    
    console.log(`📁 Found ${jsonFiles.length} JSON files and ${pdfFiles.length} PDF files`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let readyToPublish = 0;
    let needsReview = 0;
    
    // Process JSON files with PDF enhancement
    console.log('\n📝 Processing JSON files (with PDF data enhancement)...');
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(AUDITS_FOLDER, file);
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(jsonContent);
        
        // Check for corresponding PDF
        const pdfFile = file.replace('.json', '.pdf');
        const pdfPath = path.join(AUDITS_FOLDER, pdfFile);
        let pdfData = null;
        
        if (fs.existsSync(pdfPath)) {
          console.log(`📄 Found matching PDF: ${pdfFile}`);
          pdfData = await extractFromPDF(pdfPath, pdfFile);
        }
        
        // Merge JSON and PDF data
        const projectData = mergeData(jsonData, pdfData, file);
        
        // Validate for publishing
        const validation = validateForPublishing(projectData);
        
        // Check if project already exists
        const query = { $or: [] };
        
        // Only check by contract address if we have one
        if (projectData.contract?.address && projectData.contract.address !== '') {
          query.$or.push({ 'contract.address': projectData.contract.address });
        }
        
        // Also check by name and symbol
        if (projectData.name && projectData.symbol) {
          query.$or.push({ name: projectData.name, symbol: projectData.symbol });
        }
        
        // Only query if we have at least one condition
        const existing = query.$or.length > 0 ? await Project.findOne(query) : null;
        
        if (existing) {
          // Update existing project with merged data if it has missing fields
          let updated = false;
          
          if ((!existing.contract || !existing.contract.address) && projectData.contract?.address) {
            if (!existing.contract) existing.contract = {};
            existing.contract.address = projectData.contract.address;
            updated = true;
            console.log(`   🔄 Updated contract address for ${existing.name}`);
          }
          
          if (!existing.platform && projectData.platform) {
            existing.platform = projectData.platform;
            updated = true;
            console.log(`   🔄 Updated platform for ${existing.name}`);
          }
          
          if ((!existing.contract || !existing.contract.owner) && projectData.contract?.owner) {
            if (!existing.contract) existing.contract = {};
            existing.contract.owner = projectData.contract.owner;
            updated = true;
            console.log(`   🔄 Updated owner for ${existing.name}`);
          }
          
          if (updated) {
            await existing.save();
            console.log(`✅ Updated existing project: ${existing.name}`);
          } else {
            console.log(`⏭️  Skipping ${file} - already exists with complete data (${existing.name})`);
          }
          
          skipped++;
          continue;
        }
        
        // Check for duplicate slug and make it unique if needed
        const slugExists = await Project.findOne({ slug: projectData.slug });
        if (slugExists) {
          // Append audit date from filename to make slug unique
          const dateStr = extractDateFromFilename(file);
          projectData.slug = `${projectData.slug}-${dateStr.replace(/-/g, '')}`;
        }
        
        // Set publishing status based on validation
        if (validation.readyForPublish) {
          projectData.published = true;
          projectData.status = 'published';
          readyToPublish++;
          console.log(`✅ Imported & PUBLISHED: ${projectData.name} (${projectData.symbol})`);
        } else {
          projectData.published = false;
          projectData.status = 'draft';
          needsReview++;
          console.log(`✅ Imported as DRAFT: ${projectData.name} (${projectData.symbol})`);
          if (validation.missing.length > 0) {
            console.log(`   ⚠️  Missing: ${validation.missing.join(', ')}`);
          }
        }
        
        // Create new project
        await Project.create(projectData);
        imported++;
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errors++;
      }
    }
    
    // Note: Skipping standalone PDF files (require Node.js 20+ for full parsing)
    const standalonePdfCount = pdfFiles.filter(file => {
      const jsonFile = file.replace('.pdf', '.json');
      return !jsonFiles.includes(jsonFile);
    }).length;
    
    if (standalonePdfCount > 0) {
      console.log(`\n📄 Note: ${standalonePdfCount} PDF files without matching JSON were skipped (require Node.js 20+ for parsing)`);
    }
    
    /* PDF processing disabled - requires Node.js 20+
    for (const file of pdfFiles) {
      try {
        const jsonFile = file.replace('.pdf', '.json');
        if (jsonFiles.includes(jsonFile)) {
          continue;
        }
        
        const filePath = path.join(AUDITS_FOLDER, file);
        console.log(`📖 Extracting data from PDF: ${file}...`);
        
        const pdfData = await extractFromPDF(filePath, file);
        if (!pdfData || !pdfData.name) {
          console.log(`⚠️  Could not extract sufficient data from ${file}`);
          errors++;
          continue;
        }
        
        // Check if project already exists
        const existing = await Project.findOne({
          $or: [
            { 'contract.address': pdfData.contractAddress, 'contract.address': { $ne: '' } },
            { name: pdfData.name, symbol: pdfData.symbol }
          ]
        });
        
        if (existing) {
          // Update existing project with PDF data if it has missing fields
          let updated = false;
          
          if (!existing.contract.address && pdfData.contractAddress) {
            existing.contract.address = pdfData.contractAddress;
            updated = true;
            console.log(`   🔄 Updated contract address for ${existing.name}`);
          }
          
          if (!existing.socials.website && pdfData.website) {
            existing.socials.website = pdfData.website;
            updated = true;
          }
          
          if (!existing.socials.telegram && pdfData.telegram) {
            existing.socials.telegram = pdfData.telegram;
            updated = true;
          }
          
          if (updated) {
            await existing.save();
            console.log(`✅ Updated existing project with PDF data: ${existing.name}`);
          } else {
            console.log(`⏭️  Skipping ${file} - already exists with complete data`);
          }
          
          skipped++;
          continue;
        }
        
        // Create project from PDF data
        const auditDate = extractDateFromFilename(file);
        const projectData = {
          name: pdfData.name || 'Unknown',
          symbol: pdfData.symbol || 'UNK',
          decimals: parseInt(pdfData.decimals) || 18,
          supply: pdfData.supply || '0',
          description: `Audit for ${pdfData.name || 'project'}`,
          logo: '',
          slug: generateSlug(pdfData.name, pdfData.symbol),
          audit_pdf: '', // PDF path can be added later
          
          contract: {
            name: pdfData.name || '',
            language: 'Solidity',
            owner: pdfData.owner || '',
            deployer: '',
            address: pdfData.contractAddress || '',
            created: auditDate,
            verified: pdfData.verified,
            compiler: '',
            license: 'No License (None)'
          },
          
          socials: {
            telegram: pdfData.telegram || '',
            twitter: pdfData.twitter || '',
            website: pdfData.website || '',
            github: pdfData.github || '',
            trustblock: ''
          },
          
          platform: pdfData.platform || 'Binance Smart Chain',
          codebase: pdfData.github || '',
          
          timeline: {
            audit_request: auditDate,
            onboarding_process: auditDate,
            audit_preview: auditDate,
            audit_release: auditDate
          },
          
          audit_score: pdfData.auditScore || 0,
          audit_confidence: 'Medium',
          ownerScore: 0,
          socialScore: 0,
          securityScore: 0,
          auditorScore: 0,
          
          auditEdition: 'Standard',
          auditToolVersion: '3.4',
          
          page_view: 0,
          total_votes: 0,
          
          isEVMContract: pdfData.platform !== 'Solana',
          isSolana: pdfData.platform === 'Solana',
          isNFT: false,
          isToken: true,
          isStaking: false,
          
          isGraph: false,
          graph_url: '',
          isInheritance: false,
          inheritance_url: ''
        };
        
        // Validate and set publishing status
        const validation = validateForPublishing(projectData);
        
        if (validation.readyForPublish) {
          projectData.published = true;
          projectData.status = 'published';
          readyToPublish++;
          console.log(`✅ Imported from PDF & PUBLISHED: ${pdfData.name} (${pdfData.symbol})`);
        } else {
          projectData.published = false;
          projectData.status = 'draft';
          needsReview++;
          console.log(`✅ Imported from PDF as DRAFT: ${pdfData.name} (${pdfData.symbol})`);
          if (validation.missing.length > 0) {
            console.log(`   ⚠️  Missing: ${validation.missing.join(', ')}`);
          }
        }
        
        await Project.create(projectData);
        imported++;
        
      } catch (error) {
        console.error(`❌ Error processing PDF ${file}:`, error.message);
        errors++;
      }
    }
    */
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   🟢 Ready to Publish: ${readyToPublish}`);
    console.log(`   🟡 Needs Review (Draft): ${needsReview}`);
    console.log(`   ⏭️  Skipped/Updated: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Total JSON files: ${jsonFiles.length}`);
    console.log(`   📁 Total PDF files: ${pdfFiles.length}`);
    console.log('\n💡 Projects marked as PUBLISHED have: name, symbol, platform, and contract address');
    console.log('💡 Projects marked as DRAFT are missing one or more required fields');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run import
connectDB().then(() => {
  console.log('🚀 Starting audit import...\n');
  importAudits();
});
