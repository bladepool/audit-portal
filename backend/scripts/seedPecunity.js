const mongoose = require('mongoose');
const Project = require('../src/models/Project');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Fetch production data from audit.cfg.ninja API
async function fetchProductionData(slug) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'audit.cfg.ninja',
      path: `/api/projects/${slug}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.log('Could not fetch production data:', e.message);
      resolve(null);
    });
  });
}

// Download logo from production
async function downloadLogo(logoUrl, slug) {
  if (!logoUrl || logoUrl.startsWith('/img/projects/')) {
    console.log('Logo already local or not available');
    return logoUrl;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'audit.cfg.ninja',
      path: logoUrl.replace('https://audit.cfg.ninja', ''),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        console.log('Logo not found on production');
        resolve(null);
        return;
      }

      const logoPath = path.join(__dirname, '../../frontend/public/img/projects', `${slug}.png`);
      const dir = path.dirname(logoPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = fs.createWriteStream(logoPath);
      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Logo downloaded to ${logoPath}`);
        resolve(`/img/projects/${slug}.png`);
      });

      file.on('error', (err) => {
        fs.unlink(logoPath, () => {});
        console.log('Logo download failed:', err.message);
        resolve(null);
      });
    }).on('error', (e) => {
      console.log('Logo download error:', e.message);
      resolve(null);
    });
  });
}

