'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import Advertisement from '@/components/Advertisement';

import styles from './project.module.css';

// Helper to format date
function formatDate(dateString?: string | Date): string {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('/');
  } catch {
    return 'N/A';
  }
}

// Helper to render pass/fail badge
function renderBadge(value: boolean, inversed: boolean = false) {
  const isPassing = inversed ? !value : value;
  return (
    <span className={isPassing ? styles.badgeFail : styles.badgePass}>
      {isPassing ? 'Fail' : 'Pass'}
    </span>
  );
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
    if (score >= 90) return { label: 'Very High', className: styles.scoreVeryHigh };
    if (score >= 80) return { label: 'High', className: styles.scoreHigh };
    if (score >= 70) return { label: 'PASS', className: styles.scorePass };
    return { label: 'FAIL', className: styles.scoreFail };
  };

  const getConfidenceStars = (confidence: string | undefined) => {
    const confMap: { [key: string]: number } = {
      'Very High': 5,
      'High': 4,
      'Medium': 3,
      'Low': 2,
      'Very Low': 1
    };
    return confMap[confidence || 'Medium'] || 3;
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
  const confidenceStars = getConfidenceStars(project.audit_confidence);

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
          </nav>
        </div>
      </header>

      {/* Project Header Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <img 
            src={project.logo || '/default-logo.png'} 
            alt={project.name}
            className={styles.heroLogo}
          />
          <div className={styles.heroInfo}>
            <h1 className={styles.heroTitle}>{project.name}</h1>
            {project.launchpad && (
              <div className={styles.launchpadBadge}>{project.launchpad}</div>
            )}
            {project.description && (
              <p className={styles.heroDescription}>{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.container}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Project Info & Timeline */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Project Info</h2>
            
            <h3 className={styles.sectionTitle}>Timeline</h3>
            <div className={styles.timelineGrid}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Audit Request</div>
                <div className={styles.timelineValue}>{formatDate(project.timeline?.audit_request)}</div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Onboarding Process</div>
                <div className={styles.timelineValue}>{formatDate(project.timeline?.onboarding_process)}</div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Audit Preview</div>
                <div className={styles.timelineValue}>{formatDate(project.timeline?.audit_preview)}</div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineLabel}>Audit Release</div>
                <div className={styles.timelineValue}>{formatDate(project.timeline?.audit_release)}</div>
              </div>
            </div>
          </div>

          {/* Token Analysis */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Token Analysis</h2>
            <div className={styles.analysisGrid}>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Token Name</span>
                <span className={styles.analysisValue}>{project.name}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Token Symbol</span>
                <span className={styles.analysisValue}>{project.symbol}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Token Address</span>
                <span className={styles.analysisValue} style={{fontSize: '0.85rem', wordBreak: 'break-all'}}>
                  {project.contract_info?.contract_address ? 
                    `${project.contract_info.contract_address.slice(0, 4)}...${project.contract_info.contract_address.slice(-4)}` 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Token Decimals</span>
                <span className={styles.analysisValue}>{project.decimals || 18}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Token Total Supply</span>
                <span className={styles.analysisValue}>{project.supply ? parseInt(project.supply).toLocaleString() : 'N/A'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Contract Verified</span>
                <span className={styles.analysisValue}>{project.contract_info?.contract_verified ? 'Yes' : 'No'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Platform</span>
                <span className={styles.analysisValue}>{project.platform || 'Binance Smart Chain'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Compiler</span>
                <span className={styles.analysisValue}>{project.contract_info?.contract_compiler || 'N/A'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Sol License</span>
                <span className={styles.analysisValue}>{project.contract_info?.contract_license || 'No License (None)'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Contract Name</span>
                <span className={styles.analysisValue}>{project.contract_info?.contract_name || 'N/A'}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Contract Created</span>
                <span className={styles.analysisValue}>{formatDate(project.contract_info?.contract_created)}</span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Contract Language</span>
                <span className={styles.analysisValue}>{project.contract_info?.contract_language || 'Solidity'}</span>
              </div>
            </div>
          </div>

          {/* Owner & Deployer Information */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Owner & Deployer Information</h2>
            <div className={styles.analysisGrid}>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Owner Address</span>
                <span className={styles.analysisValue} style={{fontSize: '0.85rem', wordBreak: 'break-all'}}>
                  {project.contract_info?.contract_owner ? 
                    `${project.contract_info.contract_owner.slice(0, 4)}...${project.contract_info.contract_owner.slice(-2)}` 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.analysisRow}>
                <span className={styles.analysisLabel}>Deployer Address</span>
                <span className={styles.analysisValue} style={{fontSize: '0.85rem', wordBreak: 'break-all'}}>
                  {project.contract_info?.contract_deployer ? 
                    `${project.contract_info.contract_deployer.slice(0, 4)}...${project.contract_info.contract_deployer.slice(-2)}` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Code Review Risk Results */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Manual Code Review Risk Results</h2>
            <div className={styles.riskGrid}>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Can Mint?</span>
                {renderBadge(project.overview?.mint || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Edit Taxes over 25%</span>
                {renderBadge(project.overview?.max_tax || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Max Transaction</span>
                {renderBadge(project.overview?.max_transaction || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Max Wallet</span>
                {renderBadge(project.overview?.max_wallet || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Enable Trade</span>
                {renderBadge(project.overview?.enable_trading || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Modify Tax</span>
                {renderBadge(project.overview?.modify_tax || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Honeypot</span>
                {renderBadge(project.overview?.honeypot || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Trading Cooldown</span>
                {renderBadge(project.overview?.trading_cooldown || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Transfer Pausable</span>
                {renderBadge(project.overview?.pause_transfer || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Can Pause Trade?</span>
                {renderBadge(project.overview?.pause_trade || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Anti Bot</span>
                {renderBadge(project.overview?.anti_bot || false, false)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Antiwhale</span>
                {renderBadge(project.overview?.anit_whale || false, false)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Proxy Contract</span>
                {renderBadge(project.overview?.proxy_check || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Blacklisted</span>
                {renderBadge(project.overview?.blacklist || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Hidden Ownership</span>
                {renderBadge(project.overview?.hidden_owner || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Buy Tax</span>
                <span className={styles.analysisValue}>{project.overview?.buy_tax || 0}</span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Sell Tax</span>
                <span className={styles.analysisValue}>{project.overview?.sell_tax || 0}</span>
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Selfdestruct</span>
                {renderBadge(project.overview?.self_destruct || false, true)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>Whitelisted</span>
                {renderBadge(project.overview?.whitelist || false, false)}
              </div>
              <div className={styles.riskRow}>
                <span className={styles.riskLabel}>External Call</span>
                {renderBadge(project.overview?.external_call || false, true)}
              </div>
            </div>
          </div>

          {/* Code Security Score History */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Code Security</h2>
            <div className={styles.scoreHistorySection}>
              <div className={styles.scoreHistoryLabel}>Score History</div>
              <div className={styles.scoreHistoryBar}>
                <span className={styles.scoreLow}>Low</span>
                <span className={styles.scoreBar}>
                  <span className={styles.scoreBarFill} style={{width: `${project.audit_score}%`}}></span>
                </span>
                <span className={styles.scoreHi}>High</span>
              </div>
              <div className={styles.scoreHistoryValue}>{project.audit_score}</div>
            </div>
          </div>

          {/* Code Audit History */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Code Audit History</h2>
            <div className={styles.auditHistoryGrid}>
              <div className={styles.auditHistoryItem}>
                <div className={styles.auditHistoryValue}>{(project.critical?.found || 0) + (project.major?.found || 0) + (project.medium?.found || 0) + (project.minor?.found || 0)}</div>
                <div className={styles.auditHistoryLabel}>All Findings</div>
              </div>
              <div className={styles.auditHistoryItem}>
                <div className={styles.auditHistoryValue}>{(project.critical?.pending || 0) + (project.major?.pending || 0) + (project.medium?.pending || 0) + (project.minor?.pending || 0)}</div>
                <div className={styles.auditHistoryLabel}>Partially Resolved</div>
              </div>
              <div className={styles.auditHistoryItem}>
                <div className={styles.auditHistoryValue}>0</div>
                <div className={styles.auditHistoryLabel}>Acknowledged</div>
              </div>
              <div className={styles.auditHistoryItem}>
                <div className={styles.auditHistoryValue}>{(project.critical?.resolved || 0) + (project.major?.resolved || 0) + (project.medium?.resolved || 0) + (project.minor?.resolved || 0)}</div>
                <div className={styles.auditHistoryLabel}>Resolved</div>
              </div>
            </div>

            {/* Findings Breakdown */}
            <div className={styles.findingsBreakdown}>
              <div className={styles.findingBreakdownItem}>
                <div className={styles.findingBreakdownHeader}>
                  <span className={styles.findingCount}>{project.minor?.found || 0}</span>
                  <span className={styles.findingSeverity} style={{color: '#eab308'}}>Low</span>
                </div>
                <div className={styles.findingBreakdownDetails}>
                  <span>{(project.minor?.found || 0) - (project.minor?.pending || 0) - (project.minor?.resolved || 0)} Acknowledged, </span>
                  <span>{project.minor?.pending || 0} Pending, </span>
                  <span>{project.minor?.resolved || 0} Resolved</span>
                </div>
              </div>

              <div className={styles.findingBreakdownItem}>
                <div className={styles.findingBreakdownHeader}>
                  <span className={styles.findingCount}>{project.medium?.found || 0}</span>
                  <span className={styles.findingSeverity} style={{color: '#f59e0b'}}>Medium</span>
                </div>
                <div className={styles.findingBreakdownDetails}>
                  <span>{(project.medium?.found || 0) - (project.medium?.pending || 0) - (project.medium?.resolved || 0)} Acknowledged, </span>
                  <span>{project.medium?.pending || 0} Pending, </span>
                  <span>{project.medium?.resolved || 0} Resolved</span>
                </div>
              </div>

              <div className={styles.findingBreakdownItem}>
                <div className={styles.findingBreakdownHeader}>
                  <span className={styles.findingCount}>{project.major?.found || 0}</span>
                  <span className={styles.findingSeverity} style={{color: '#ea580c'}}>High</span>
                </div>
                <div className={styles.findingBreakdownDetails}>
                  <span>{(project.major?.found || 0) - (project.major?.pending || 0) - (project.major?.resolved || 0)} Acknowledged, </span>
                  <span>{project.major?.pending || 0} Pending, </span>
                  <span>{project.major?.resolved || 0} Resolved</span>
                </div>
              </div>

              <div className={styles.findingBreakdownItem}>
                <div className={styles.findingBreakdownHeader}>
                  <span className={styles.findingCount}>{project.critical?.found || 0}</span>
                  <span className={styles.findingSeverity} style={{color: '#dc2626'}}>Critical</span>
                </div>
                <div className={styles.findingBreakdownDetails}>
                  <span>{(project.critical?.found || 0) - (project.critical?.pending || 0) - (project.critical?.resolved || 0)} Acknowledged, </span>
                  <span>{project.critical?.pending || 0} Pending, </span>
                  <span>{project.critical?.resolved || 0} Resolved</span>
                </div>
              </div>

              <div className={styles.findingBreakdownItem}>
                <div className={styles.findingBreakdownHeader}>
                  <span className={styles.findingCount}>0</span>
                  <span className={styles.findingSeverity} style={{color: '#3b82f6'}}>Informational</span>
                </div>
                <div className={styles.findingBreakdownDetails}>
                  <span>0 Acknowledged, 0 Pending, 0 Resolved</span>
                </div>
              </div>
            </div>

            {/* Audit Buttons */}
            <div className={styles.auditButtons}>
              {project.audit_pdf && (
                <button className={styles.auditButton} onClick={() => window.open(project.audit_pdf, '_blank')}>
                  View Audit
                </button>
              )}
              <button className={styles.auditButton}>View Findings</button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Community Confidence */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Community Confidence</h2>
            <div className={styles.votesSection}>
              <div className={styles.votesCount}>{project.total_votes || 0} Votes</div>
              <div className={styles.votesBreakdown}>
                <div className={styles.voteItem}>
                  <span className={styles.voteSecure}>Secure ({project.total_votes || 0})</span>
                </div>
                <div className={styles.voteItem}>
                  <span className={styles.voteInsecure}>Insecure (0)</span>
                </div>
              </div>
              <button className={styles.connectWallet}>Connect Wallet</button>
            </div>
          </div>

          {/* Page Visits */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Page Visits</h2>
            <div className={styles.visitsSection}>
              <div className={styles.visitsCount}>{project.page_view || 0}</div>
              <div className={styles.visitsLabel}>Visits</div>
            </div>
          </div>

          {/* Overview */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Overview</h2>
            <div className={styles.overviewSection}>
              <div className={styles.socialLinks}>
                {project.socials?.website && (
                  <a href={project.socials.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    🌐 Website
                  </a>
                )}
                {project.socials?.twitter && (
                  <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    🐦 Twitter
                  </a>
                )}
                {project.socials?.telegram && (
                  <a href={project.socials.telegram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    ✈️ Telegram
                  </a>
                )}
                {project.socials?.github && (
                  <a href={project.socials.github} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    💻 GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Audit Security Score */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Security Score</h2>
            <div className={styles.securityScoreSection}>
              <div className={styles.securityScoreCircle}>
                <div className={styles.securityScoreValue}>{project.audit_score}%</div>
              </div>
              <div className={`${styles.securityScoreBadge} ${scoreBadge.className}`}>
                {scoreBadge.label}
              </div>
              <div className={styles.securityScoreStatus}>PASS</div>
              
              <div className={styles.safetyOverview}>
                <h3>Safety Overview:</h3>
                <div className={styles.safetyGrid}>
                  <div className={styles.safetyItem}>
                    <span className={styles.safetyCount}>{project.minor?.found || 0}</span>
                    <span className={styles.safetyLabel} style={{color: '#eab308'}}>Low</span>
                  </div>
                  <div className={styles.safetyItem}>
                    <span className={styles.safetyCount}>{project.medium?.found || 0}</span>
                    <span className={styles.safetyLabel} style={{color: '#f59e0b'}}>Medium</span>
                  </div>
                  <div className={styles.safetyItem}>
                    <span className={styles.safetyCount}>{project.major?.found || 0}</span>
                    <span className={styles.safetyLabel} style={{color: '#ea580c'}}>High</span>
                  </div>
                  <div className={styles.safetyItem}>
                    <span className={styles.safetyCount}>{project.critical?.found || 0}</span>
                    <span className={styles.safetyLabel} style={{color: '#dc2626'}}>Critical</span>
                  </div>
                  <div className={styles.safetyItem}>
                    <span className={styles.safetyCount}>0</span>
                    <span className={styles.safetyLabel} style={{color: '#3b82f6'}}>Informational</span>
                  </div>
                </div>
              </div>

              <div className={styles.mainnetBadge}>Mainnet</div>
            </div>
          </div>

          {/* Share */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Share</h2>
            <div className={styles.shareSection}>
              <button className={styles.shareButton}>
                🐦 Share on Twitter
              </button>
              <button className={styles.shareButton}>
                ✈️ Share on Telegram
              </button>
              <button className={styles.shareButton}>
                📋 Copy Link
              </button>
            </div>
          </div>

          {/* Audit Confidence */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Confidence</h2>
            <div className={styles.confidenceSection}>
              <div className={styles.confidenceStars}>
                {renderStars(confidenceStars)}
              </div>
              <div className={styles.confidenceRating}>{confidenceStars}</div>
              <div className={styles.confidenceLabel}>Audit Confidence</div>
              <div className={styles.confidenceLevel}>{project.audit_confidence || 'Medium'}</div>
            </div>
          </div>

          {/* File a Report */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>File a Report</h2>
            <p className={styles.reportText}>
              If you find any discrepancies in the project that you would like to report, use the form below.
            </p>
            <button className={styles.reportButton}>File Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
