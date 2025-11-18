'use client';

import { useState, useEffect } from 'react';
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
import { projectsAPI } from '@/lib/api';
import { Project, Finding } from '@/lib/types';
import FindingsManager from '@/components/FindingsManager';
import { generateEnhancedAuditPDF } from '@/lib/enhancedPdfGenerator';

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
  
  // CFG Findings
  const [cfgFindings, setCfgFindings] = useState<Finding[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin');
      return;
    }
    
    if (!isNew) {
      loadProject();
    }
  }, []);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getById(params.id as string);
      const project: Project = response.data;
      
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
      setTelegram(project.socials.telegram || '');
      setTwitter(project.socials.twitter || '');
      setWebsite(project.socials.website || '');
      setGithub(project.socials.github || '');
      setFacebook(project.socials.facebook || '');
      setInstagram(project.socials.instagram || '');
      setReddit(project.socials.reddit || '');
      setCmc(project.socials.cmc || '');
      setCg(project.socials.cg || '');
      
      // Contract Info
      setContractName(project.contract_info.contract_name || '');
      setContractLanguage(project.contract_info.contract_language || 'Solidity');
      setContractOwner(project.contract_info.contract_owner || '');
      setContractDeployer(project.contract_info.contract_deployer || '');
      setContractAddress(project.contract_info.contract_address || '');
      setContractCreated(project.contract_info.contract_created || '');
      setContractVerified(project.contract_info.contract_verified);
      setContractCompiler(project.contract_info.contract_compiler || '');
      setContractLicense(project.contract_info.contract_license || 'No License (None)');
      
      // Overview
      setLive(project.live);
      setHoneypot(project.overview.honeypot);
      setHiddenOwner(project.overview.hidden_owner);
      setTradingCooldown(project.overview.trading_cooldown);
      setMaxTax(project.overview.max_tax);
      setAnitWhale(project.overview.anit_whale);
      setBlacklist(project.overview.blacklist);
      setBuyTax(project.overview.buy_tax);
      setSellTax(project.overview.sell_tax);
      setMaxTransaction(project.overview.max_transaction);
      setCanTakeOwnership(project.overview.can_take_ownership);
      setExternalCall(project.overview.external_call);
      setSelfDestruct(project.overview.self_destruct);
      setProxyCheck(project.overview.proxy_check);
      setAntiBot(project.overview.anti_bot);
      setMint(project.overview.mint);
      setEnableTrading(project.overview.enable_trading);
      setCannotBuy(project.overview.cannot_buy);
      setCannotSell(project.overview.cannot_sell);
      setModifyTax(project.overview.modify_tax);
      setWhitelist(project.overview.whitelist);
      setPauseTransfer(project.overview.pause_transfer);
      setOthers(project.overview.others);
      setEnableTradeText(project.overview.enable_trade_text || '');
      setPauseTrade(project.overview.pause_trade);
      setMaxWallet(project.overview.max_wallet);
      
      // Severity
      setMinorFound(project.minor.found);
      setMinorPending(project.minor.pending);
      setMinorResolved(project.minor.resolved);
      setMediumFound(project.medium.found);
      setMediumPending(project.medium.pending);
      setMediumResolved(project.medium.resolved);
      setMajorFound(project.major.found);
      setMajorPending(project.major.pending);
      setMajorResolved(project.major.resolved);
      setCriticalFound(project.critical.found);
      setCriticalPending(project.critical.pending);
      setCriticalResolved(project.critical.resolved);
      setInfoFound(project.informational.found);
      setInfoPending(project.informational.pending);
      setInfoResolved(project.informational.resolved);
      
      // Additional
      setCodebase(project.codebase || '');
      setPlatform(project.platform || 'Binance Smart Chain');
      setAuditRequest(project.timeline.audit_request || '');
      setOnboarding(project.timeline.onboarding_process || '');
      setAuditScore(project.audit_score);
      setLaunchpadLink(project.launchpad_link || '');
      setPublished(project.published);
      
      // Load CFG Findings
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
          <Text className={styles.sectionTitle}>Overview / Risk Assessment</Text>
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
            <Field label="Platform">
              <Input value={platform} onChange={(e) => setPlatform(e.target.value)} />
            </Field>
            <Field label="Audit Score (0-100)">
              <Input
                type="number"
                value={auditScore.toString()}
                onChange={(e) => setAuditScore(parseInt(e.target.value) || 0)}
              />
            </Field>
            <Field label="Audit Confidence">
              <select
                value={auditConfidence}
                onChange={(e) => setAuditConfidence(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
            <Field label="Codebase URL" className={styles.gridFull}>
              <Input value={codebase} onChange={(e) => setCodebase(e.target.value)} />
            </Field>
          </div>
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