const pecunityData = {
  // Basic Info
  name: 'Pecunity',
  symbol: 'PEC',
  decimals: 18,
  supply: '25,000,000',
  description: 'Controlled ERC20 Token with Launch & Transfer Management',
  slug: 'pecunity',
  logo: '/img/projects/pecunity.png',
  platform: 'BNBCHAIN',
  
  // Audit Tool Info
  auditToolVersion: '3.4',
  auditReleaseNotes: 'This version have new pinksale parameters and new test cases.',
  auditEdition: 'Standard',
  paymentHash: '0xbed8f924faa48f7abaceba774dc14803f6a9f0b8155a80795ced52c289b201d5',
  
  // Contract Info
  address: '0x413c2834f02003752d6Cc0Bcd1cE85Af04D62fBE',
  ownerAddress: '0x353527391365b7589503eCfFcafDFBAFf0a24D1B',
  ownerScore: 5,
  blockNumber: '65067908',
  dateCreated: 'Oct-18-2025',
  baseToken: 'Solidity',
  
  // Socials
  socials: {
    website: 'https://pecunity.io',
    telegram: 't.me/pecunity',
    twitter: 'https://x.com/pecunity_app',
    github: 'https://github.com/Pecunity/pecunity-protocol',
  },
  
  // Contract Information
  contract_info: {
    contract_name: 'Pecunity',
    contract_language: 'Solidity',
    contract_owner: 'Yes',
    contract_address: '0x413c2834f02003752d6Cc0Bcd1cE85Af04D62fBE',
    contract_created: '10/18/2025',
    contract_verified: true,
    contract_compiler: '^0.8.28',
    contract_license: 'UNLICENSED',
  },
  
  // Overview/Risk Assessment
  live: false,
  overview: {
    honeypot: false,
    hidden_owner: false,
    trading_cooldown: false,
    max_tax: false,
    anit_whale: false,
    blacklist: false,
    buy_tax: 0,
    sell_tax: 0,
    max_transaction: false,
    can_take_ownership: false,
    external_call: false,
    self_destruct: false,
    proxy_check: false,
    anti_bot: false,
    mint: false,
    enable_trading: true,
    cannot_buy: false,
    cannot_sell: false,
    modify_tax: false,
    whitelist: true,
    pause_transfer: true,
    others: false,
    enable_trade_text: 'Owner must call launch to enable unrestricted transfers',
    pause_trade: true,
    max_wallet: false,
  },
  
  // Timeline
  timeline: {
    audit_request: '2025-10-19',
    onboarding_process: '2025-10-19',
    audit_preview: '2025-10-19',
    audit_release: '2025-10-19',
  },
  
  // KYC
  isKYC: true,
  kycURL: 'https://pinksale.notion.site/Pecunity-KYC-Verification-292d7dc69b3e8087961ae410cdc4409d?source=copy_link',
  kycScore: 3,
  
  // Scores
  ownerScore: 5,
  socialScore: -15,
  securityScore: 85,
  auditorScore: 85,
  audit_score: 85,
  audit_confidence: 'Very High',
  auditStatus: 'Pass',
  
  // Findings Summary
  critical: { found: 1, pending: 1, resolved: 0 },
  major: { found: 1, pending: 1, resolved: 0 },
  medium: { found: 0, pending: 0, resolved: 0 },
  minor: { found: 2, pending: 2, resolved: 1 },
  informational: { found: 0, pending: 0, resolved: 0 },
  
  // CFG Findings
  cfg_findings: [
    {
      id: 'CFG01',
      title: 'Potential Sandwich Attacks',
      severity: 'Medium',
      status: 'Detected',
      category: 'Security',
      description: 'A sandwich attack might happen when an attacker observes a transaction swapping tokens or adding liquidity without setting restrictions on slippage or minimum output amount.',
      location: 'L:479, C:14',
      recommendation: 'We recommend setting reasonable minimum output amounts, instead of 0, based on token prices when calling the aforementioned functions.',
      alleviation: '',
      action: '',
      score: 2
    },
    {
      id: 'CFG20',
      title: 'Centralization Risk in Launch Mechanism',
      severity: 'Critical',
      status: 'Detected',
      category: 'Centralization',
      description: 'The launch mechanism is controlled by a single owner address without any timelock or multisig protection. The owner has unilateral power to enable/disable transfers and control the launch state.',
      location: 'launch(), enableTransfer(), disableTransfer() functions',
      recommendation: 'Implement a timelock mechanism for launch-related functions and consider using a multisig wallet for ownership.',
      alleviation: '',
      action: 'Implement timelock and multisig controls',
      score: 2
    },
    {
      id: 'CFG21',
      title: 'Missing Access Control Recovery',
      severity: 'High',
      status: 'Detected',
      category: 'Access Control',
      description: 'No mechanism exists to recover from a compromised or lost owner account. This could permanently lock the contract in its pre-launch state if the owner key is lost.',
      location: 'Ownable implementation',
      recommendation: 'Implement a secure ownership transfer mechanism with timelock and recovery options.',
      alleviation: '',
      action: 'Implement recovery mechanism',
      score: 2
    }
  ],
  
  // SWC Checks (all Pass)
  swc_checks: [
    { id: 'SWC100', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC101', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC102', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC103', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC104', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC105', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC106', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC107', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC108', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC109', status: 'Pass', location: 'L: 0 C: 0' },
    { id: 'SWC110', status: 'Pass', location: 'L: 0 C: 0' },
  ],
  
  // Token Distribution (flattened to match schema)
  isLiquidityLock: false,
  liquidityLockLink: '',
  lockAmount: '0',
  lockLocation: 'Pinksale',
  distributions: [
    { name: 'Burn', amount: '0', description: 'Burned amount send to the deadWallet.' },
    { name: 'Liquidity', amount: '18', description: 'Liquidity tokens are split from sale into the pool.' },
    { name: 'Presale', amount: '0', description: 'Tokens allocated for the sale.' },
  ],
  
  // Advanced Metadata
  isGraph: true,
  isInheritance: true,
  isEVMContract: true,
  isSolana: false,
  isNFT: false,
  isToken: true,
  isStaking: false,
  isOther: false,
  
  // Additional
  codebase: 'https://bscscan.com/address/0x413c2834f02003752d6Cc0Bcd1cE85Af04D62fBE#code',
  published: true,
  tags: ['DeFi', 'Token', 'BNBCHAIN'],
  
  // Score History
  score_history: {
    data: [85, 85, 85],
    current: 85
  },
  
  findings: [],
  page_view: 0,
  total_votes: 0,
};

async function seedPecunity() {
  try {
    // Connect to cloud MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
    
    // Try to fetch production data
    console.log('\nFetching data from production (audit.cfg.ninja)...');
    const productionData = await fetchProductionData('pecunity');
    
    let finalData = { ...pecunityData };
    
    if (productionData) {
      console.log('✓ Found production data, merging...');
      
      // Merge production data (prioritize production for certain fields)
      if (productionData.logo) {
        console.log('Downloading production logo...');
        const localLogo = await downloadLogo(productionData.logo, 'pecunity');
        if (localLogo) {
          finalData.logo = localLogo;
        }
      }
      
      if (productionData.audit_pdf) {
        finalData.audit_pdf = productionData.audit_pdf;
        finalData.auditPdfUrl = productionData.audit_pdf;
        console.log('✓ Using production PDF URL:', productionData.audit_pdf);
      }
      
      // Merge any other fields from production that are missing
      if (productionData.launchpad) finalData.launchpad = productionData.launchpad;
      if (productionData.launchpad_link) finalData.launchpad_link = productionData.launchpad_link;
      if (productionData.page_view) finalData.page_view = productionData.page_view;
      if (productionData.total_votes) finalData.total_votes = productionData.total_votes;
    } else {
      console.log('⚠ Could not fetch production data, using local data only');
    }
    
    // Check if project exists
    const existing = await Project.findOne({ slug: 'pecunity' });
    
    if (existing) {
      console.log('\n✓ Pecunity project exists, updating with merged data...');
      await Project.findByIdAndUpdate(existing._id, finalData, { new: true, runValidators: false });
      console.log('✓ Updated Pecunity project');
    } else {
      console.log('\nCreating new Pecunity project...');
      const project = new Project(finalData);
      await project.save();
      console.log('✓ Created Pecunity project');
    }
    
    const project = await Project.findOne({ slug: 'pecunity' });
    console.log('\n' + '='.repeat(60));
    console.log('✓ SUCCESS!');
    console.log('='.repeat(60));
    console.log('Project ID:', project._id);
    console.log('Admin URL: http://localhost:3000/admin/projects/' + project._id);
    console.log('Public URL: http://localhost:3000/' + project.slug);
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding Pecunity:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

console.log('CFG Ninja - Pecunity Project Seeder');
console.log('=' .repeat(60));
seedPecunity();
