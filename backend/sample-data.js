// Sample Project Data for Testing
// Copy and paste into the admin form or use via API

const sampleProject = {
  // Basic Information
  name: "Dog MAGA",
  symbol: "DOGMAGA",
  decimals: 9,
  supply: "1,000,000,000",
  description: "# Dog MAGA\n\nDog MAGA is a community-driven meme token on Binance Smart Chain. Built with security and transparency in mind.\n\n## Features\n- Community-driven\n- Fair launch\n- Liquidity locked\n- Verified contract",
  logo: "https://via.placeholder.com/200x200?text=DOGMAGA",
  launchpad: "Pinksale",
  slug: "dogmaga", // Will auto-generate if empty
  audit_pdf: "",
  
  // Social Links
  socials: {
    telegram: "https://t.me/DogMagaDefi",
    twitter: "https://x.com/DogMagaDefi",
    website: "https://dogmaga.site/",
    github: "",
    facebook: "",
    instagram: "",
    reddit: "",
    cmc: "",
    cg: ""
  },
  
  // Contract Information
  contract_info: {
    contract_name: "DOGMAGA",
    contract_language: "Solidity",
    contract_owner: "0x0A887e4e8078316f9265AdDDfce6AE4282D94CEf",
    contract_deployer: "0x0A887e4e8078316f9265AdDDfce6AE4282D94CEf",
    contract_address: "0x9929326e98c7ebf20c6417fcae50f64db5320470",
    contract_created: "06/07/2024",
    contract_verified: true,
    contract_compiler: "v0.8.20+commit.a1b79de6",
    contract_license: "No License (None)"
  },
  
  // Live Status
  live: true,
  
  // Overview / Risk Assessment
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
    enable_trading: false,
    cannot_buy: false,
    cannot_sell: false,
    modify_tax: false,
    whitelist: false,
    pause_transfer: false,
    others: false,
    enable_trade_text: "Safe developer needs to enable trading",
    pause_trade: false,
    max_wallet: false
  },
  
  // Severity Findings
  minor: {
    found: 0,
    pending: 0,
    resolved: 0
  },
  medium: {
    found: 0,
    pending: 0,
    resolved: 0
  },
  major: {
    found: 0,
    pending: 0,
    resolved: 0
  },
  critical: {
    found: 1,
    pending: 1,
    resolved: 0
  },
  informational: {
    found: 0,
    pending: 0,
    resolved: 0
  },
  
  // Additional Fields
  codebase: "https://bscscan.com/address/0x9929326e98C7eBf20c6417FCAe50F64Db5320470#code",
  platform: "Binance Smart Chain",
  
  // Timeline
  timeline: {
    audit_request: "06/07/2024",
    onboarding_process: "06/07/2024",
    audit_preview: "06/08/2024",
    audit_release: "06/08/2024"
  },
  
  // Audit Metrics
  audit_confidence: "Medium",
  audit_score: 84,
  tags: [],
  launchpad_link: "",
  
  // Findings (detailed)
  findings: [
    {
      title: "enableTrade Present",
      severity: "critical",
      status: "pending",
      description: "Contract has enable trading function that must be called by owner"
    }
  ],
  
  // Stats
  page_view: 347,
  total_votes: 0,
  
  // Score History
  score_history: {
    data: [50, 50, 60, 20, 80, 84],
    current: 84
  },
  
  // Publishing
  published: true
};

// Another sample - SAKURAAI
const sakuraaiSample = {
  name: "SAKURAAI",
  symbol: "SAKURA",
  decimals: 18,
  supply: "1,000,000,000",
  description: "# SAKURAAI\n\n🤖 The era of decentralized intelligence has begun. Be among the first to experience the pioneering AI agent built on BNB.\n\n## Highlights\n- 🔥 Tier 1 PinkSale KOLS\n- 🔥 Major & Cherry Bot Ads\n- 🔥 NTM.ai, CNToken Trending\n- 🔥 DexTools, DexView, DexScreener & Ave Trending\n- 🔥 Fast-Track CMC & CG",
  logo: "https://via.placeholder.com/200x200?text=SAKURA",
  launchpad: "PinkSale",
  slug: "sakuraai",
  socials: {
    telegram: "https://t.me/Sakura_BNB",
    twitter: "https://x.com/Sakura_BNB",
    website: "https://sakuraai.live/",
    github: "",
    facebook: "",
    instagram: "",
    reddit: "",
    cmc: "",
    cg: ""
  },
  contract_info: {
    contract_name: "StandardToken",
    contract_language: "Solidity",
    contract_owner: "0xf8fE07A892Ceba6dCE9cb98D8B9115BBf01F569d",
    contract_deployer: "0xf8fE07A892Ceba6dCE9cb98D8B9115BBf01F569d",
    contract_address: "0x6F2d81908Bc0435C8111ad6Ad9ba3dcfE70E89f3",
    contract_created: "07/11/2025",
    contract_verified: true,
    contract_compiler: "v0.8.20+commit.a1b79de6",
    contract_license: "No License (None)"
  },
  live: true,
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
    enable_trading: false,
    cannot_buy: false,
    cannot_sell: false,
    modify_tax: false,
    whitelist: false,
    pause_transfer: false,
    others: false,
    enable_trade_text: "",
    pause_trade: false,
    max_wallet: false
  },
  minor: { found: 0, pending: 0, resolved: 0 },
  medium: { found: 0, pending: 0, resolved: 0 },
  major: { found: 0, pending: 0, resolved: 0 },
  critical: { found: 0, pending: 0, resolved: 0 },
  informational: { found: 0, pending: 0, resolved: 0 },
  codebase: "https://bscscan.com/address/0x6F2d81908Bc0435C8111ad6Ad9ba3dcfE70E89f3#code",
  platform: "Binance Smart Chain",
  timeline: {
    audit_request: "07/11/2025",
    onboarding_process: "07/11/2025",
    audit_preview: "08/11/2025",
    audit_release: "07/11/2025"
  },
  audit_confidence: "Medium",
  audit_score: 85,
  findings: [],
  page_view: 127,
  total_votes: 0,
  score_history: {
    data: [70, 75, 80, 82, 85],
    current: 85
  },
  published: true
};

// Simple test project
const simpleTest = {
  name: "Test Token",
  symbol: "TEST",
  decimals: 18,
  supply: "1,000,000",
  description: "A simple test token for demonstration purposes.",
  slug: "test-token",
  contract_info: {
    contract_name: "TestToken",
    contract_language: "Solidity",
    contract_verified: true
  },
  live: false,
  overview: {
    honeypot: false,
    hidden_owner: false,
    buy_tax: 0,
    sell_tax: 0
  },
  minor: { found: 0, pending: 0, resolved: 0 },
  medium: { found: 0, pending: 0, resolved: 0 },
  major: { found: 0, pending: 0, resolved: 0 },
  critical: { found: 0, pending: 0, resolved: 0 },
  informational: { found: 0, pending: 0, resolved: 0 },
  platform: "Binance Smart Chain",
  timeline: {},
  audit_score: 90,
  audit_confidence: "High",
  score_history: {
    data: [90],
    current: 90
  },
  published: false // Draft mode
};

module.exports = {
  sampleProject,
  sakuraaiSample,
  simpleTest
};

// To use via API (using curl or Postman):
// 1. Login to get token
// POST http://localhost:5000/api/auth/login
// Body: { "email": "admin@cfg.ninja", "password": "admin123" }
//
// 2. Create project with token
// POST http://localhost:5000/api/projects
// Headers: Authorization: Bearer <your-token>
// Body: <one of the samples above>
