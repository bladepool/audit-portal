const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  decimals: { type: Number, required: true },
  supply: { type: String, required: true },
  description: { type: String, required: true },
  logo: { type: String },
  launchpad: { type: String },
  slug: { type: String, required: true, unique: true },
  audit_pdf: { type: String },
  
  // Socials
  socials: {
    telegram: { type: String },
    twitter: { type: String },
    website: { type: String },
    github: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    reddit: { type: String },
    cmc: { type: String },
    cg: { type: String },
    trustblock: { type: String }
  },
  
  // Contract Info
  contract_info: {
    contract_name: { type: String },
    contract_language: { type: String },
    contract_owner: { type: String },
    contract_deployer: { type: String },
    contract_address: { type: String },
    contract_created: { type: String },
    contract_verified: { type: Boolean, default: false },
    contract_compiler: { type: String },
    contract_license: { type: String }
  },
  
  // Live Status
  live: { type: Boolean, default: false },
  
  // Overview
  overview: {
    honeypot: { type: Boolean, default: false },
    hidden_owner: { type: Boolean, default: false },
    trading_cooldown: { type: Boolean, default: false },
    max_tax: { type: Boolean, default: false },
    anit_whale: { type: Boolean, default: false },
    blacklist: { type: Boolean, default: false },
    buy_tax: { type: Number, default: 0 },
    sell_tax: { type: Number, default: 0 },
    max_transaction: { type: Boolean, default: false },
    can_take_ownership: { type: Boolean, default: false },
    external_call: { type: Boolean, default: false },
    self_destruct: { type: Boolean, default: false },
    proxy_check: { type: Boolean, default: false },
    anti_bot: { type: Boolean, default: false },
    mint: { type: Boolean, default: false },
    enable_trading: { type: Boolean, default: false },
    cannot_buy: { type: Boolean, default: false },
    cannot_sell: { type: Boolean, default: false },
    modify_tax: { type: Boolean, default: false },
    whitelist: { type: Boolean, default: false },
    pause_transfer: { type: Boolean, default: false },
    others: { type: Boolean, default: false },
    enable_trade_text: { type: String },
    pause_trade: { type: Boolean, default: false },
    max_wallet: { type: Boolean, default: false }
  },
  
  // Severity Findings
  minor: {
    found: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 }
  },
  medium: {
    found: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 }
  },
  major: {
    found: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 }
  },
  critical: {
    found: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 }
  },
  informational: {
    found: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 }
  },
  
  // Additional Fields
  codebase: { type: String },
  platform: { type: String },
  
  // Timeline
  timeline: {
    audit_request: { type: String },
    onboarding_process: { type: String },
    audit_preview: { type: String },
    audit_release: { type: String }
  },
  
  // Audit Metrics
  audit_confidence: { type: String },
  audit_score: { type: Number, default: 0 },
  tags: [{ type: String }],
  launchpad_link: { type: String },
  
  // Audit Tool Info
  auditToolVersion: { type: String },
  auditReleaseNotes: { type: String },
  auditEdition: { type: String },
  paymentHash: { type: String },
  auditStatus: { type: String, default: 'In Progress' },
  
  // PDF Generation Toggles - Control what sections appear in PDF
  enableSummary: { type: Boolean, default: true }, // Show Risk Analysis Summary section
  enableSWCSummary: { type: Boolean, default: false }, // DEPRECATED - SWC checks removed
  enableSimulation: { type: Boolean, default: false }, // Show simulation/testing section
  enableOnlyOwner: { type: Boolean, default: false }, // Show onlyOwner functions table
  enableTradeCheck: { type: Boolean, default: false }, // Show trading checks section
  isFlat: { type: String, default: 'No' }, // Is contract flattened (Yes/No)
  isReentrant: { type: Boolean, default: false }, // Reentrancy vulnerability check
  isGraph: { type: Boolean, default: false }, // Include call graph
  isInheritance: { type: Boolean, default: false }, // Include inheritance diagram
  isEVMContract: { type: Boolean, default: true }, // EVM contract
  isSolana: { type: Boolean, default: false }, // Solana program
  isNFT: { type: Boolean, default: false }, // NFT contract
  isToken: { type: Boolean, default: true }, // Token contract (default)
  isStaking: { type: Boolean, default: false }, // Staking contract
  isOther: { type: Boolean, default: false }, // Other contract type
  
  // Contract Details
  address: { type: String },
  ownerAddress: { type: String },
  ownerScore: { type: String },
  owner: { type: String },
  blockNumber: { type: String },
  dateCreated: { type: String },
  baseToken: { type: String },
  
  // Additional Checks
  isKYC: { type: String },
  kycURL: { type: String },
  kycUrl: { type: String },
  kycScore: { type: String },
  kycScoreNotes: { type: String },
  kycVendor: { type: String },
  isMainNetAvailable: { type: String },
  isTestNetAvailable: { type: String },
  testNetAddress: { type: String },
  testNetCodeBase: { type: String },
  
  // Scores
  socialScore: { type: Number, default: 0 },
  securityScore: { type: Number, default: 0 },
  auditorScore: { type: Number, default: 0 },
  
  // Token Distribution
  tokenDistribution: { type: String },
  isLiquidityLock: { type: String },
  liquidityLockLink: { type: String },
  lockAmount: { type: String },
  lockLocation: { type: String },
  unlockAmount: { type: String },
  distributions: [{
    name: { type: String },
    amount: { type: String },
    description: { type: String }
  }],
  
  // Findings - CFG01 to CFG26
  cfg_findings: [{
    id: { type: String }, // CFG01, CFG02, etc.
    title: { type: String },
    severity: { type: String }, // Critical, High, Medium, Low, Informational
    status: { type: String }, // Detected, Not Detected, Pass, Fail
    category: { type: String },
    description: { type: String },
    location: { type: String },
    recommendation: { type: String },
    alleviation: { type: String },
    action: { type: String },
    score: { type: Number, default: 0 }
  }],
  
  // SWC Checks (SWC100-SWC136)
  swc_checks: [{
    id: { type: String }, // SWC100, SWC101, etc.
    status: { type: String },
    location: { type: String }
  }],
  
  // Findings Summary Totals
  findings_totals: {
    critical: {
      found: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 }
    },
    high: {
      found: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 }
    },
    medium: {
      found: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 }
    },
    low: {
      found: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 }
    },
    informational: {
      found: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 }
    }
  },
  
  // Legacy Findings (keep for backward compatibility)
  findings: [{
    title: { type: String },
    severity: { type: String },
    status: { type: String },
    description: { type: String }
  }],
  
  // Stats
  page_view: { type: Number, default: 0 },
  total_votes: { type: Number, default: 0 },
  secure_votes: { type: Number, default: 0 },
  insecure_votes: { type: Number, default: 0 },
  
  // Score History
  score_history: {
    data: [{ type: Number }],
    current: { type: Number }
  },
  
  // Audit PDF URL
  auditPdfUrl: { type: String },
  
  // Publishing
  published: { type: Boolean, default: false },
  status: { type: String, default: 'draft' } // draft, published
}, {
  timestamps: true
});

// Index for faster queries
// Note: slug already has unique index from schema definition
projectSchema.index({ published: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
