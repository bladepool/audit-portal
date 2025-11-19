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
            <button 
              className={styles.searchButton}
              onClick={() => router.push('/')}
              title="Search projects"
            >
              🔍
            </button>
          </nav>
        </div>
      </header>

      {/* Project Header */}
      <div className={styles.projectHeader}>
        <div className={styles.projectHeaderContent}>
          <div className={styles.projectHeroLeft}>
            <img 
              src={project.logo || '/default-logo.png'} 
              alt={project.name}
              className={styles.projectLogo}
            />
            <div className={styles.projectInfo}>
              <div className={styles.projectTitleRow}>
                <h1 className={styles.projectName}>{project.name}</h1>
                {project.launchpad && (
                  <a 
                    href={project.socials?.website || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.launchpadBadge}
                  >
                    {project.launchpad} <span className={styles.externalIcon}>↗</span>
                  </a>
                )}
              </div>
              {project.description && (
                <p className={styles.projectDescription}>{project.description}</p>
              )}
              {/* Social Media Icons */}
              <div className={styles.socialMediaIcons}>
                {project.socials?.website && (
                  <a href={project.socials.website} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} title="Website">
                    🌐
                  </a>
                )}
                {project.socials?.twitter && (
                  <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} title="Twitter">
                    𝕏
                  </a>
                )}
                {project.socials?.telegram && (
                  <a href={project.socials.telegram} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} title="Telegram">
                    ✈️
                  </a>
                )}
                {project.socials?.discord && (
                  <a href={project.socials.discord} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} title="Discord">
                    💬
                  </a>
                )}
                {project.socials?.github && (
                  <a href={project.socials.github} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} title="GitHub">
                    💻
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className={styles.projectHeroRight}>
            <div className={styles.adPlaceholder}>YOUR AD HERE</div>
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
            <div className={styles.timelineFlow}>
              <div className={styles.timelineStep}>
                <div className={styles.timelineIcon}>
                  <img src="https://audit.cfg.ninja/icons/request.png" alt="Audit Request" />
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineLabel}>Audit Request</div>
                  <div className={styles.timelineDate}>{formatDate(project.timeline?.audit_request)}</div>
                </div>
              </div>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineStep}>
                <div className={styles.timelineIcon}>
                  <img src="https://audit.cfg.ninja/icons/audit.png" alt="Onboarding Process" />
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineLabel}>Onboarding Process</div>
                  <div className={styles.timelineDate}>{formatDate(project.timeline?.onboarding_process)}</div>
                </div>
              </div>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineStep}>
                <div className={styles.timelineIcon}>
                  <img src="https://audit.cfg.ninja/icons/revision.png" alt="Audit Preview" />
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineLabel}>Audit Preview</div>
                  <div className={styles.timelineDate}>{formatDate(project.timeline?.audit_preview)}</div>
                </div>
              </div>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineStep}>
                <div className={styles.timelineIcon}>
                  <img src="https://audit.cfg.ninja/icons/rocket.png" alt="Audit Release" />
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineLabel}>Audit Release</div>
                  <div className={styles.timelineDate}>{formatDate(project.timeline?.audit_release)}</div>
                </div>
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
            <div className={styles.riskIconGrid}>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.mint ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Can Mint?</span>
                <span className={styles.iconStatus}>{!project.overview?.mint ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.modify_tax ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Modify Tax</span>
                <span className={styles.iconStatus}>{!project.overview?.modify_tax ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.honeypot ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Honeypot</span>
                <span className={styles.iconStatus}>{!project.overview?.honeypot ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.trading_cooldown ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Trading Cooldown</span>
                <span className={styles.iconStatus}>{!project.overview?.trading_cooldown ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.anti_bot ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Anti Bot</span>
                <span className={styles.iconStatus}>{!project.overview?.anti_bot ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.blacklist ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Blacklist</span>
                <span className={styles.iconStatus}>{!project.overview?.blacklist ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.whitelist ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Whitelist</span>
                <span className={styles.iconStatus}>{!project.overview?.whitelist ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.anit_whale ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Anti Whale</span>
                <span className={styles.iconStatus}>{!project.overview?.anit_whale ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.proxy_check ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Proxy Contract</span>
                <span className={styles.iconStatus}>{!project.overview?.proxy_check ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.pause_transfer ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Pause Transfer</span>
                <span className={styles.iconStatus}>{!project.overview?.pause_transfer ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.pause_trade ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Pause Trade</span>
                <span className={styles.iconStatus}>{!project.overview?.pause_trade ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.hidden_owner ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>Hidden Ownership</span>
                <span className={styles.iconStatus}>{!project.overview?.hidden_owner ? 'Pass' : 'Fail'}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={styles.iconNeutral}>●</div>
                <span className={styles.iconLabel}>Buy Tax</span>
                <span className={styles.iconStatus}>{project.overview?.buy_tax || 0}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={styles.iconNeutral}>●</div>
                <span className={styles.iconLabel}>Sell Tax</span>
                <span className={styles.iconStatus}>{project.overview?.sell_tax || 0}</span>
              </div>
              <div className={styles.riskIcon}>
                <div className={!project.overview?.external_call ? styles.iconPass : styles.iconFail}>●</div>
                <span className={styles.iconLabel}>External Call</span>
                <span className={styles.iconStatus}>{!project.overview?.external_call ? 'Pass' : 'Fail'}</span>
              </div>
            </div>
            
            {/* Audit Action Buttons */}
            <div className={styles.auditActions}>
              {project.audit_pdf && (
                <a 
                  href={project.audit_pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.auditButton}
                >
                  📄 View Audit PDF
                </a>
              )}
              {project.cfg_findings && project.cfg_findings.length > 0 && (
                <button className={styles.auditButton} onClick={() => {
                  const findingsSection = document.getElementById('cfg-findings');
                  findingsSection?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  🔍 View CFG Findings ({project.cfg_findings.length})
                </button>
              )}
            </div>
          </div>

          {/* Code Security */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Code Security</h2>
            
            <div className={styles.codeSecurityContainer}>
              {/* Score History - Spider Chart */}
              <div className={styles.scoreHistorySection}>
                <h3 className={styles.subsectionTitle}>Score History</h3>
                <div className={styles.spiderChartContainer}>
                  <div className={styles.scoreDisplay}>
                    <div className={styles.scoreNumber}>{project.audit_score || 0}</div>
                    <div className={styles.scoreRange}>
                      <span className={styles.rangeLow}>Low<br/>20</span>
                      <span className={styles.rangeHigh}>High<br/>{project.audit_score >= 90 ? project.audit_score : 95}</span>
                    </div>
                  </div>
                  <svg className={styles.spiderChart} viewBox="0 0 200 140">
                    {/* Grid lines */}
                    <polyline points="20,70 100,20 180,70 180,120 20,120" fill="none" stroke="#333" strokeWidth="1"/>
                    <polyline points="40,70 100,40 160,70 160,110 40,110" fill="none" stroke="#333" strokeWidth="1"/>
                    <polyline points="60,70 100,55 140,70 140,100 60,100" fill="none" stroke="#333" strokeWidth="1"/>
                    {/* Data line */}
                    <polyline points="30,85 120,35 170,90 150,110 50,105" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2"/>
                    <circle cx="30" cy="85" r="3" fill="#3b82f6"/>
                    <circle cx="120" cy="35" r="3" fill="#3b82f6"/>
                    <circle cx="170" cy="90" r="3" fill="#3b82f6"/>
                    <circle cx="150" cy="110" r="3" fill="#3b82f6"/>
                    <circle cx="50" cy="105" r="3" fill="#3b82f6"/>
                  </svg>
                </div>
              </div>

              {/* Code Audit History */}
              <div className={styles.auditHistorySection}>
                <h3 className={styles.subsectionTitle}>Code Audit History</h3>
                <div className={styles.auditHistoryStats}>
                  <div className={styles.auditStat}>
                    <div className={styles.auditStatNumber}>
                      {(project.critical?.found || 0) + (project.major?.found || 0) + (project.medium?.found || 0) + (project.minor?.found || 0) + (project.informational?.found || 0)}
                    </div>
                    <div className={styles.auditStatLabel}>All Findings</div>
                  </div>
                  <div className={styles.auditStat}>
                    <div className={styles.auditStatNumber}>
                      {(project.critical?.pending || 0) + (project.major?.pending || 0) + (project.medium?.pending || 0) + (project.minor?.pending || 0) + (project.informational?.pending || 0)}
                    </div>
                    <div className={styles.auditStatLabel}>Partially Resolved</div>
                  </div>
                  <div className={styles.auditStat}>
                    <div className={styles.auditStatNumber}>
                      {(project.critical?.resolved || 0) + (project.major?.resolved || 0) + (project.medium?.resolved || 0) + (project.minor?.resolved || 0) + (project.informational?.resolved || 0)}
                    </div>
                    <div className={styles.auditStatLabel}>Resolved</div>
                  </div>
                </div>

                {/* Severity Bars */}
                <div className={styles.severityBars}>
                  <div className={styles.severityBar}>
                    <span className={styles.severityDot} style={{ background: '#22c55e' }}>●</span>
                    <span className={styles.severityName}>{project.minor?.found || 0} Low</span>
                    <div className={styles.severityProgress}>
                      <div className={styles.severityFill} style={{ 
                        width: `${((project.minor?.resolved || 0) / (project.minor?.found || 1)) * 100}%`, 
                        background: '#22c55e' 
                      }}></div>
                    </div>
                    <span className={styles.severityText}>
                      {project.minor?.pending || 0} Acknowledged, {project.minor?.pending || 0} Pending, {project.minor?.resolved || 0} Resolved
                    </span>
                  </div>
                  <div className={styles.severityBar}>
                    <span className={styles.severityDot} style={{ background: '#f59e0b' }}>●</span>
                    <span className={styles.severityName}>{project.medium?.found || 0} Medium</span>
                    <div className={styles.severityProgress}>
                      <div className={styles.severityFill} style={{ 
                        width: `${((project.medium?.resolved || 0) / (project.medium?.found || 1)) * 100}%`, 
                        background: '#f59e0b' 
                      }}></div>
                    </div>
                    <span className={styles.severityText}>
                      {project.medium?.pending || 0} Acknowledged, {project.medium?.pending || 0} Pending, {project.medium?.resolved || 0} Resolved
                    </span>
                  </div>
                  <div className={styles.severityBar}>
                    <span className={styles.severityDot} style={{ background: '#f97316' }}>●</span>
                    <span className={styles.severityName}>{project.major?.found || 0} High</span>
                    <div className={styles.severityProgress}>
                      <div className={styles.severityFill} style={{ 
                        width: `${((project.major?.resolved || 0) / (project.major?.found || 1)) * 100}%`, 
                        background: '#f97316' 
                      }}></div>
                    </div>
                    <span className={styles.severityText}>
                      {project.major?.pending || 0} Acknowledged, {project.major?.pending || 0} Pending, {project.major?.resolved || 0} Resolved
                    </span>
                  </div>
                  <div className={styles.severityBar}>
                    <span className={styles.severityDot} style={{ background: '#ef4444' }}>●</span>
                    <span className={styles.severityName}>{project.critical?.found || 0} Critical</span>
                    <div className={styles.severityProgress}>
                      <div className={styles.severityFill} style={{ 
                        width: `${((project.critical?.resolved || 0) / (project.critical?.found || 1)) * 100}%`, 
                        background: '#ef4444' 
                      }}></div>
                    </div>
                    <span className={styles.severityText}>
                      {project.critical?.pending || 0} Acknowledged, {project.critical?.pending || 0} Pending, {project.critical?.resolved || 0} Resolved
                    </span>
                  </div>
                  <div className={styles.severityBar}>
                    <span className={styles.severityDot} style={{ background: '#3b82f6' }}>●</span>
                    <span className={styles.severityName}>{project.informational?.found || 0} Informational</span>
                    <div className={styles.severityProgress}>
                      <div className={styles.severityFill} style={{ 
                        width: `${((project.informational?.resolved || 0) / (project.informational?.found || 1)) * 100}%`, 
                        background: '#3b82f6' 
                      }}></div>
                    </div>
                    <span className={styles.severityText}>
                      {project.informational?.pending || 0} Acknowledged, {project.informational?.pending || 0} Pending, {project.informational?.resolved || 0} Resolved
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.auditActions}>
              {project.audit_pdf && (
                <button className={styles.auditButton} onClick={() => window.open(project.audit_pdf, '_blank')}>
                  View Audit
                </button>
              )}
              <button className={styles.auditButton} onClick={() => {
                const findingsSection = document.getElementById('cfg-findings');
                findingsSection?.scrollIntoView({ behavior: 'smooth' });
              }}>
                View Findings
              </button>
            </div>
          </div>

          {/* CFG Findings Section */}
          {project.cfg_findings && project.cfg_findings.length > 0 && (
            <div className={styles.card} id="cfg-findings">
              <h2 className={styles.cardTitle}>CFG Findings (1-25)</h2>
              <div className={styles.findingsGrid}>
                {project.cfg_findings.map((finding, index) => (
                  <div key={finding.id || index} className={styles.findingItem}>
                    <div className={styles.findingHeader}>
                      <span className={styles.findingNumber}>#{index + 1}</span>
                      <span className={`${styles.findingSeverity} ${styles[`severity${finding.severity}`]}`}>
                        {finding.severity}
                      </span>
                      <span className={`${styles.findingStatus} ${styles[`status${finding.status.replace(' ', '')}`]}`}>
                        {finding.status}
                      </span>
                    </div>
                    <h3 className={styles.findingTitle}>{finding.title}</h3>
                    <p className={styles.findingCategory}>{finding.category}</p>
                    {finding.description && (
                      <p className={styles.findingDescription}>{finding.description}</p>
                    )}
                    {finding.location && (
                      <div className={styles.findingLocation}>
                        <strong>Location:</strong> {finding.location}
                      </div>
                    )}
                    {finding.recommendation && (
                      <div className={styles.findingRecommendation}>
                        <strong>Recommendation:</strong> {finding.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
          {/* Share Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Share</h2>
            <div className={styles.qrCodeContainer}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                alt="QR Code"
                className={styles.qrCode}
              />
            </div>
            <button className={styles.shareButton} onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: project.name,
                  text: `Check out ${project.name} audit on CFG Ninja`,
                  url: window.location.href
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }
            }}>
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
