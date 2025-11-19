export interface Finding {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  status: 'Detected' | 'Not Detected' | 'Pass' | 'Fail' | 'Acknowledge';
  category: string;
  description: string;
  location: string;
  recommendation: string;
  alleviation: string;
  action: string;
  score: number;
}

export interface Project {
  _id: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  description: string;
  logo?: string;
  launchpad?: string;
  slug: string;
  audit_pdf?: string;
  auditPdfUrl?: string;
  
  // Audit Tool Info
  auditToolVersion?: string;
  auditReleaseNotes?: string;
  auditEdition?: string;
  paymentHash?: string;
  
  // Additional Contract Info
  address?: string;
  ownerAddress?: string;
  ownerScore?: number;
  blockNumber?: string;
  dateCreated?: string;
  baseToken?: string;
  
  // KYC Information
  isKYC?: boolean;
  kycURL?: string;
  kycUrl?: string;
  kycScore?: number;
  kycScoreNotes?: string;
  kycVendor?: string;
  isMainNetAvailable?: boolean;
  isTestNetAvailable?: boolean;
  
  // Advanced Metadata
  isGraph?: boolean;
  isInheritance?: boolean;
  isEVMContract?: boolean;
  isSolana?: boolean;
  isNFT?: boolean;
  isToken?: boolean;
  isStaking?: boolean;
  isOther?: boolean;
  
  // Scores
  socialScore?: number;
  securityScore?: number;
  auditorScore?: number;
  auditStatus?: string;
  
  // Token Distribution
  tokenDistribution?: {
    isLiquidityLock?: boolean;
    liquidityLockLink?: string;
    lockAmount?: string;
    lockLocation?: string;
    distributions?: Array<{
      name: string;
      amount: string;
      description: string;
    }>;
  };
  
  socials: {
    telegram?: string;
    twitter?: string;
    website?: string;
    github?: string;
    discord?: string;
    facebook?: string;
    instagram?: string;
    reddit?: string;
    cmc?: string;
    cg?: string;
    trustblock?: string;
  };
  
  contract_info: {
    contract_name?: string;
    contract_language?: string;
    contract_owner?: string;
    contract_deployer?: string;
    contract_address?: string;
    contract_created?: string;
    contract_verified: boolean;
    contract_compiler?: string;
    contract_license?: string;
  };
  
  live: boolean;
  
  overview: {
    honeypot: boolean;
    hidden_owner: boolean;
    trading_cooldown: boolean;
    max_tax: boolean;
    anit_whale: boolean;
    blacklist: boolean;
    buy_tax: number;
    sell_tax: number;
    max_transaction: boolean;
    can_take_ownership: boolean;
    external_call: boolean;
    self_destruct: boolean;
    proxy_check: boolean;
    anti_bot: boolean;
    mint: boolean;
    enable_trading: boolean;
    cannot_buy: boolean;
    cannot_sell: boolean;
    modify_tax: boolean;
    whitelist: boolean;
    pause_transfer: boolean;
    others: boolean;
    enable_trade_text?: string;
    pause_trade: boolean;
    max_wallet: boolean;
  };
  
  // CFG Findings
  cfg_findings?: Finding[];
  
  // SWC Checks
  swc_checks?: Array<{
    id: string;
    status: string;
    location: string;
  }>;
  
  // Findings Totals
  findings_totals?: {
    critical: { found: number; pending: number; resolved: number };
    high: { found: number; pending: number; resolved: number };
    medium: { found: number; pending: number; resolved: number };
    low: { found: number; pending: number; resolved: number };
    informational: { found: number; pending: number; resolved: number };
  };
  
  minor: {
    found: number;
    pending: number;
    resolved: number;
  };
  medium: {
    found: number;
    pending: number;
    resolved: number;
  };
  major: {
    found: number;
    pending: number;
    resolved: number;
  };
  critical: {
    found: number;
    pending: number;
    resolved: number;
  };
  informational: {
    found: number;
    pending: number;
    resolved: number;
  };
  
  codebase?: string;
  platform?: string;
  
  timeline: {
    audit_request?: string;
    onboarding_process?: string;
    audit_preview?: string;
    audit_release?: string;
  };
  
  audit_confidence?: string;
  audit_score: number;
  tags: string[];
  launchpad_link?: string;
  
  findings: Array<{
    title: string;
    severity: string;
    status: string;
    description: string;
  }>;
  
  page_view: number;
  total_votes: number;
  secure_votes?: number;
  insecure_votes?: number;
  
  score_history: {
    data: number[];
    current: number;
  };
  
  status?: 'draft' | 'published';
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
