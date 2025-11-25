'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import styles from './project.module.css';

// Helper to format date
function formatDate(dateString?: string | Date): string {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return 'N/A';
  }
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

  // Calculate score display
  const auditScore = project.audit_score || 0;
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    if (score >= 50) return '#ef4444'; // red
    return '#dc2626'; // dark red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  // Count findings by severity
  const findingCounts = {
    low: project.findings?.filter(f => f.severity === 'Low').length || 0,
    medium: project.findings?.filter(f => f.severity === 'Medium').length || 0,
    high: project.findings?.filter(f => f.severity === 'High').length || 0,
    critical: project.findings?.filter(f => f.severity === 'Critical').length || 0,
    informational: project.findings?.filter(f => f.severity === 'Informational').length || 0,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo} onClick={() => router.push('/')}>
            <img 
              src="/verified-badge-CFG.png" 
              alt="CFG Ninja Verified" 
              className={styles.logoImg}
            />
          </div>
          <div className={styles.headerActions}>
            <button className={styles.requestAuditBtn}>Request an Audit</button>
            <button className={styles.searchBtn}>🔍</button>
            <span className={styles.qualityBadge}>
              <img src="/quality.png" alt="Quality" style={{ height: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
              HIGH QUALITY AUDIT
            </span>
          </div>
        </div>
      </header>

      {/* Project Header */}
      <div className={styles.projectHeader}>
        <img 
          src={project.logo || '/default-logo.png'} 
          alt={project.name}
          className={styles.projectLogo}
        />
        <div className={styles.projectInfo}>
          <div className={styles.projectTitleRow}>
            <h1 className={styles.projectName}>{project.name}</h1>
            {project.launchpad && (
              <span className={styles.launchpadBadge}>PinkSale</span>
            )}
          </div>
          <p className={styles.projectDescription}>{project.description || 'No description available.'}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.container}>
        {/* Left Column - Project Info */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Project Info</h2>
            
            {/* Timeline */}
            <div className={styles.timelineSection}>
              <h3 className={styles.sectionTitle}>Timeline</h3>
              <div className={styles.timeline}>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineCircle}>
                    <span className={styles.timelineNumber}>1</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Audit Request</div>
                    <div className={styles.timelineDate}>{formatDate(project.createdAt)}</div>
                  </div>
                  <div className={styles.timelineLine}></div>
                </div>
                
                <div className={styles.timelineStep}>
                  <div className={styles.timelineCircle}>
                    <span className={styles.timelineNumber}>2</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Onboarding Process</div>
                    <div className={styles.timelineDate}>{formatDate(project.createdAt)}</div>
                  </div>
                  <div className={styles.timelineLine}></div>
                </div>
                
                <div className={styles.timelineStep}>
                  <div className={styles.timelineCircle}>
                    <span className={styles.timelineNumber}>3</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Audit Preview</div>
                    <div className={styles.timelineDate}>{formatDate(project.updatedAt)}</div>
                  </div>
                  <div className={styles.timelineLine}></div>
                </div>
                
                <div className={styles.timelineStep}>
                  <div className={`${styles.timelineCircle} ${styles.timelineCircleActive}`}>
                    <span className={styles.timelineCheck}>✓</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Audit Release</div>
                    <div className={styles.timelineDate}>{formatDate(project.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Analysis */}
            <div className={styles.tokenSection}>
              <h3 className={styles.sectionTitle}>Token Analysis</h3>
              <div className={styles.tokenGrid}>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Token Name</div>
                  <div className={styles.tokenValue}>{project.name}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Platform</div>
                  <div className={styles.tokenValue}>{project.platform || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Symbol</div>
                  <div className={styles.tokenValue}>{project.symbol || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Compiler</div>
                  <div className={styles.tokenValue}>{project.contract_info?.contract_compiler || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Token Address</div>
                  <div className={styles.tokenValue}>{project.contract_info?.contract_address || project.address || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Sol License</div>
                  <div className={styles.tokenValue}>{project.contract_info?.contract_license || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Decimals</div>
                  <div className={styles.tokenValue}>{project.decimals || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Contract Name</div>
                  <div className={styles.tokenValue}>{project.contract_info?.contract_name || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Total Supply</div>
                  <div className={styles.tokenValue}>{project.supply || 'N/A'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Created</div>
                  <div className={styles.tokenValue}>{formatDate(project.contract_info?.contract_created || project.dateCreated)}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Verified</div>
                  <div className={styles.tokenValue}>{project.contract_info?.contract_verified ? 'Yes' : 'No'}</div>
                </div>
                <div className={styles.tokenItem}>
                  <div className={styles.tokenLabel}>Language</div>
                  <div className={styles.tokenValue}>{project.contract_info?.contract_language || 'Solidity'}</div>
                </div>
              </div>
            </div>

            {/* Owner & Deployer */}
            <div className={styles.addressSection}>
              <h3 className={styles.sectionTitle}>Owner & Deployer Information</h3>
              <div className={styles.addressCards}>
                <div className={styles.addressCard}>
                  <div className={styles.addressLabel}>Owner Address</div>
                  <div className={styles.addressValue}>
                    <span>{project.contract_info?.contract_owner || project.ownerAddress || 'revoked'}</span>
                    <div className={styles.addressActions}>
                      <button className={styles.addressBtn}>📋</button>
                      <button className={styles.addressBtn}>🔗</button>
                    </div>
                  </div>
                </div>
                <div className={styles.addressCard}>
                  <div className={styles.addressLabel}>Deployer Address</div>
                  <div className={styles.addressValue}>
                    <span>{project.contract_info?.contract_deployer || project.contract_info?.contract_address || 'N/A'}</span>
                    <div className={styles.addressActions}>
                      <button className={styles.addressBtn}>📋</button>
                      <button className={styles.addressBtn}>🔗</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Code Review Risk Results */}
            <div className={styles.riskSection}>
              <h3 className={styles.sectionTitle}>Manual Code Review Risk Results</h3>
              <div className={styles.riskGrid}>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Can Mint?</span>
                  <span className={project.overview?.mint ? styles.riskFail : styles.riskPass}>
                    {project.overview?.mint ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Edit Taxes over 25%</span>
                  <span className={project.overview?.max_tax ? styles.riskFail : styles.riskPass}>
                    {project.overview?.max_tax ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Max Transaction</span>
                  <span className={project.overview?.max_transaction ? styles.riskFail : styles.riskPass}>
                    {project.overview?.max_transaction ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Max Wallet</span>
                  <span className={project.overview?.max_wallet ? styles.riskFail : styles.riskPass}>
                    {project.overview?.max_wallet ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Enable Trade</span>
                  <span className={project.overview?.enable_trading ? styles.riskFail : styles.riskPass}>
                    {project.overview?.enable_trading ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Modify Tax</span>
                  <span className={project.overview?.modify_tax ? styles.riskFail : styles.riskPass}>
                    {project.overview?.modify_tax ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Honeypot</span>
                  <span className={project.overview?.honeypot ? styles.riskFail : styles.riskPass}>
                    {project.overview?.honeypot ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Trading Cooldown</span>
                  <span className={project.overview?.trading_cooldown ? styles.riskFail : styles.riskPass}>
                    {project.overview?.trading_cooldown ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Transfer Pausable</span>
                  <span className={project.overview?.pause_transfer ? styles.riskFail : styles.riskPass}>
                    {project.overview?.pause_transfer ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Can Pause Trade?</span>
                  <span className={project.overview?.pause_trade ? styles.riskFail : styles.riskPass}>
                    {project.overview?.pause_trade ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Anti Bot</span>
                  <span className={project.overview?.anti_bot ? styles.riskPass : styles.riskFail}>
                    {project.overview?.anti_bot ? 'Pass' : 'Fail'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Antiwhale</span>
                  <span className={project.overview?.anit_whale ? styles.riskPass : styles.riskFail}>
                    {project.overview?.anit_whale ? 'Pass' : 'Fail'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Proxy Contract</span>
                  <span className={project.overview?.proxy_check ? styles.riskFail : styles.riskPass}>
                    {project.overview?.proxy_check ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Blacklisted</span>
                  <span className={project.overview?.blacklist ? styles.riskFail : styles.riskPass}>
                    {project.overview?.blacklist ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Hidden Ownership</span>
                  <span className={project.overview?.hidden_owner ? styles.riskFail : styles.riskPass}>
                    {project.overview?.hidden_owner ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Buy Tax</span>
                  <span className={styles.riskValue}>{project.overview?.buy_tax || 0}</span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Sell Tax</span>
                  <span className={styles.riskValue}>{project.overview?.sell_tax || 0}</span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Selfdestruct</span>
                  <span className={project.overview?.self_destruct ? styles.riskFail : styles.riskPass}>
                    {project.overview?.self_destruct ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>Whitelisted</span>
                  <span className={project.overview?.whitelist ? styles.riskFail : styles.riskPass}>
                    {project.overview?.whitelist ? 'Fail' : 'Pass'}
                  </span>
                </div>
                <div className={styles.riskItem}>
                  <span className={styles.riskLabel}>External Call</span>
                  <span className={project.overview?.external_call ? styles.riskFail : styles.riskPass}>
                    {project.overview?.external_call ? 'Fail' : 'Pass'}
                  </span>
                </div>
              </div>
            </div>

            {/* Code Security & Score History */}
            <div className={styles.codeSecuritySection}>
              <h3 className={styles.sectionTitle}>Code Security</h3>
              <div className={styles.scoreHistory}>
                <div className={styles.scoreHistoryLabel}>Score History</div>
                <div className={styles.scoreHistoryValues}>
                  <div className={styles.scoreHistoryItem}>
                    <span className={styles.scoreHistoryText}>Low</span>
                    <span className={styles.scoreHistoryNumber}>20</span>
                  </div>
                  <div className={styles.scoreHistoryItem}>
                    <span className={styles.scoreHistoryNumber}>{auditScore}</span>
                  </div>
                  <div className={styles.scoreHistoryItem}>
                    <span className={styles.scoreHistoryText}>High</span>
                    <span className={styles.scoreHistoryNumber}>{auditScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Audit History */}
            <div className={styles.auditHistorySection}>
              <h3 className={styles.sectionTitle}>Code Audit History</h3>
              <div className={styles.auditHistoryGrid}>
                <div className={styles.auditHistoryItem}>
                  <div className={styles.auditHistoryNumber}>0</div>
                  <div className={styles.auditHistoryLabel}>All Findings</div>
                </div>
                <div className={styles.auditHistoryItem}>
                  <div className={styles.auditHistoryNumber}>0</div>
                  <div className={styles.auditHistoryLabel}>Partially Resolved</div>
                </div>
                <div className={styles.auditHistoryItem}>
                  <div className={styles.auditHistoryNumber}>0</div>
                  <div className={styles.auditHistoryLabel}>Acknowledged</div>
                </div>
                <div className={styles.auditHistoryItem}>
                  <div className={styles.auditHistoryNumber}>0</div>
                  <div className={styles.auditHistoryLabel}>Resolved</div>
                </div>
              </div>

              {/* Findings Breakdown */}
              <div className={styles.findingsBreakdown}>
                <div className={styles.findingBreakdownItem}>
                  <div className={styles.findingBreakdownHeader}>
                    <span className={styles.findingBreakdownBullet} style={{ color: '#22c55e' }}>●</span>
                    <span className={styles.findingBreakdownTitle}>{project.minor?.found || 0} Low</span>
                  </div>
                  <div className={styles.findingBreakdownStats}>
                    {project.minor?.resolved || 0} Acknowledged, {project.minor?.pending || 0} Pending, {project.minor?.resolved || 0} Resolved
                  </div>
                </div>

                <div className={styles.findingBreakdownItem}>
                  <div className={styles.findingBreakdownHeader}>
                    <span className={styles.findingBreakdownBullet} style={{ color: '#f59e0b' }}>●</span>
                    <span className={styles.findingBreakdownTitle}>{project.medium?.found || 0} Medium</span>
                  </div>
                  <div className={styles.findingBreakdownStats}>
                    {project.medium?.resolved || 0} Acknowledged, {project.medium?.pending || 0} Pending, {project.medium?.resolved || 0} Resolved
                  </div>
                </div>

                <div className={styles.findingBreakdownItem}>
                  <div className={styles.findingBreakdownHeader}>
                    <span className={styles.findingBreakdownBullet} style={{ color: '#ef4444' }}>●</span>
                    <span className={styles.findingBreakdownTitle}>{project.major?.found || 0} High</span>
                  </div>
                  <div className={styles.findingBreakdownStats}>
                    {project.major?.resolved || 0} Acknowledged, {project.major?.pending || 0} Pending, {project.major?.resolved || 0} Resolved
                  </div>
                </div>

                <div className={styles.findingBreakdownItem}>
                  <div className={styles.findingBreakdownHeader}>
                    <span className={styles.findingBreakdownBullet} style={{ color: '#dc2626' }}>●</span>
                    <span className={styles.findingBreakdownTitle}>{project.critical?.found || 0} Critical</span>
                  </div>
                  <div className={styles.findingBreakdownStats}>
                    {project.critical?.resolved || 0} Acknowledged, {project.critical?.pending || 0} Pending, {project.critical?.resolved || 0} Resolved
                  </div>
                </div>

                <div className={styles.findingBreakdownItem}>
                  <div className={styles.findingBreakdownHeader}>
                    <span className={styles.findingBreakdownBullet} style={{ color: '#3b82f6' }}>●</span>
                    <span className={styles.findingBreakdownTitle}>{project.informational?.found || 0} Informational</span>
                  </div>
                  <div className={styles.findingBreakdownStats}>
                    {project.informational?.resolved || 0} Acknowledged, {project.informational?.pending || 0} Pending, {project.informational?.resolved || 0} Resolved
                  </div>
                </div>
              </div>

              {/* View Buttons */}
              <div className={styles.viewButtons}>
                {project.audit_pdf && (
                  <button 
                    className={styles.viewBtn}
                    onClick={() => window.open(project.audit_pdf, '_blank')}
                  >
                    View Audit
                  </button>
                )}
                <button className={styles.viewBtn}>View Findings</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Community & Overview */}
        <div className={styles.rightColumn}>
          {/* Audit Confidence */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Confidence</h2>
            <div className={styles.auditConfidenceDisplay}>
              <div className={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={styles.star}
                    style={{ color: star <= Math.round(auditScore / 20) ? '#f59e0b' : '#333' }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className={styles.confidenceScore}>{auditScore}/100</div>
            </div>
          </div>

          {/* Community Confidence */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Community Confidence</h2>
            <div className={styles.votesDisplay}>
              <div className={styles.votesNumber}>0</div>
              <div className={styles.votesLabel}>Votes</div>
              <div className={styles.votesBreakdown}>
                <div className={styles.votesSecure}>
                  <span className={styles.votesSecureIcon}>✓</span>
                  <span>0 Secure</span>
                </div>
                <div className={styles.votesInsecure}>
                  <span className={styles.votesInsecureIcon}>✗</span>
                  <span>0 Insecure</span>
                </div>
              </div>
              <button className={styles.connectWalletBtn}>Connect Wallet</button>
            </div>
          </div>

          {/* Page Visits */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Page Visits</h2>
            <div className={styles.visitsDisplay}>
              <div className={styles.visitsNumber}>0</div>
            </div>
          </div>

          {/* Overview */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Overview</h2>
            
            {/* Socials */}
            <div className={styles.socialsSection}>
              <div className={styles.socialIcons}>
                {project.socials?.telegram && (
                  <a href={project.socials.telegram} target="_blank" rel="noopener noreferrer" className={styles.socialIconCircle}>
                    ✈️
                  </a>
                )}
                {project.socials?.twitter && (
                  <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialIconCircle}>
                    🐦
                  </a>
                )}
                {project.socials?.website && (
                  <a href={project.socials.website} target="_blank" rel="noopener noreferrer" className={styles.socialIconCircle}>
                    🌐
                  </a>
                )}
                {project.socials?.trustblock && (
                  <a 
                    href={project.socials.trustblock} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.trustblockLink}
                    title="View on TrustBlock"
                  >
                    <img 
                      src="/trustblock-logo.svg" 
                      alt="TrustBlock" 
                      className={styles.trustblockLogo}
                    />
                  </a>
                )}
              </div>
            </div>

            {/* Audit Security Score */}
            <div className={styles.scoreSection}>
              <h3 className={styles.sectionSubtitle}>Audit Security Score</h3>
              <div className={styles.scoreCircle} style={{ borderColor: getScoreColor(auditScore) }}>
                <div className={styles.scorePercentage}>{auditScore}%</div>
                <div className={styles.scoreStatus}>{getScoreLabel(auditScore)}</div>
              </div>
              <div className={styles.scorePass}>PASS</div>
            </div>

            {/* Safety Overview */}
            <div className={styles.safetySection}>
              <h3 className={styles.sectionSubtitle}>Safety Overview</h3>
              <div className={styles.safetyOverview}>
                <div className={styles.safetyItem}>
                  <span className={styles.safetyBullet} style={{ color: '#22c55e' }}>●</span>
                  <span className={styles.safetyLabel}>Low</span>
                  <span className={styles.safetyCount}>{findingCounts.low}</span>
                </div>
                <div className={styles.safetyItem}>
                  <span className={styles.safetyBullet} style={{ color: '#f59e0b' }}>●</span>
                  <span className={styles.safetyLabel}>Medium</span>
                  <span className={styles.safetyCount}>{findingCounts.medium}</span>
                </div>
                <div className={styles.safetyItem}>
                  <span className={styles.safetyBullet} style={{ color: '#ef4444' }}>●</span>
                  <span className={styles.safetyLabel}>High</span>
                  <span className={styles.safetyCount}>{findingCounts.high}</span>
                </div>
                <div className={styles.safetyItem}>
                  <span className={styles.safetyBullet} style={{ color: '#dc2626' }}>●</span>
                  <span className={styles.safetyLabel}>Critical</span>
                  <span className={styles.safetyCount}>{findingCounts.critical}</span>
                </div>
                <div className={styles.safetyItem}>
                  <span className={styles.safetyBullet} style={{ color: '#3b82f6' }}>●</span>
                  <span className={styles.safetyLabel}>Informational</span>
                  <span className={styles.safetyCount}>{findingCounts.informational}</span>
                </div>
              </div>
            </div>

            {/* Mainnet Button */}
            <button className={styles.mainnetBtn}>Mainnet</button>
          </div>

          {/* Share */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Share</h2>
            <div className={styles.shareButtons}>
              <button className={styles.shareBtn}>
                <span className={styles.shareBtnIcon}>🐦</span>
                <span>Share on Twitter</span>
              </button>
              <button className={styles.shareBtn}>
                <span className={styles.shareBtnIcon}>✈️</span>
                <span>Share on Telegram</span>
              </button>
              <button className={styles.shareBtn}>
                <span className={styles.shareBtnIcon}>📋</span>
                <span>Copy Link</span>
              </button>
            </div>
          </div>

          {/* File a Report */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>File a Report</h2>
            <p className={styles.reportDescription}>
              If you find any discrepancies in the project that you would like to report, use the form below.
            </p>
            <form className={styles.reportForm}>
              <textarea 
                className={styles.reportTextarea}
                placeholder="Describe the issue you found..."
                rows={5}
              />
              <button type="submit" className={styles.reportSubmitBtn}>
                Submit Report
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
