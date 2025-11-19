'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Input,
  Textarea,
  Button,
  Text,
  Switch,
  Spinner,
  makeStyles,
  tokens,
  Divider,
  Label,
  Field,
} from '@fluentui/react-components';
import { DocumentPdfRegular } from '@fluentui/react-icons';
import { projectsAPI, blockchainsAPI } from '@/lib/api';
import { Project, Finding } from '@/lib/types';
import FindingsManager from '@/components/FindingsManager';
import { generateEnhancedAuditPDF } from '@/lib/enhancedPdfGenerator';

// Global build version - update this with each new build
const AUDIT_TOOL_VERSION = '3.4';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  gridFull: {
    gridColumn: '1 / -1',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    position: 'sticky',
    bottom: '20px',
  },
});

export default function ProjectFormPage() {
  const styles = useStyles();
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [fetchingGoPlus, setFetchingGoPlus] = useState(false);
  const [goPlusMessage, setGoPlusMessage] = useState('');
  const [blockchains, setBlockchains] = useState<Array<{ name: string; symbol: string; slug: string }>>([]);
  
  // Basic Info
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [launchpad, setLaunchpad] = useState('');
  const [slug, setSlug] = useState('');
  const [auditPdf, setAuditPdf] = useState('');
  
  // Socials
  const [telegram, setTelegram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [reddit, setReddit] = useState('');
  const [cmc, setCmc] = useState('');
  const [cg, setCg] = useState('');
  const [trustblock, setTrustblock] = useState('');
  
  // Contract Info
  const [contractName, setContractName] = useState('');
  const [contractLanguage, setContractLanguage] = useState('Solidity');
  const [contractOwner, setContractOwner] = useState('');
  const [contractDeployer, setContractDeployer] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [contractCreated, setContractCreated] = useState('');
  const [contractVerified, setContractVerified] = useState(false);
  const [contractCompiler, setContractCompiler] = useState('');
  const [contractLicense, setContractLicense] = useState('No License (None)');
  
  // Overview
  const [live, setLive] = useState(false);
  const [honeypot, setHoneypot] = useState(false);
  const [hiddenOwner, setHiddenOwner] = useState(false);
  const [tradingCooldown, setTradingCooldown] = useState(false);
  const [maxTax, setMaxTax] = useState(false);
  const [anitWhale, setAnitWhale] = useState(false);
  const [blacklist, setBlacklist] = useState(false);
  const [buyTax, setBuyTax] = useState(0);
  const [sellTax, setSellTax] = useState(0);
  const [maxTransaction, setMaxTransaction] = useState(false);
  const [canTakeOwnership, setCanTakeOwnership] = useState(false);
  const [externalCall, setExternalCall] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [proxyCheck, setProxyCheck] = useState(false);
  const [antiBot, setAntiBot] = useState(false);
  const [mint, setMint] = useState(false);
  const [enableTrading, setEnableTrading] = useState(false);
  const [cannotBuy, setCannotBuy] = useState(false);
  const [cannotSell, setCannotSell] = useState(false);
  const [modifyTax, setModifyTax] = useState(false);
  const [whitelist, setWhitelist] = useState(false);
  const [pauseTransfer, setPauseTransfer] = useState(false);
  const [others, setOthers] = useState(false);
  const [enableTradeText, setEnableTradeText] = useState('');
  const [pauseTrade, setPauseTrade] = useState(false);
  const [maxWallet, setMaxWallet] = useState(false);
  
  // Severity
  const [minorFound, setMinorFound] = useState(0);
  const [minorPending, setMinorPending] = useState(0);
  const [minorResolved, setMinorResolved] = useState(0);
  const [mediumFound, setMediumFound] = useState(0);
  const [mediumPending, setMediumPending] = useState(0);
  const [mediumResolved, setMediumResolved] = useState(0);
  const [majorFound, setMajorFound] = useState(0);
  const [majorPending, setMajorPending] = useState(0);
  const [majorResolved, setMajorResolved] = useState(0);
  const [criticalFound, setCriticalFound] = useState(0);
  const [criticalPending, setCriticalPending] = useState(0);
  const [criticalResolved, setCriticalResolved] = useState(0);
  const [infoFound, setInfoFound] = useState(0);
  const [infoPending, setInfoPending] = useState(0);
  const [infoResolved, setInfoResolved] = useState(0);
  
  // Additional
  const [codebase, setCodebase] = useState('');
  const [platform, setPlatform] = useState('Binance Smart Chain');
  const [auditRequest, setAuditRequest] = useState('');
  const [onboarding, setOnboarding] = useState('');
  const [auditPreview, setAuditPreview] = useState('');
  const [auditRelease, setAuditRelease] = useState('');
  const [auditConfidence, setAuditConfidence] = useState('Medium');
  const [auditScore, setAuditScore] = useState(0);
  const [launchpadLink, setLaunchpadLink] = useState('');
  const [published, setPublished] = useState(false);
  const [auditEdition, setAuditEdition] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  
  // Scores
  const [ownerScore, setOwnerScore] = useState(0);
  const [socialScore, setSocialScore] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [auditorScore, setAuditorScore] = useState(0);
  const [auditStatus, setAuditStatus] = useState('');
  
  // KYC
  const [isKYC, setIsKYC] = useState(false);
  const [kycUrl, setKycUrl] = useState('');
  const [kycScore, setKycScore] = useState(0);
  const [kycScoreNotes, setKycScoreNotes] = useState('');
  
  // Token Distribution
  const [tokenDistributionEnabled, setTokenDistributionEnabled] = useState(false);
  const [distributionName1, setDistributionName1] = useState('');
  const [distributionAmount1, setDistributionAmount1] = useState(0);
  const [distributionDescription1, setDistributionDescription1] = useState('');
  const [distributionName2, setDistributionName2] = useState('');
  const [distributionAmount2, setDistributionAmount2] = useState(0);
  const [distributionDescription2, setDistributionDescription2] = useState('');
  const [distributionName3, setDistributionName3] = useState('');
  const [distributionAmount3, setDistributionAmount3] = useState(0);
  const [distributionDescription3, setDistributionDescription3] = useState('');
  const [distributionName4, setDistributionName4] = useState('');
  const [distributionAmount4, setDistributionAmount4] = useState(0);
  const [distributionDescription4, setDistributionDescription4] = useState('');
  const [distributionName5, setDistributionName5] = useState('');
  const [distributionAmount5, setDistributionAmount5] = useState(0);
  const [distributionDescription5, setDistributionDescription5] = useState('');
  const [distributionName6, setDistributionName6] = useState('');
  const [distributionAmount6, setDistributionAmount6] = useState(0);
  const [distributionDescription6, setDistributionDescription6] = useState('');
  
  // SWC Results
  const [swcResults, setSwcResults] = useState<Record<number, { result: string; location: string }>>({});
  
  // Advanced Metadata
  const [isGraph, setIsGraph] = useState(false);
  const [isInheritance, setIsInheritance] = useState(false);
  const [isEVMContract, setIsEVMContract] = useState(true);
  const [isSolana, setIsSolana] = useState(false);
  const [isNFT, setIsNFT] = useState(false);
  const [isToken, setIsToken] = useState(true);
  const [isStaking, setIsStaking] = useState(false);
  const [isOther, setIsOther] = useState(false);
  
  // PDF Generation Toggles (Control what sections appear in PDF)
  const [enableSummary, setEnableSummary] = useState(true);
  const [enableSimulation, setEnableSimulation] = useState(false);
  const [enableOnlyOwner, setEnableOnlyOwner] = useState(false);
  const [enableTradeCheck, setEnableTradeCheck] = useState(false);
  const [isFlat, setIsFlat] = useState('No');
  const [isReentrant, setIsReentrant] = useState(false);
  
  // CFG Findings (for FindingsManager - array format)
  const [cfgFindings, setCfgFindings] = useState<Finding[]>([]);

  // Helper functions for SWC results
  const setSwcResult = (swcNum: number, value: string) => {
    setSwcResults(prev => ({
      ...prev,
      [swcNum]: { ...prev[swcNum], result: value }
    }));
  };

  const setSwcLocation = (swcNum: number, value: string) => {
    setSwcResults(prev => ({
      ...prev,
      [swcNum]: { ...prev[swcNum], location: value }
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin');
      return;
    }
    
    // Load blockchains list
    loadBlockchains();
    
    if (!isNew) {
      loadProject();
    }
  }, []);

  const loadBlockchains = async () => {
    try {
      const response = await blockchainsAPI.getList();
      if (response.data && response.data.blockchains) {
        setBlockchains(response.data.blockchains);
      }
    } catch (error) {
      console.error('Failed to load blockchains:', error);
      // Set fallback list if API fails
      setBlockchains([
        { name: 'Binance Smart Chain', symbol: 'BSC', slug: 'binance-smart-chain' },
        { name: 'Ethereum', symbol: 'ETH', slug: 'ethereum' },
        { name: 'Polygon', symbol: 'MATIC', slug: 'polygon' },
        { name: 'Solana', symbol: 'SOL', slug: 'solana' },
        { name: 'Avalanche', symbol: 'AVAX', slug: 'avalanche' },
        { name: 'Arbitrum', symbol: 'ARB', slug: 'arbitrum' },
        { name: 'Optimism', symbol: 'OP', slug: 'optimism' }
      ]);
    }
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getById(params.id as string);
      const project: Project = response.data;
      
  // Defensive: use default empty objects for socials and timeline
  const socials = project.socials || {};
  const timeline = project.timeline || {};
  const contract_info = project.contract_info || {};
  const overview = project.overview || {};
  const minor = project.minor || {};
  const medium = project.medium || {};
  const major = project.major || {};
  const critical = project.critical || {};
  const informational = project.informational || {};

  // Basic Info
  setName(project.name);
  setSymbol(project.symbol);
  setDecimals(project.decimals);
  setSupply(project.supply);
  setDescription(project.description);
  setLogo(project.logo || '');
  setLaunchpad(project.launchpad || '');
  setSlug(project.slug);
  setAuditPdf(project.audit_pdf || '');

  // Socials
  setTelegram(socials.telegram || '');
  setTwitter(socials.twitter || '');
  setWebsite(socials.website || '');
  setGithub(socials.github || '');
  setFacebook(socials.facebook || '');
  setInstagram(socials.instagram || '');
  setReddit(socials.reddit || '');
  setCmc(socials.cmc || '');
  setCg(socials.cg || '');
  setTrustblock(socials.trustblock || '');

  // Contract Info
  setContractName(contract_info.contract_name || '');
  setContractLanguage(contract_info.contract_language || 'Solidity');
  setContractOwner(contract_info.contract_owner || '');
  setContractDeployer(contract_info.contract_deployer || '');
  setContractAddress(contract_info.contract_address || '');
  setContractCreated(contract_info.contract_created || '');
  setContractVerified(contract_info.contract_verified);
  setContractCompiler(contract_info.contract_compiler || '');
  setContractLicense(contract_info.contract_license || 'No License (None)');

  // Overview
  setLive(project.live);
  setHoneypot(overview.honeypot);
  setHiddenOwner(overview.hidden_owner);
  setTradingCooldown(overview.trading_cooldown);
  setMaxTax(overview.max_tax);
  setAnitWhale(overview.anit_whale);
  setBlacklist(overview.blacklist);
  setBuyTax(overview.buy_tax);
  setSellTax(overview.sell_tax);
  setMaxTransaction(overview.max_transaction);
  setCanTakeOwnership(overview.can_take_ownership);
  setExternalCall(overview.external_call);
  setSelfDestruct(overview.self_destruct);
  setProxyCheck(overview.proxy_check);
  setAntiBot(overview.anti_bot);
  setMint(overview.mint);
  setEnableTrading(overview.enable_trading);
  setCannotBuy(overview.cannot_buy);
  setCannotSell(overview.cannot_sell);
  setModifyTax(overview.modify_tax);
  setWhitelist(overview.whitelist);
  setPauseTransfer(overview.pause_transfer);
  setOthers(overview.others);
  setEnableTradeText(overview.enable_trade_text || '');
  setPauseTrade(overview.pause_trade);
  setMaxWallet(overview.max_wallet);

  // Severity
  setMinorFound(minor.found);
  setMinorPending(minor.pending);
  setMinorResolved(minor.resolved);
  setMediumFound(medium.found);
  setMediumPending(medium.pending);
  setMediumResolved(medium.resolved);
  setMajorFound(major.found);
  setMajorPending(major.pending);
  setMajorResolved(major.resolved);
  setCriticalFound(critical.found);
  setCriticalPending(critical.pending);
  setCriticalResolved(critical.resolved);
  setInfoFound(informational.found);
  setInfoPending(informational.pending);
  setInfoResolved(informational.resolved);

  // Additional
  setCodebase(project.codebase || '');
  setPlatform(project.platform || 'Binance Smart Chain');
  setAuditRequest(timeline.audit_request || '');
  setOnboarding(timeline.onboarding_process || '');
  setAuditScore(project.audit_score);
  setLaunchpadLink(project.launchpad_link || '');
  setPublished(project.published);
  setAuditEdition(project.auditEdition || '');
  setPaymentHash(project.paymentHash || '');

  // Scores
  setOwnerScore((project as any).ownerScore || 0);
  setSocialScore((project as any).socialScore || 0);
  setSecurityScore((project as any).securityScore || 0);
  setAuditorScore((project as any).auditorScore || 0);
  setAuditStatus((project as any).auditStatus || '');

  // KYC
  setIsKYC((project as any).isKYC || false);
  setKycUrl((project as any).kycUrl || '');
  setKycScore((project as any).kycScore || 0);
  setKycScoreNotes((project as any).kycScoreNotes || '');

  // Token Distribution
  setTokenDistributionEnabled((project as any).tokenDistributionEnabled || false);
  setDistributionName1((project as any).distributionName1 || '');
  setDistributionAmount1((project as any).distributionAmount1 || 0);
  setDistributionDescription1((project as any).distributionDescription1 || '');
  setDistributionName2((project as any).distributionName2 || '');
  setDistributionAmount2((project as any).distributionAmount2 || 0);
  setDistributionDescription2((project as any).distributionDescription2 || '');
  setDistributionName3((project as any).distributionName3 || '');
  setDistributionAmount3((project as any).distributionAmount3 || 0);
  setDistributionDescription3((project as any).distributionDescription3 || '');
  setDistributionName4((project as any).distributionName4 || '');
  setDistributionAmount4((project as any).distributionAmount4 || 0);
  setDistributionDescription4((project as any).distributionDescription4 || '');
  setDistributionName5((project as any).distributionName5 || '');
  setDistributionAmount5((project as any).distributionAmount5 || 0);
  setDistributionDescription5((project as any).distributionDescription5 || '');
  setDistributionName6((project as any).distributionName6 || '');
  setDistributionAmount6((project as any).distributionAmount6 || 0);
  setDistributionDescription6((project as any).distributionDescription6 || '');

  // SWC Results
  setSwcResults((project as any).swcResults || {});

  // Advanced Metadata
  setIsGraph((project as any).isGraph || false);
  setIsInheritance((project as any).isInheritance || false);
  setIsEVMContract((project as any).isEVMContract !== undefined ? (project as any).isEVMContract : true);
  setIsSolana((project as any).isSolana || false);
  setIsNFT((project as any).isNFT || false);
  setIsToken((project as any).isToken !== undefined ? (project as any).isToken : true);
  setIsStaking((project as any).isStaking || false);
  setIsOther((project as any).isOther || false);
  
  // PDF Generation Toggles
  setEnableSummary((project as any).enableSummary !== undefined ? (project as any).enableSummary : true);
  setEnableSimulation((project as any).enableSimulation || false);
  setEnableOnlyOwner((project as any).enableOnlyOwner || false);
  setEnableTradeCheck((project as any).enableTradeCheck || false);
  setIsFlat((project as any).isFlat || 'No');
  setIsReentrant((project as any).isReentrant || false);

  // Load CFG Findings - default to Pass if not set
  setCfgFindings(project.cfg_findings || []);
    } catch (error) {
      console.error('Failed to load project:', error);
      router.push('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlug = async () => {
    if (!name) return;
    try {
      const response = await projectsAPI.generateSlug(name);
      setSlug(response.data.slug);
    } catch (error) {
      console.error('Failed to generate slug:', error);
    }
  };

  const handleFetchGoPlus = async () => {
    if (isNew) {
      alert('Please save the project first before fetching GoPlus data');
      return;
    }
    
    if (!contractAddress) {
      alert('Contract address is required to fetch GoPlus security data');
      return;
    }
    
    setFetchingGoPlus(true);
    setGoPlusMessage('Fetching security data from GoPlus Labs...');
    
    try {
      const response = await projectsAPI.fetchGoPlus(params.id as string);
      
      if (response.data.success) {
        setGoPlusMessage('✓ GoPlus data fetched successfully! Reloading project...');
        
        // Update the form with fetched data
        const overview = response.data.overview;
        setHoneypot(overview.honeypot || false);
        setMint(overview.mint || false);
        setMaxTax(overview.max_tax || false);
        setMaxTransaction(overview.max_transaction || false);
        setMaxWallet(overview.max_wallet || false);
        setEnableTrading(overview.enable_trading || false);
        setModifyTax(overview.modify_tax || false);
        setTradingCooldown(overview.trading_cooldown || false);
        setPauseTransfer(overview.pause_transfer || false);
        setPauseTrade(overview.pause_trade || false);
        setAntiBot(overview.anti_bot || false);
        setAnitWhale(overview.anit_whale || false);
        setProxyCheck(overview.proxy_check || false);
        setBlacklist(overview.blacklist || false);
        setHiddenOwner(overview.hidden_owner || false);
        setBuyTax(overview.buy_tax || 0);
        setSellTax(overview.sell_tax || 0);
        setSelfDestruct(overview.self_destruct || false);
        setWhitelist(overview.whitelist || false);
        setExternalCall(overview.external_call || false);
        setCannotBuy(overview.cannot_buy || false);
        setCannotSell(overview.cannot_sell || false);
        setCanTakeOwnership(overview.can_take_ownership || false);
        
        setTimeout(() => {
          setGoPlusMessage('');
        }, 5000);
      } else {
        setGoPlusMessage('✗ Failed to fetch GoPlus data: ' + response.data.error);
      }
    } catch (error: any) {
      console.error('Failed to fetch GoPlus data:', error);
      setGoPlusMessage('✗ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setFetchingGoPlus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const projectData = {
      name,
      symbol,
      decimals,
      supply,
      description,
      logo,
      launchpad,
      slug,
      audit_pdf: auditPdf,
      socials: {
        telegram,
        twitter,
        website,
        github,
        facebook,
        instagram,
        reddit,
        cmc,
        cg,
        trustblock,
      },
      contract_info: {
        contract_name: contractName,
        contract_language: contractLanguage,
        contract_owner: contractOwner,
        contract_deployer: contractDeployer,
        contract_address: contractAddress,
        contract_created: contractCreated,
        contract_verified: contractVerified,
        contract_compiler: contractCompiler,
        contract_license: contractLicense,
      },
      live,
      overview: {
        honeypot,
        hidden_owner: hiddenOwner,
        trading_cooldown: tradingCooldown,
        max_tax: maxTax,
        anit_whale: anitWhale,
        blacklist,
        buy_tax: buyTax,
        sell_tax: sellTax,
        max_transaction: maxTransaction,
        can_take_ownership: canTakeOwnership,
        external_call: externalCall,
        self_destruct: selfDestruct,
        proxy_check: proxyCheck,
        anti_bot: antiBot,
        mint,
        enable_trading: enableTrading,
        cannot_buy: cannotBuy,
        cannot_sell: cannotSell,
        modify_tax: modifyTax,
        whitelist,
        pause_transfer: pauseTransfer,
        others,
        enable_trade_text: enableTradeText,
        pause_trade: pauseTrade,
        max_wallet: maxWallet,
      },
      minor: {
        found: minorFound,
        pending: minorPending,
        resolved: minorResolved,
      },
      medium: {
        found: mediumFound,
        pending: mediumPending,
        resolved: mediumResolved,
      },
      major: {
        found: majorFound,
        pending: majorPending,
        resolved: majorResolved,
      },
      critical: {
        found: criticalFound,
        pending: criticalPending,
        resolved: criticalResolved,
      },
      informational: {
        found: infoFound,
        pending: infoPending,
        resolved: infoResolved,
      },
      codebase,
      platform,
      timeline: {
        audit_request: auditRequest,
        onboarding_process: onboarding,
        audit_preview: auditPreview,
        audit_release: auditRelease,
      },
      audit_confidence: auditConfidence,
      audit_score: auditScore,
      launchpad_link: launchpadLink,
      published,
      cfg_findings: cfgFindings,
      score_history: {
        data: [auditScore],
        current: auditScore,
      },
      auditToolVersion: AUDIT_TOOL_VERSION,
      auditEdition,
      paymentHash,
      ownerScore,
      socialScore,
      securityScore,
      auditorScore,
      auditStatus,
      isKYC,
      kycUrl,
      kycScore,
      kycScoreNotes,
      tokenDistributionEnabled,
      distributionName1,
      distributionAmount1,
      distributionDescription1,
      distributionName2,
      distributionAmount2,
      distributionDescription2,
      distributionName3,
      distributionAmount3,
      distributionDescription3,
      distributionName4,
      distributionAmount4,
      distributionDescription4,
      distributionName5,
      distributionAmount5,
      distributionDescription5,
      distributionName6,
      distributionAmount6,
      distributionDescription6,
      swcResults,
      isGraph,
      isInheritance,
      isEVMContract,
      isSolana,
      isNFT,
      isToken,
      isStaking,
      isOther,
      // PDF Generation Toggles
      enableSummary,
      enableSWCSummary: false, // DEPRECATED - Always false, SWC checks removed
      enableSimulation,
      enableOnlyOwner,
      enableTradeCheck,
      isFlat,
      isReentrant,
    };

    try {
      if (isNew) {
        await projectsAPI.create(projectData);
      } else {
        await projectsAPI.update(params.id as string, projectData);
      }
      router.push('/admin/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="extra-large" label="Loading project..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.header}>
        <Text style={{ fontSize: '2rem', fontWeight: '700' }}>
          {isNew ? 'Create New Project' : `Edit: ${name}`}
        </Text>
        <Text>API ID: {slug || 'project'}</Text>
      </Card>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Information */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Basic Information</Text>
          <div className={styles.grid}>
            <Field label="Name *" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Symbol *" required>
              <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
            </Field>
            <Field label="Decimals *" required>
              <Input
                type="number"
                value={decimals.toString()}
                onChange={(e) => setDecimals(parseInt(e.target.value) || 0)}
                required
              />
            </Field>
            <Field label="Supply *" required>
              <Input value={supply} onChange={(e) => setSupply(e.target.value)} required />
            </Field>
            <Field label="Slug *" required className={styles.gridFull}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <Button type="button" onClick={handleGenerateSlug}>
                  Regenerate
                </Button>
              </div>
            </Field>
            <Field label="Description *" required className={styles.gridFull}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </Field>
            <Field label="Logo URL">
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} />
            </Field>
            <Field label="Launchpad">
              <Input value={launchpad} onChange={(e) => setLaunchpad(e.target.value)} />
            </Field>
            <Field label="Audit PDF URL">
              <Input value={auditPdf} onChange={(e) => setAuditPdf(e.target.value)} />
            </Field>
            <Field label="Launchpad Link">
              <Input value={launchpadLink} onChange={(e) => setLaunchpadLink(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* Socials */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Social Links</Text>
          <div className={styles.grid}>
            <Field label="Telegram">
              <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} />
            </Field>
            <Field label="Twitter">
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </Field>
            <Field label="GitHub">
              <Input value={github} onChange={(e) => setGithub(e.target.value)} />
            </Field>
            <Field label="Facebook">
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            </Field>
            <Field label="Instagram">
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </Field>
            <Field label="Reddit">
              <Input value={reddit} onChange={(e) => setReddit(e.target.value)} />
            </Field>
            <Field label="CoinMarketCap">
              <Input value={cmc} onChange={(e) => setCmc(e.target.value)} />
            </Field>
            <Field label="CoinGecko">
              <Input value={cg} onChange={(e) => setCg(e.target.value)} />
            </Field>
            <Field label="TrustBlock URL" className={styles.gridFull}>
              <Input 
                value={trustblock} 
                onChange={(e) => setTrustblock(e.target.value)}
                placeholder="https://app.trustblock.run/project/..."
              />
            </Field>
          </div>
        </Card>

        {/* Contract Information */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Contract Information</Text>
          <div className={styles.grid}>
            <Field label="Contract Name">
              <Input value={contractName} onChange={(e) => setContractName(e.target.value)} />
            </Field>
            <Field label="Contract Language">
              <Input value={contractLanguage} onChange={(e) => setContractLanguage(e.target.value)} />
            </Field>
            <Field label="Contract Owner" className={styles.gridFull}>
              <Input value={contractOwner} onChange={(e) => setContractOwner(e.target.value)} />
            </Field>
            <Field label="Contract Deployer" className={styles.gridFull}>
              <Input value={contractDeployer} onChange={(e) => setContractDeployer(e.target.value)} />
            </Field>
            <Field label="Contract Address" className={styles.gridFull}>
              <Input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
            </Field>
            <Field label="Contract Created (MM/DD/YYYY)">
              <Input value={contractCreated} onChange={(e) => setContractCreated(e.target.value)} />
            </Field>
            <Field label="Contract Compiler">
              <Input value={contractCompiler} onChange={(e) => setContractCompiler(e.target.value)} />
            </Field>
            <Field label="Contract License">
              <Input value={contractLicense} onChange={(e) => setContractLicense(e.target.value)} />
            </Field>
            <Field label="Contract Verified">
              <Switch checked={contractVerified} onChange={(e) => setContractVerified(e.currentTarget.checked)} />
            </Field>
          </div>
        </Card>

        {/* Overview / Risk Assessment */}
        <Card className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Text className={styles.sectionTitle}>Overview / Risk Assessment</Text>
            {!isNew && contractAddress && (
              <Button 
                appearance="primary" 
                onClick={handleFetchGoPlus}
                disabled={fetchingGoPlus}
              >
                {fetchingGoPlus ? 'Fetching...' : 'Fetch GoPlus Security Data'}
              </Button>
            )}
          </div>
          {goPlusMessage && (
            <div style={{ 
              padding: '12px', 
              marginBottom: '16px', 
              background: goPlusMessage.includes('✓') ? '#e6f7e6' : '#ffe6e6',
              color: goPlusMessage.includes('✓') ? '#0a5c0a' : '#c00',
              borderRadius: '8px',
              border: `1px solid ${goPlusMessage.includes('✓') ? '#0a5c0a' : '#c00'}`
            }}>
              {goPlusMessage}
            </div>
          )}
          <div style={{ 
            padding: '12px', 
            marginBottom: '16px', 
            background: '#e6f3ff',
            color: '#004085',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <strong>Note:</strong> When you flag a project as "Live", the system will automatically fetch real-time security data from GoPlus Labs API and update all risk assessment fields below. You can also manually fetch this data using the button above.
          </div>
          <div className={styles.grid}>
            <Field label="Live">
              <Switch checked={live} onChange={(e) => setLive(e.currentTarget.checked)} />
            </Field>
            <Field label="Honeypot">
              <Switch checked={honeypot} onChange={(e) => setHoneypot(e.currentTarget.checked)} />
            </Field>
            <Field label="Hidden Owner">
              <Switch checked={hiddenOwner} onChange={(e) => setHiddenOwner(e.currentTarget.checked)} />
            </Field>
            <Field label="Trading Cooldown">
              <Switch checked={tradingCooldown} onChange={(e) => setTradingCooldown(e.currentTarget.checked)} />
            </Field>
            <Field label="Max Tax">
              <Switch checked={maxTax} onChange={(e) => setMaxTax(e.currentTarget.checked)} />
            </Field>
            <Field label="Anti Whale">
              <Switch checked={anitWhale} onChange={(e) => setAnitWhale(e.currentTarget.checked)} />
            </Field>
            <Field label="Blacklist">
              <Switch checked={blacklist} onChange={(e) => setBlacklist(e.currentTarget.checked)} />
            </Field>
            <Field label="Max Transaction">
              <Switch checked={maxTransaction} onChange={(e) => setMaxTransaction(e.currentTarget.checked)} />
            </Field>
            <Field label="Can Take Ownership">
              <Switch checked={canTakeOwnership} onChange={(e) => setCanTakeOwnership(e.currentTarget.checked)} />
            </Field>
            <Field label="External Call">
              <Switch checked={externalCall} onChange={(e) => setExternalCall(e.currentTarget.checked)} />
            </Field>
            <Field label="Self Destruct">
              <Switch checked={selfDestruct} onChange={(e) => setSelfDestruct(e.currentTarget.checked)} />
            </Field>
            <Field label="Proxy Check">
              <Switch checked={proxyCheck} onChange={(e) => setProxyCheck(e.currentTarget.checked)} />
            </Field>
            <Field label="Anti Bot">
              <Switch checked={antiBot} onChange={(e) => setAntiBot(e.currentTarget.checked)} />
            </Field>
            <Field label="Mint">
              <Switch checked={mint} onChange={(e) => setMint(e.currentTarget.checked)} />
            </Field>
            <Field label="Enable Trading">
              <Switch checked={enableTrading} onChange={(e) => setEnableTrading(e.currentTarget.checked)} />
            </Field>
            <Field label="Cannot Buy">
              <Switch checked={cannotBuy} onChange={(e) => setCannotBuy(e.currentTarget.checked)} />
            </Field>
            <Field label="Cannot Sell">
              <Switch checked={cannotSell} onChange={(e) => setCannotSell(e.currentTarget.checked)} />
            </Field>
            <Field label="Modify Tax">
              <Switch checked={modifyTax} onChange={(e) => setModifyTax(e.currentTarget.checked)} />
            </Field>
            <Field label="Whitelist">
              <Switch checked={whitelist} onChange={(e) => setWhitelist(e.currentTarget.checked)} />
            </Field>
            <Field label="Pause Transfer">
              <Switch checked={pauseTransfer} onChange={(e) => setPauseTransfer(e.currentTarget.checked)} />
            </Field>
            <Field label="Others">
              <Switch checked={others} onChange={(e) => setOthers(e.currentTarget.checked)} />
            </Field>
            <Field label="Pause Trade">
              <Switch checked={pauseTrade} onChange={(e) => setPauseTrade(e.currentTarget.checked)} />
            </Field>
            <Field label="Max Wallet">
              <Switch checked={maxWallet} onChange={(e) => setMaxWallet(e.currentTarget.checked)} />
            </Field>
            <Field label="Buy Tax (%)">
              <Input
                type="number"
                value={buyTax.toString()}
                onChange={(e) => setBuyTax(parseInt(e.target.value) || 0)}
              />
            </Field>
            <Field label="Sell Tax (%)">
              <Input
                type="number"
                value={sellTax.toString()}
                onChange={(e) => setSellTax(parseInt(e.target.value) || 0)}
              />
            </Field>
            <Field label="Enable Trade Text" className={styles.gridFull}>
              <Input value={enableTradeText} onChange={(e) => setEnableTradeText(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* CFG Findings - Detailed Management */}
        <Card className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Text className={styles.sectionTitle}>CFG Findings (Detailed)</Text>
            <Button
              appearance="primary"
              icon={<DocumentPdfRegular />}
              onClick={async () => {
                // Build current project data for PDF generation
                const currentProjectData = {
                  name,
                  symbol,
                  decimals,
                  supply,
                  description,
                  slug,
                  logo,
                  platform: platform || 'Binance Smart Chain',
                  audit_score: auditScore,
                  audit_confidence: auditConfidence,
                  published,
                  contract_info: { 
                    contract_address: contractAddress,
                    contract_compiler: contractCompiler,
                    contract_license: contractLicense
                  },
                  overview: {
                    honeypot,
                    hidden_owner: hiddenOwner,
                    mint,
                    blacklist,
                    whitelist,
                    proxy_check: proxyCheck,
                    buy_tax: buyTax,
                    sell_tax: sellTax,
                  },
                  socials: { website, telegram, twitter, github },
                  cfg_findings: cfgFindings,
                  critical: { found: criticalFound, pending: criticalPending, resolved: criticalResolved },
                  major: { found: majorFound, pending: majorPending, resolved: majorResolved },
                  medium: { found: mediumFound, pending: mediumPending, resolved: mediumResolved },
                  minor: { found: minorFound, pending: minorPending, resolved: minorResolved },
                  informational: { found: infoFound, pending: infoPending, resolved: infoResolved },
                } as Project;
                await generateEnhancedAuditPDF(currentProjectData);
              }}
            >
              Generate PDF Report
            </Button>
          </div>
          <FindingsManager 
            findings={cfgFindings}
            onChange={setCfgFindings}
          />
        </Card>

        {/* Findings Summary (Counts) */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Findings Summary (Counts)</Text>
          
          <Text weight="semibold" style={{ marginTop: '16px', marginBottom: '8px' }}>Minor</Text>
          <div className={styles.grid}>
            <Field label="Found">
              <Input type="number" value={minorFound.toString()} onChange={(e) => setMinorFound(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Pending">
              <Input type="number" value={minorPending.toString()} onChange={(e) => setMinorPending(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Resolved">
              <Input type="number" value={minorResolved.toString()} onChange={(e) => setMinorResolved(parseInt(e.target.value) || 0)} />
            </Field>
          </div>

          <Text weight="semibold" style={{ marginTop: '16px', marginBottom: '8px' }}>Medium</Text>
          <div className={styles.grid}>
            <Field label="Found">
              <Input type="number" value={mediumFound.toString()} onChange={(e) => setMediumFound(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Pending">
              <Input type="number" value={mediumPending.toString()} onChange={(e) => setMediumPending(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Resolved">
              <Input type="number" value={mediumResolved.toString()} onChange={(e) => setMediumResolved(parseInt(e.target.value) || 0)} />
            </Field>
          </div>

          <Text weight="semibold" style={{ marginTop: '16px', marginBottom: '8px' }}>Major</Text>
          <div className={styles.grid}>
            <Field label="Found">
              <Input type="number" value={majorFound.toString()} onChange={(e) => setMajorFound(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Pending">
              <Input type="number" value={majorPending.toString()} onChange={(e) => setMajorPending(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Resolved">
              <Input type="number" value={majorResolved.toString()} onChange={(e) => setMajorResolved(parseInt(e.target.value) || 0)} />
            </Field>
          </div>

          <Text weight="semibold" style={{ marginTop: '16px', marginBottom: '8px' }}>Critical</Text>
          <div className={styles.grid}>
            <Field label="Found">
              <Input type="number" value={criticalFound.toString()} onChange={(e) => setCriticalFound(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Pending">
              <Input type="number" value={criticalPending.toString()} onChange={(e) => setCriticalPending(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Resolved">
              <Input type="number" value={criticalResolved.toString()} onChange={(e) => setCriticalResolved(parseInt(e.target.value) || 0)} />
            </Field>
          </div>

          <Text weight="semibold" style={{ marginTop: '16px', marginBottom: '8px' }}>Informational</Text>
          <div className={styles.grid}>
            <Field label="Found">
              <Input type="number" value={infoFound.toString()} onChange={(e) => setInfoFound(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Pending">
              <Input type="number" value={infoPending.toString()} onChange={(e) => setInfoPending(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Resolved">
              <Input type="number" value={infoResolved.toString()} onChange={(e) => setInfoResolved(parseInt(e.target.value) || 0)} />
            </Field>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Additional Information</Text>
          <div className={styles.grid}>
            <Field label="Audit Tool Version">
              <Input value={AUDIT_TOOL_VERSION} disabled />
              <Text size={200} style={{ color: '#666', marginTop: '4px' }}>Auto-set based on current build</Text>
            </Field>
            <Field label="Audit Edition">
              <Input value={auditEdition} onChange={(e) => setAuditEdition(e.target.value)} />
            </Field>
            <Field label="Payment Hash">
              <Input value={paymentHash} onChange={(e) => setPaymentHash(e.target.value)} />
            </Field>
            <Field label="Platform / Blockchain">
              <select 
                value={platform} 
                onChange={(e) => setPlatform(e.target.value)} 
                style={{ 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc', 
                  width: '100%',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Blockchain...</option>
                {blockchains.map((blockchain) => (
                  <option key={blockchain.slug} value={blockchain.name}>
                    {blockchain.name} ({blockchain.symbol})
                  </option>
                ))}
              </select>
              <Text size={200} style={{ color: '#666', marginTop: '4px' }}>
                Fetched from CoinMarketCap API
              </Text>
            </Field>
            <Field label="Audit Score (0-100)">
              <Input type="number" value={auditScore.toString()} onChange={(e) => setAuditScore(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Audit Confidence">
              <select value={auditConfidence} onChange={(e) => setAuditConfidence(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
            <Field label="Codebase URL" className={styles.gridFull}>
              <Input value={codebase} onChange={(e) => setCodebase(e.target.value)} />
            </Field>
            <Field label="Owner Score">
              <Input type="number" value={ownerScore?.toString() || ''} onChange={(e) => setOwnerScore(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Social Score">
              <Input type="number" value={socialScore?.toString() || ''} onChange={(e) => setSocialScore(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Security Score">
              <Input type="number" value={securityScore?.toString() || ''} onChange={(e) => setSecurityScore(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Auditor Score">
              <Input type="number" value={auditorScore?.toString() || ''} onChange={(e) => setAuditorScore(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Audit Status">
              <Input value={auditStatus || ''} onChange={(e) => setAuditStatus(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* KYC Section */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>KYC Information</Text>
          <div className={styles.grid}>
            <Field label="KYC Verified">
              <Switch checked={isKYC} onChange={(e) => setIsKYC(e.currentTarget.checked)} />
            </Field>
            <Field label="KYC URL">
              <Input value={kycUrl || ''} onChange={(e) => setKycUrl(e.target.value)} />
            </Field>
            <Field label="KYC Score">
              <Input type="number" value={kycScore?.toString() || ''} onChange={(e) => setKycScore(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="KYC Score Notes">
              <Textarea value={kycScoreNotes || ''} onChange={(e) => setKycScoreNotes(e.target.value)} rows={2} />
            </Field>
          </div>
        </Card>

        {/* Token Distribution Section */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Token Distribution</Text>
          <div className={styles.grid}>
            <Field label="Token Distribution Enabled">
              <Switch checked={tokenDistributionEnabled} onChange={(e) => setTokenDistributionEnabled(e.currentTarget.checked)} />
            </Field>
            <Field label="Distribution Name 1">
              <Input value={distributionName1 || ''} onChange={(e) => setDistributionName1(e.target.value)} />
            </Field>
            <Field label="Distribution Amount 1">
              <Input type="number" value={distributionAmount1?.toString() || ''} onChange={(e) => setDistributionAmount1(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distribution Description 1">
              <Input value={distributionDescription1 || ''} onChange={(e) => setDistributionDescription1(e.target.value)} />
            </Field>
            <Field label="Distribution Name 2">
              <Input value={distributionName2 || ''} onChange={(e) => setDistributionName2(e.target.value)} />
            </Field>
            <Field label="Distribution Amount 2">
              <Input type="number" value={distributionAmount2?.toString() || ''} onChange={(e) => setDistributionAmount2(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distribution Description 2">
              <Input value={distributionDescription2 || ''} onChange={(e) => setDistributionDescription2(e.target.value)} />
            </Field>
            <Field label="Distribution Name 3">
              <Input value={distributionName3 || ''} onChange={(e) => setDistributionName3(e.target.value)} />
            </Field>
            <Field label="Distribution Amount 3">
              <Input type="number" value={distributionAmount3?.toString() || ''} onChange={(e) => setDistributionAmount3(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distribution Description 3">
              <Input value={distributionDescription3 || ''} onChange={(e) => setDistributionDescription3(e.target.value)} />
            </Field>
            <Field label="Distribution Name 4">
              <Input value={distributionName4 || ''} onChange={(e) => setDistributionName4(e.target.value)} />
            </Field>
            <Field label="Distribution Amount 4">
              <Input type="number" value={distributionAmount4?.toString() || ''} onChange={(e) => setDistributionAmount4(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distribution Description 4">
              <Input value={distributionDescription4 || ''} onChange={(e) => setDistributionDescription4(e.target.value)} />
            </Field>
            <Field label="Distribution Name 5">
              <Input value={distributionName5 || ''} onChange={(e) => setDistributionName5(e.target.value)} />
            </Field>
            <Field label="Distribution Amount 5">
              <Input type="number" value={distributionAmount5?.toString() || ''} onChange={(e) => setDistributionAmount5(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distribution Description 5">
              <Input value={distributionDescription5 || ''} onChange={(e) => setDistributionDescription5(e.target.value)} />
            </Field>
            <Field label="Distribution Name 6">
              <Input value={distributionName6 || ''} onChange={(e) => setDistributionName6(e.target.value)} />
            </Field>
            <Field label="Distribution Amount 6">
              <Input type="number" value={distributionAmount6?.toString() || ''} onChange={(e) => setDistributionAmount6(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distribution Description 6">
              <Input value={distributionDescription6 || ''} onChange={(e) => setDistributionDescription6(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* SWC Checks Section */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>SWC Checks</Text>
          <div className={styles.grid}>
            {[...Array(37)].map((_, i) => {
              const swcNum = 100 + i;
              return (
                <React.Fragment key={`swc${swcNum}`}>
                  <Field label={`SWC${swcNum} Result`}>
                    <Input value={swcResults[swcNum]?.result || ''} onChange={(e) => setSwcResult(swcNum, e.target.value)} />
                  </Field>
                  <Field label={`SWC${swcNum} Location`}>
                    <Input value={swcResults[swcNum]?.location || ''} onChange={(e) => setSwcLocation(swcNum, e.target.value)} />
                  </Field>
                </React.Fragment>
              );
            })}
          </div>
        </Card>

        {/* Advanced Metadata Section */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Advanced Metadata</Text>
          <div className={styles.grid}>
            <Field label="Is Graph">
              <Switch checked={isGraph} onChange={(e) => setIsGraph(e.currentTarget.checked)} />
            </Field>
            <Field label="Is Inheritance">
              <Switch checked={isInheritance} onChange={(e) => setIsInheritance(e.currentTarget.checked)} />
            </Field>
            <Field label="Is EVM Contract">
              <Switch checked={isEVMContract} onChange={(e) => setIsEVMContract(e.currentTarget.checked)} />
            </Field>
            <Field label="Is Solana">
              <Switch checked={isSolana} onChange={(e) => setIsSolana(e.currentTarget.checked)} />
            </Field>
            <Field label="Is NFT">
              <Switch checked={isNFT} onChange={(e) => setIsNFT(e.currentTarget.checked)} />
            </Field>
            <Field label="Is Token">
              <Switch checked={isToken} onChange={(e) => setIsToken(e.currentTarget.checked)} />
            </Field>
            <Field label="Is Staking">
              <Switch checked={isStaking} onChange={(e) => setIsStaking(e.currentTarget.checked)} />
            </Field>
            <Field label="Is Other">
              <Switch checked={isOther} onChange={(e) => setIsOther(e.currentTarget.checked)} />
            </Field>
          </div>
        </Card>

        {/* PDF Generation Options Section */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>PDF Generation Options</Text>
          <div className={styles.grid}>
            <Field label="Enable Summary Section" hint="Show Risk Analysis Summary in PDF">
              <Switch checked={enableSummary} onChange={(e) => setEnableSummary(e.currentTarget.checked)} />
            </Field>
            <Field label="Enable Simulation Section" hint="Show simulation/testing section in PDF">
              <Switch checked={enableSimulation} onChange={(e) => setEnableSimulation(e.currentTarget.checked)} />
            </Field>
            <Field label="Enable OnlyOwner Functions" hint="Show privileged functions table in PDF">
              <Switch checked={enableOnlyOwner} onChange={(e) => setEnableOnlyOwner(e.currentTarget.checked)} />
            </Field>
            <Field label="Enable Trade Check Section" hint="Show trading checks in PDF">
              <Switch checked={enableTradeCheck} onChange={(e) => setEnableTradeCheck(e.currentTarget.checked)} />
            </Field>
            <Field label="Is Flattened Contract" hint="Contract source is flattened (Yes/No)">
              <Input value={isFlat} onChange={(e) => setIsFlat(e.target.value)} placeholder="Yes or No" />
            </Field>
            <Field label="Is Reentrant" hint="Contract has reentrancy vulnerability">
              <Switch checked={isReentrant} onChange={(e) => setIsReentrant(e.currentTarget.checked)} />
            </Field>
          </div>
          <Divider style={{ marginTop: '16px', marginBottom: '8px' }} />
          <Text size={200} style={{ color: '#666', fontStyle: 'italic' }}>
            Note: SWC Summary is deprecated and will not appear in PDFs regardless of settings.
          </Text>
        </Card>

        {/* Timeline */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Timeline</Text>
          <div className={styles.grid}>
            <Field label="Audit Request (MM/DD/YYYY)">
              <Input value={auditRequest} onChange={(e) => setAuditRequest(e.target.value)} />
            </Field>
            <Field label="Onboarding Process (MM/DD/YYYY)">
              <Input value={onboarding} onChange={(e) => setOnboarding(e.target.value)} />
            </Field>
            <Field label="Audit Preview (MM/DD/YYYY)">
              <Input value={auditPreview} onChange={(e) => setAuditPreview(e.target.value)} />
            </Field>
            <Field label="Audit Release (MM/DD/YYYY)">
              <Input value={auditRelease} onChange={(e) => setAuditRelease(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* Publishing */}
        <Card className={styles.section}>
          <Text className={styles.sectionTitle}>Publishing</Text>
          <Field label="Publish Project">
            <Switch checked={published} onChange={(e) => setPublished(e.currentTarget.checked)} />
            <Text size={200} style={{ marginLeft: '8px' }}>
              {published ? 'Published - Visible on portal' : 'Draft - Only visible in admin'}
            </Text>
          </Field>
        </Card>

        <Card className={styles.actions}>
          <Button type="button" onClick={() => router.push('/admin/dashboard')}>
            Cancel
          </Button>
          <Button appearance="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Project' : 'Save Changes'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
