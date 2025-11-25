const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';

// Import Project model
const Project = require('./src/models/Project');

// Path to Customers Data folder
const CUSTOMERS_DATA_FOLDER = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Customers Data';

// Counter for stats
let stats = {
  imported: 0,
  published: 0,
  draft: 0,
  updated: 0,
  errors: 0,
  skipped: 0
};

// Helper to generate slug
const generateSlug = (name, symbol) => {
  const nameSlug = (name || 'project').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${nameSlug}`;
};

// Normalize platform names
const normalizePlatform = (platform) => {
  if (!platform) return 'Binance Smart Chain';
  const p = platform.toUpperCase();
  if (p.includes('BSC') || p.includes('BNB') || p.includes('BINANCE') || p === 'BNBCHAIN') return 'Binance Smart Chain';
  if (p.includes('ETH') || p === 'ETHEREUM') return 'Ethereum';
  if (p.includes('POLYGON') || p === 'MATIC') return 'Polygon';
  if (p.includes('AVALANCHE') || p === 'AVAX') return 'Avalanche';
  if (p.includes('SOLANA') || p === 'SOL') return 'Solana';
  if (p.includes('ARBITRUM')) return 'Arbitrum';
  if (p.includes('OPTIMISM')) return 'Optimism';
  if (p.includes('FANTOM') || p === 'FTM') return 'Fantom';
  return platform;
};

// Map backup data.json to Project schema
const mapBackupDataToProject = (data) => {
  const auditDate = data.audit_release || data.DateCreated || new Date().toISOString().split('T')[0];
  const projectName = data.name || data.ContractName || 'Unknown';
  
  return {
    name: projectName,
    symbol: data.symbol || 'UNK',
    decimals: parseInt(data.decimals) || 18,
    supply: data.supply || '0',
    description: data.description || `Smart contract audit for ${projectName}`,
    logo: data.Customerlogo === 'Yes' ? '' : '',
    slug: generateSlug(projectName, data.symbol),
    audit_pdf: '',
    
    // Contract Info (matching Project schema contract_info structure)
    contract_info: {
      contract_name: data.ContractName || projectName,
      contract_language: data.baseToken || data.Language || 'Solidity',
      contract_owner: (data.owner && data.owner !== 'no') ? data.owner : data.ownerAddress || '',
      contract_deployer: '',
      contract_address: data.address || '',
      contract_created: data.DateCreated || auditDate,
      contract_verified: true,
      contract_compiler: data.compiler || '',
      contract_license: data.LicenseType || 'No License (None)'
    },
    
    // Socials
    socials: {
      telegram: data.Telegram || '',
      twitter: data.Twitter || '',
      website: data.Url || '',
      github: data.GitHub || data.Codebase || '',
      trustblock: ''
    },
    
    // Platform and Type
    platform: normalizePlatform(data.Platform),
    isToken: data.isToken === 'Yes' || data.type === 'Token',
    isNFT: data.isNFT === 'Yes' || data.type === 'NFT',
    isStaking: data.isStaking === 'Yes' || data.type === 'Staking',
    isEVMContract: data.isEVMContract === 'Yes',
    isSolana: data.isSolana === 'Yes',
    
    // Overview section (matching Project schema overview structure)
    overview: {
      honeypot: data.HoneyPot !== 'Not Detected' && data.HoneyPot !== 'Pass',
      blacklist: data.Blacklist !== 'Not Detected' && data.Blacklist !== 'Pass',
      mint: data.MintCheck !== 'Pass',
      pause_transfer: data.TransferPause === 'Detected',
      proxy_check: data.ProxyCheck === 'Detected',
      hidden_owner: data.HiddenOwner === 'Detected',
      can_take_ownership: data.CanTakeOwnership === 'Detected',
      self_destruct: data.SelfDestruct === 'Detected',
      external_call: data.ExternalCall === 'Detected',
      trading_cooldown: data.CoolDown === 'Detected',
      anti_bot: data.AntiBot === 'Detected',
      anit_whale: data.AntiWhale === 'Detected',
      whitelist: data.Whitelist === 'Detected',
      buy_tax: parseFloat(data.BuyTax) || 0,
      sell_tax: parseFloat(data.SaleTax) || 0,
      modify_tax: data.EditTax === 'Yes',
      max_tax: parseFloat(data.MaxTaxFee) > 25,
      enable_trading: data.EnableTradeCheck === 'true',
      pause_trade: data.PauseTradeCheck !== 'Pass',
      cannot_buy: data.CannotBuy !== 'Pass',
      cannot_sell: data.CannotSale !== 'Pass',
      max_transaction: data.MaxTxCheck !== 'Pass',
      enable_trade_text: data.EnableTradeText || ''
    },
    
    // KYC fields (flat fields, not nested)
    isKYC: data.isKYC === 'true' || data.isKYC === 'Yes' ? 'Yes' : 'No',
    kycURL: data.KYCURL || '',
    kycUrl: data.KYCURL || '',
    kycScore: data.KYCScore || '',
    
    // Additional flat fields
    address: data.address || '',
    ownerAddress: (data.owner && data.owner !== 'no') ? data.owner : data.ownerAddress || '',
    owner: (data.owner && data.owner !== 'no') ? data.owner : '',
    ownerScore: data.ownerScore || '',
    blockNumber: data.blockNumber || '',
    dateCreated: data.DateCreated || auditDate,
    baseToken: data.baseToken || data.Language || 'Solidity',
    codebase: data.Codebase || data.GitHub || '',
    
    // Confidence and Scores
    audit_confidence: data.ConfidenceLevel || 'Medium',
    securityScore: parseInt(data.SecurityScore) || 0,
    socialScore: parseInt(data.SocialScore) || 0,
    auditorScore: parseInt(data.AuditorScore) || 0,
    
    // Audit Tool Info
    auditToolVersion: data.auditToolVersion || '',
    auditEdition: data.auditEdition || '',
    auditStatus: data.AuditStatus || 'Pass',
    
    // Timeline
    timeline: {
      audit_request: data.audit_request || '',
      onboarding_process: data.onboarding_process || '',
      audit_preview: data.audit_preview || '',
      audit_release: data.audit_release || auditDate
    },
    
    // Publishing status
    status: 'DRAFT' // Will be updated after validation
  };
};

// Validate if project can be published
const validateForPublishing = (projectData) => {
  const required = {
    name: projectData.name && projectData.name !== 'Unknown',
    symbol: projectData.symbol && projectData.symbol !== 'UNK',
    platform: projectData.platform && projectData.platform !== '',
    contractAddress: (projectData.contract_info?.contract_address || projectData.address) && 
                     (projectData.contract_info?.contract_address || projectData.address) !== ''
  };
  
  const canPublish = required.name && required.symbol && required.platform;
  const missing = [];
  
  if (!required.contractAddress) missing.push('contract address');
  if (!required.symbol || projectData.symbol === 'UNK') missing.push('symbol');
  
  return {
    canPublish,
    missing,
    readyForPublish: required.name && required.symbol && required.platform && required.contractAddress
  };
};

// Scan for data.json files in subdirectories
const findBackupDataFiles = (dir) => {
  const dataFiles = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Check if directory has data.json
        const dataJsonPath = path.join(fullPath, 'data.json');
        if (fs.existsSync(dataJsonPath)) {
          dataFiles.push({
            folder: entry.name,
            path: dataJsonPath
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return dataFiles;
};

// Main import function
async function importBackupData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🚀 Starting backup data import...\n');
    
    // Find all data.json files
    console.log(`🔍 Scanning for backup data.json files in: ${CUSTOMERS_DATA_FOLDER}`);
    const backupFiles = findBackupDataFiles(CUSTOMERS_DATA_FOLDER);
    console.log(`📁 Found ${backupFiles.length} backup data.json files\n`);
    
    if (backupFiles.length === 0) {
      console.log('⚠️  No backup data files found!');
      return;
    }
    
    console.log('📝 Processing backup data files...\n');
    
    for (const file of backupFiles) {
      try {
        console.log(`📄 Processing: ${file.folder}`);
        
        // Read and parse JSON
        const jsonContent = fs.readFileSync(file.path, 'utf8');
        const backupData = JSON.parse(jsonContent);
        
        // Validate required fields before mapping
        if (!backupData.address) {
          console.log(`   ⚠️  Skipped - Missing contract address\n`);
          stats.skipped++;
          continue;
        }
        
        if (!backupData.name && !backupData.ContractName) {
          console.log(`   ⚠️  Skipped - Missing project name\n`);
          stats.skipped++;
          continue;
        }
        
        // Map to project schema
        const projectData = mapBackupDataToProject(backupData);
        
        // Validate for publishing
        const validation = validateForPublishing(projectData);
        
        // Set status based on validation
        if (validation.readyForPublish) {
          projectData.status = 'PUBLISHED';
        } else {
          projectData.status = 'DRAFT';
        }
        
        // Check if project already exists (by contract address or slug)
        const existing = await Project.findOne({
          $or: [
            projectData.address ? { address: projectData.address } : null,
            projectData.contract_info?.contract_address ? { 'contract_info.contract_address': projectData.contract_info.contract_address } : null,
            { slug: projectData.slug }
          ].filter(Boolean)
        });
        
        if (existing) {
          // Update existing project with complete backup data
          let updated = false;
          const updates = [];
          
          // Update contract_info
          if (!existing.contract_info) existing.contract_info = {};
          if (!existing.contract_info.contract_address && projectData.contract_info?.contract_address) {
            existing.contract_info.contract_address = projectData.contract_info.contract_address;
            existing.address = projectData.address; // Also update flat address field
            updated = true;
            updates.push('contract address');
          }
          
          if (!existing.contract_info.contract_compiler && projectData.contract_info?.contract_compiler) {
            existing.contract_info.contract_compiler = projectData.contract_info.contract_compiler;
            updated = true;
            updates.push('compiler');
          }
          
          if (!existing.contract_info.contract_license && projectData.contract_info?.contract_license) {
            existing.contract_info.contract_license = projectData.contract_info.contract_license;
            updated = true;
            updates.push('license');
          }
          
          // Update socials
          if (!existing.socials) existing.socials = {};
          if (!existing.socials.telegram && projectData.socials?.telegram) {
            existing.socials.telegram = projectData.socials.telegram;
            updated = true;
            updates.push('telegram');
          }
          
          if (!existing.socials.twitter && projectData.socials?.twitter) {
            existing.socials.twitter = projectData.socials.twitter;
            updated = true;
            updates.push('twitter');
          }
          
          if (!existing.socials.website && projectData.socials?.website) {
            existing.socials.website = projectData.socials.website;
            updated = true;
            updates.push('website');
          }
          
          if (!existing.socials.github && projectData.socials?.github) {
            existing.socials.github = projectData.socials.github;
            updated = true;
            updates.push('github');
          }
          
          // Update overview section (security & tax data)
          if (!existing.overview) existing.overview = {};
          let overviewUpdated = false;
          
          if (existing.overview.honeypot === undefined && projectData.overview?.honeypot !== undefined) {
            existing.overview.honeypot = projectData.overview.honeypot;
            overviewUpdated = true;
          }
          if (existing.overview.blacklist === undefined && projectData.overview?.blacklist !== undefined) {
            existing.overview.blacklist = projectData.overview.blacklist;
            overviewUpdated = true;
          }
          if (existing.overview.mint === undefined && projectData.overview?.mint !== undefined) {
            existing.overview.mint = projectData.overview.mint;
            overviewUpdated = true;
          }
          if (existing.overview.buy_tax === undefined && projectData.overview?.buy_tax !== undefined) {
            existing.overview.buy_tax = projectData.overview.buy_tax;
            overviewUpdated = true;
          }
          if (existing.overview.sell_tax === undefined && projectData.overview?.sell_tax !== undefined) {
            existing.overview.sell_tax = projectData.overview.sell_tax;
            overviewUpdated = true;
          }
          if (existing.overview.modify_tax === undefined && projectData.overview?.modify_tax !== undefined) {
            existing.overview.modify_tax = projectData.overview.modify_tax;
            overviewUpdated = true;
          }
          if (existing.overview.proxy_check === undefined && projectData.overview?.proxy_check !== undefined) {
            existing.overview.proxy_check = projectData.overview.proxy_check;
            overviewUpdated = true;
          }
          if (existing.overview.pause_transfer === undefined && projectData.overview?.pause_transfer !== undefined) {
            existing.overview.pause_transfer = projectData.overview.pause_transfer;
            overviewUpdated = true;
          }
          
          if (overviewUpdated) {
            updated = true;
            updates.push('security, tax');
          }
          
          // Update KYC info (flat fields)
          if (!existing.isKYC && projectData.isKYC) {
            existing.isKYC = projectData.isKYC;
            existing.kycURL = projectData.kycURL;
            existing.kycUrl = projectData.kycUrl;
            existing.kycScore = projectData.kycScore;
            updated = true;
            updates.push('KYC');
          }
          
          if (updated) {
            // Re-validate after updates
            const newValidation = validateForPublishing(existing.toObject());
            if (newValidation.readyForPublish && existing.status !== 'PUBLISHED') {
              existing.status = 'PUBLISHED';
              updates.push('promoted to PUBLISHED');
            }
            
            await existing.save();
            console.log(`✅ Updated ${existing.name}: ${updates.join(', ')}\n`);
            stats.updated++;
          } else {
            console.log(`⏭️  Skipping ${existing.name} - already complete\n`);
            stats.skipped++;
          }
        } else {
          // Create new project
          const newProject = new Project(projectData);
          await newProject.save();
          
          if (validation.readyForPublish) {
            console.log(`✅ Imported & PUBLISHED: ${projectData.name} (${projectData.symbol})\n`);
            stats.published++;
          } else {
            console.log(`✅ Imported as DRAFT: ${projectData.name} (${projectData.symbol})`);
            console.log(`   ⚠️  Missing: ${validation.missing.join(', ')}\n`);
            stats.draft++;
          }
          stats.imported++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file.folder}:`, error.message, '\n');
        stats.errors++;
      }
    }
    
    // Print summary
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${stats.imported}`);
    console.log(`   🟢 Ready to Publish: ${stats.published}`);
    console.log(`   🟡 Needs Review (Draft): ${stats.draft}`);
    console.log(`   ⏭️  Skipped/Updated: ${stats.updated + stats.skipped}`);
    console.log(`   ❌ Errors: ${stats.errors}`);
    console.log(`   📁 Total backup files: ${backupFiles.length}`);
    
    console.log('\n💡 Projects marked as PUBLISHED have: name, symbol, platform, and contract address');
    console.log('💡 Projects marked as DRAFT are missing one or more required fields');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the import
importBackupData();
