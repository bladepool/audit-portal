'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import styles from './project.module.css';

// Helper to format date
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

// Helper to render stars for confidence
function renderStars(confidence: string | number): JSX.Element[] {
  let rating = 3;
  if (typeof confidence === 'string') {
    const confMap: Record<string, number> = {
      'Very High': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Very Low': 1
    };
    rating = confMap[confidence] || 3;
  } else {
    rating = Math.floor(confidence / 20);
  }
  
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
  ));
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getBySlug(params.slug as string);
        setProject(response.data);
        

      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchProject();
    }
  }, [params.slug]);

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'PASS', color: '#22c55e' };
    if (score >= 70) return { label: 'LOW', color: '#3b82f6' };
    return { label: 'FAIL', color: '#ef4444' };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.loading}>
        <p>Project not found</p>
        <button onClick={() => router.push('/')} className={styles.navButton}>
          Back to Home
        </button>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(project.audit_score || 0);
  
  // Calculate vote breakdown
  const secureVotes = Math.floor((project.total_votes || 0) * 0.6);
  const insecureVotes = (project.total_votes || 0) - secureVotes;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo} onClick={() => router.push('/')}>
            <img 
              src="/logo.svg" 
              alt="CFG Ninja" 
              className={styles.logoImage}
            />
          </div>
          <nav className={styles.nav}>
            <button className={styles.navButton} onClick={() => window.open('https://t.me/Bladepool', '_blank')}>
              Request an Audit
            </button>
            <button className={styles.searchButton}>🔍</button>
          </nav>
        </div>
      </header>

      {/* Project Header */}
      <div className={styles.projectHeader}>
        <div className={styles.projectHeaderContent}>
          <img 
            src={project.logo || '/default-logo.png'} 
            alt={project.name}
            className={styles.projectLogo}
          />
          <div className={styles.projectInfo}>
            <div className={styles.projectTitleRow}>
              <h1 className={styles.projectName}>{project.name}</h1>
              <div className={styles.badges}>
                {project.launchpad && (
                  <span className={styles.launchpadBadge}>{project.launchpad}</span>
                )}
                {project.trustblock && (
                  <span className={styles.trustblockBadge}>TrustBlock</span>
                )}
              </div>
            </div>
            {project.symbol && (
              <div className={styles.projectMeta}>
                <span className={styles.symbol}>${project.symbol}</span>
              </div>
            )}
            {project.description && (
              <p className={styles.projectDescription}>{project.description}</p>
            )}
            <div className={styles.heroSocials}>
              {project.socials?.website && (
                <a href={project.socials.website} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                  🌐
                </a>
              )}
              {project.socials?.twitter && (
                <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                  𝕏
                </a>
              )}
              {project.socials?.telegram && (
                <a href={project.socials.telegram} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                  ✈️
                </a>
              )}
              {project.socials?.github && (
                <a href={project.socials.github} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                  💻
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Project Info Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Project Info</h2>
            
            {/* Timeline */}
            <h3 className={styles.sectionTitle}>Timeline</h3>
            <div className={styles.timelineGrid}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Audit Request</div>
                <div className={styles.timelineDate}>{formatDate(project.timeline?.audit_request)}</div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Onboarding Process</div>
                <div className={styles.timelineDate}>{formatDate(project.timeline?.onboarding_process)}</div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Audit Preview</div>
                <div className={styles.timelineDate}>{formatDate(project.timeline?.audit_preview)}</div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Audit Release</div>
                <div className={styles.timelineDate}>{formatDate(project.timeline?.audit_release)}</div>
              </div>
            </div>
          </div>

          {/* Token Analysis Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Token Analysis</h2>
            <div className={styles.analysisGrid}>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Token Name</span>
                <span className={styles.value}>{project.name}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Token Symbol</span>
                <span className={styles.value}>{project.symbol}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Token Address</span>
                <span className={styles.valueAddress}>{project.contract_info?.contract_address ? `${project.contract_info.contract_address.slice(0, 4)}...${project.contract_info.contract_address.slice(-4)}` : 'N/A'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Token Decimals</span>
                <span className={styles.value}>{project.decimals || 18}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Token Total Supply</span>
                <span className={styles.value}>{project.supply ? Number(project.supply).toLocaleString() : 'N/A'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Contract Verified</span>
                <span className={styles.value}>{project.contract_info?.contract_verified ? 'Yes' : 'No'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Platform</span>
                <span className={styles.value}>{project.platform || 'Binance Smart Chain'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Compiler</span>
                <span className={styles.value}>{project.contract_info?.contract_compiler || '-'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Sol License</span>
                <span className={styles.value}>{project.contract_info?.contract_license || 'No License (None)'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Contract Name</span>
                <span className={styles.value}>{project.contract_info?.contract_name || project.name}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Contract Created</span>
                <span className={styles.value}>{formatDate(project.contract_info?.contract_created)}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.label}>Contract Language</span>
                <span className={styles.value}>{project.contract_info?.contract_language || 'Solidity'}</span>
              </div>
            </div>
          </div>

          {/* Owner & Deployer Info Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Owner & Deployer Information</h2>
            <div className={styles.addressGrid}>
              <div className={styles.addressRow}>
                <span className={styles.label}>Owner Address</span>
                <span className={styles.valueAddress}>{project.contract_info?.contract_owner ? `${project.contract_info.contract_owner.slice(0, 4)}...${project.contract_info.contract_owner.slice(-4)}` : 'N/A'}</span>
              </div>
              <div className={styles.addressRow}>
                <span className={styles.label}>Deployer Address</span>
                <span className={styles.valueAddress}>{project.contract_info?.contract_deployer ? `${project.contract_info.contract_deployer.slice(0, 4)}...${project.contract_info.contract_deployer.slice(-4)}` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Manual Code Review Risk Results */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Manual Code Review Risk Results</h2>
            <div className={styles.riskGrid}>
              <div className={styles.riskRow}>
                <span className={styles.label}>Can Mint?</span>
                <span className={!project.overview?.mint ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.mint ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Edit Taxes over 25%</span>
                <span className={!project.overview?.modify_tax ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.modify_tax ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Max Transaction</span>
                <span className={!project.overview?.max_transaction ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.max_transaction ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Max Wallet</span>
                <span className={!project.overview?.max_wallet ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.max_wallet ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Enable Trade</span>
                <span className={!project.overview?.enable_trading ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.enable_trading ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Modify Tax</span>
                <span className={!project.overview?.modify_tax ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.modify_tax ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Honeypot</span>
                <span className={!project.overview?.honeypot ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.honeypot ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Trading Cooldown</span>
                <span className={!project.overview?.trading_cooldown ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.trading_cooldown ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Transfer Pausable</span>
                <span className={!project.overview?.pause_transfer ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.pause_transfer ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Can Pause Trade?</span>
                <span className={!project.overview?.pause_trade ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.pause_trade ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Anti Bot</span>
                <span className={project.overview?.anti_bot ? styles.badgePass : styles.badgeFail}>
                  {project.overview?.anti_bot ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Antiwhale</span>
                <span className={project.overview?.anit_whale ? styles.badgePass : styles.badgeFail}>
                  {project.overview?.anit_whale ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Proxy Contract</span>
                <span className={!project.overview?.proxy_check ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.proxy_check ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Blacklisted</span>
                <span className={!project.overview?.blacklist ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.blacklist ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Hidden Ownership</span>
                <span className={!project.overview?.hidden_owner ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.hidden_owner ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Buy Tax</span>
                <span className={styles.value}>{project.overview?.buy_tax || 0}%</span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Sell Tax</span>
                <span className={styles.value}>{project.overview?.sell_tax || 0}%</span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Selfdestruct</span>
                <span className={!project.overview?.self_destruct ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.self_destruct ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>Whitelisted</span>
                <span className={project.overview?.whitelist ? styles.badgePass : styles.badgeFail}>
                  {project.overview?.whitelist ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.label}>External Call</span>
                <span className={!project.overview?.external_call ? styles.badgePass : styles.badgeFail}>
                  {!project.overview?.external_call ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>
          </div>

          {/* Code Security */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Code Security</h2>
            <div className={styles.scoreHistoryContainer}>
              <div className={styles.scoreLabel}>Score History</div>
              <div className={styles.scoreRange}>
                <span>Low</span>
                <div className={styles.scoreBar}>
                  <div className={styles.scoreProgress} style={{ width: `${project.audit_score}%` }}></div>
                </div>
                <span>High</span>
              </div>
              <div className={styles.scoreValue}>{project.audit_score || 0}</div>
            </div>
          </div>

          {/* Code Audit History */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Code Audit History</h2>
            <div className={styles.auditHistoryGrid}>
              <div className={styles.historyItem}>
                <div className={styles.historyLabel}>All Findings</div>
                <div className={styles.historyValue}>{(project.critical?.found || 0) + (project.major?.found || 0) + (project.medium?.found || 0) + (project.minor?.found || 0) + (project.informational?.found || 0)}</div>
              </div>
              <div className={styles.historyItem}>
                <div className={styles.historyLabel}>Partially Resolved</div>
                <div className={styles.historyValue}>{(project.critical?.pending || 0) + (project.major?.pending || 0) + (project.medium?.pending || 0) + (project.minor?.pending || 0) + (project.informational?.pending || 0)}</div>
              </div>
              <div className={styles.historyItem}>
                <div className={styles.historyLabel}>Resolved</div>
                <div className={styles.historyValue}>{(project.critical?.resolved || 0) + (project.major?.resolved || 0) + (project.medium?.resolved || 0) + (project.minor?.resolved || 0) + (project.informational?.resolved || 0)}</div>
              </div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Severity Breakdown</h2>
            <div className={styles.severityGrid}>
              <div className={styles.severityItem}>
                <div className={styles.severityHeader} style={{ background: '#22c55e' }}>
                  <span className={styles.severityCount}>{project.minor?.found || 0}</span>
                  <span className={styles.severityLabel}>Low</span>
                </div>
                <div className={styles.severityStats}>
                  <div>Acknowledged: {project.minor?.pending || 0}</div>
                  <div>Pending: {project.minor?.pending || 0}</div>
                  <div>Resolved: {project.minor?.resolved || 0}</div>
                </div>
              </div>
              
              <div className={styles.severityItem}>
                <div className={styles.severityHeader} style={{ background: '#f59e0b' }}>
                  <span className={styles.severityCount}>{project.medium?.found || 0}</span>
                  <span className={styles.severityLabel}>Medium</span>
                </div>
                <div className={styles.severityStats}>
                  <div>Acknowledged: {project.medium?.pending || 0}</div>
                  <div>Pending: {project.medium?.pending || 0}</div>
                  <div>Resolved: {project.medium?.resolved || 0}</div>
                </div>
              </div>
              
              <div className={styles.severityItem}>
                <div className={styles.severityHeader} style={{ background: '#f97316' }}>
                  <span className={styles.severityCount}>{project.major?.found || 0}</span>
                  <span className={styles.severityLabel}>High</span>
                </div>
                <div className={styles.severityStats}>
                  <div>Acknowledged: {project.major?.pending || 0}</div>
                  <div>Pending: {project.major?.pending || 0}</div>
                  <div>Resolved: {project.major?.resolved || 0}</div>
                </div>
              </div>
              
              <div className={styles.severityItem}>
                <div className={styles.severityHeader} style={{ background: '#ef4444' }}>
                  <span className={styles.severityCount}>{project.critical?.found || 0}</span>
                  <span className={styles.severityLabel}>Critical</span>
                </div>
                <div className={styles.severityStats}>
                  <div>Acknowledged: {project.critical?.pending || 0}</div>
                  <div>Pending: {project.critical?.pending || 0}</div>
                  <div>Resolved: {project.critical?.resolved || 0}</div>
                </div>
              </div>
              
              <div className={styles.severityItem}>
                <div className={styles.severityHeader} style={{ background: '#3b82f6' }}>
                  <span className={styles.severityCount}>{project.informational?.found || 0}</span>
                  <span className={styles.severityLabel}>Informational</span>
                </div>
                <div className={styles.severityStats}>
                  <div>Acknowledged: {project.informational?.pending || 0}</div>
                  <div>Pending: {project.informational?.pending || 0}</div>
                  <div>Resolved: {project.informational?.resolved || 0}</div>
                </div>
              </div>
            </div>
            <div className={styles.auditActions}>
              {project.audit_pdf && (
                <button className={styles.actionButton} onClick={() => window.open(project.audit_pdf, '_blank')}>
                  View Audit
                </button>
              )}
              <button className={styles.actionButton}>View Findings</button>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>About</h2>
              <p style={{ color: '#ccc', lineHeight: '1.6' }}>{project.description}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Audit Security Score Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Security Score</h2>
            <div className={styles.mainScore}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreNumber}>{project.audit_score || 0}%</span>
              </div>
              <div className={styles.scoreStatus} style={{ color: scoreBadge.color }}>
                {scoreBadge.label}
              </div>
            </div>
            <div className={styles.safetyOverview}>
              <div className={styles.safetyTitle}>Safety Overview:</div>
              <div className={styles.safetyStats}>
                <div className={styles.safetyStat}>
                  <span className={styles.safetyCount} style={{ color: '#22c55e' }}>{project.minor?.found || 0}</span>
                  <span className={styles.safetyLabel}>Low</span>
                </div>
                <div className={styles.safetyStat}>
                  <span className={styles.safetyCount} style={{ color: '#f59e0b' }}>{project.medium?.found || 0}</span>
                  <span className={styles.safetyLabel}>Medium</span>
                </div>
                <div className={styles.safetyStat}>
                  <span className={styles.safetyCount} style={{ color: '#f97316' }}>{project.major?.found || 0}</span>
                  <span className={styles.safetyLabel}>High</span>
                </div>
                <div className={styles.safetyStat}>
                  <span className={styles.safetyCount} style={{ color: '#ef4444' }}>{project.critical?.found || 0}</span>
                  <span className={styles.safetyLabel}>Critical</span>
                </div>
                <div className={styles.safetyStat}>
                  <span className={styles.safetyCount} style={{ color: '#3b82f6' }}>{project.informational?.found || 0}</span>
                  <span className={styles.safetyLabel}>Informational</span>
                </div>
              </div>
            </div>
            <div className={styles.mainnetBadge}>Mainnet</div>
          </div>

          {/* Share Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Share</h2>
            <button className={styles.shareButton}>
              <span>📤</span> Share
            </button>
          </div>

          {/* Audit Confidence Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Confidence</h2>
            <div className={styles.confidenceStars}>
              {renderStars(typeof project.audit_confidence === 'number' ? Math.round(project.audit_confidence / 20) : 3)}
            </div>
            <div className={styles.confidenceRating}>
              {typeof project.audit_confidence === 'number' ? project.audit_confidence : project.audit_confidence || 'Medium'}
            </div>
            <div className={styles.confidenceLabel}>Audit Confidence</div>
          </div>

          {/* Community Confidence Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Community Confidence</h2>
            <div className={styles.voteCount}>{project.total_votes || 0} Votes</div>
            <div className={styles.voteBreakdown}>
              <div className={styles.voteRow}>
                <span className={styles.voteLabel}>Secure ({secureVotes})</span>
                <span className={styles.voteBar}>
                  <span className={styles.voteProgress} style={{ width: `${(secureVotes / (project.total_votes || 1)) * 100}%`, background: '#22c55e' }}></span>
                </span>
              </div>
              <div className={styles.voteRow}>
                <span className={styles.voteLabel}>Insecure ({insecureVotes})</span>
                <span className={styles.voteBar}>
                  <span className={styles.voteProgress} style={{ width: `${(insecureVotes / (project.total_votes || 1)) * 100}%`, background: '#ef4444' }}></span>
                </span>
              </div>
            </div>
            <button className={styles.connectWalletBtn}>Connect Wallet</button>
          </div>

          {/* Page Visits Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Page Visits</h2>
            <div className={styles.visitsCount}>{project.page_view || 0}</div>
            <div className={styles.visitsLabel}>Visits</div>
          </div>

          {/* File a Report Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>File a Report</h2>
            <p className={styles.reportText}>
              If you find any discrepancies in the project that you would like to report, use the form below.
            </p>
            <button className={styles.reportButton}>File a Report</button>
          </div>

          {/* Overview Tab */}
          <div className={styles.card}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${styles.tabActive}`}>Overview</button>
              <button className={styles.tab}>Socials</button>
            </div>
            {project.description && (
              <div className={styles.tabContent}>
                <p>{project.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
