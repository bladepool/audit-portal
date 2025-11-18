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

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'HIGH RISK', className: styles.scoreHigh };
    if (score >= 80) return { label: 'GOOD', className: styles.scoreGood };
    if (score >= 70) return { label: 'PASS', className: styles.scorePass };
    return { label: 'FAIL', className: styles.scoreFail };
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

  const scoreBadge = getScoreBadge(project.finalScore || 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo} onClick={() => router.push('/')}>
            <span className={styles.logoIcon}>🛡️</span>
            <span>cfg<span className={styles.logoText}>.ninja</span></span>
          </div>
          <nav className={styles.nav}>
            <button className={styles.navButton}>Audits</button>
            <button className={styles.navButton}>Submit Project</button>
            <button className={styles.signInButton}>Sign In</button>
          </nav>
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
          <h1 className={styles.projectName}>
            {project.name}
            {project.launchpad && (
              <span className={styles.launchpad}>{project.launchpad}</span>
            )}
          </h1>
          {project.symbol && (
            <div className={styles.projectMeta}>
              <span className={styles.symbol}>${project.symbol}</span>
            </div>
          )}
          <div className={styles.socials}>
            {project.website && (
              <a href={project.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                🌐
              </a>
            )}
            {project.twitter && (
              <a href={project.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                🐦
              </a>
            )}
            {project.telegram && (
              <a href={project.telegram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                ✈️
              </a>
            )}
            {project.discord && (
              <a href={project.discord} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                💬
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Project Info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Project Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Blockchain</span>
                <span className={styles.infoValue}>{project.blockchain || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Token Type</span>
                <span className={styles.infoValue}>{project.tokenType || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Contract Address</span>
                <span className={styles.infoValue} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {project.contractAddress || 'N/A'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Deployer Address</span>
                <span className={styles.infoValue} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {project.deployerAddress || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Code Security */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Code Security</h2>
            <div className={styles.securityGrid}>
              <div className={styles.securityItem}>
                <span className={project.isOwnershipRenounced ? styles.iconPass : styles.iconFail}>
                  {project.isOwnershipRenounced ? '✓' : '✗'}
                </span>
                <span>Ownership Renounced</span>
              </div>
              <div className={styles.securityItem}>
                <span className={project.isMintable ? styles.iconFail : styles.iconPass}>
                  {project.isMintable ? '✗' : '✓'}
                </span>
                <span>Not Mintable</span>
              </div>
              <div className={styles.securityItem}>
                <span className={project.isProxy ? styles.iconFail : styles.iconPass}>
                  {project.isProxy ? '✗' : '✓'}
                </span>
                <span>No Proxy</span>
              </div>
              <div className={styles.securityItem}>
                <span className={project.hasHoneypot ? styles.iconFail : styles.iconPass}>
                  {project.hasHoneypot ? '✗' : '✓'}
                </span>
                <span>No Honeypot</span>
              </div>
              <div className={styles.securityItem}>
                <span className={project.hasBlacklist ? styles.iconFail : styles.iconPass}>
                  {project.hasBlacklist ? '✗' : '✓'}
                </span>
                <span>No Blacklist</span>
              </div>
              <div className={styles.securityItem}>
                <span className={project.hasHiddenOwner ? styles.iconFail : styles.iconPass}>
                  {project.hasHiddenOwner ? '✗' : '✓'}
                </span>
                <span>No Hidden Owner</span>
              </div>
            </div>
            <div className={styles.taxInfo}>
              <div>
                <strong>Buy Tax:</strong> {project.buyTax !== undefined ? `${project.buyTax}%` : 'N/A'}
              </div>
              <div>
                <strong>Sell Tax:</strong> {project.sellTax !== undefined ? `${project.sellTax}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Audit Findings */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Findings</h2>
            <div className={styles.findingsGrid}>
              <div className={styles.findingCard} style={{ borderColor: '#dc2626' }}>
                <h3>Critical</h3>
                <div className={styles.findingStats}>
                  <div>Found: {project.severityCriticalFound || 0}</div>
                  <div>Fixed: {project.severityCriticalFixed || 0}</div>
                  <div>Acknowledged: {project.severityCriticalAcknowledged || 0}</div>
                </div>
              </div>
              <div className={styles.findingCard} style={{ borderColor: '#ea580c' }}>
                <h3>High</h3>
                <div className={styles.findingStats}>
                  <div>Found: {project.severityHighFound || 0}</div>
                  <div>Fixed: {project.severityHighFixed || 0}</div>
                  <div>Acknowledged: {project.severityHighAcknowledged || 0}</div>
                </div>
              </div>
              <div className={styles.findingCard} style={{ borderColor: '#f59e0b' }}>
                <h3>Medium</h3>
                <div className={styles.findingStats}>
                  <div>Found: {project.severityMediumFound || 0}</div>
                  <div>Fixed: {project.severityMediumFixed || 0}</div>
                  <div>Acknowledged: {project.severityMediumAcknowledged || 0}</div>
                </div>
              </div>
              <div className={styles.findingCard} style={{ borderColor: '#eab308' }}>
                <h3>Low</h3>
                <div className={styles.findingStats}>
                  <div>Found: {project.severityLowFound || 0}</div>
                  <div>Fixed: {project.severityLowFixed || 0}</div>
                  <div>Acknowledged: {project.severityLowAcknowledged || 0}</div>
                </div>
              </div>
              <div className={styles.findingCard} style={{ borderColor: '#3b82f6' }}>
                <h3>Info</h3>
                <div className={styles.findingStats}>
                  <div>Found: {project.severityInfoFound || 0}</div>
                  <div>Fixed: {project.severityInfoFixed || 0}</div>
                  <div>Acknowledged: {project.severityInfoAcknowledged || 0}</div>
                </div>
              </div>
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
          {/* Score Card */}
          <div className={styles.scoreCard}>
            <h2 className={styles.cardTitle}>Audit Score</h2>
            <div className={styles.scoreCircle}>
              <div className={styles.scoreValue}>{project.finalScore || 0}</div>
              <span className={`${styles.scoreBadge} ${scoreBadge.className}`}>
                {scoreBadge.label}
              </span>
            </div>
            <div className={styles.confidence}>
              <div style={{ marginBottom: '0.5rem', color: '#888' }}>Confidence</div>
              <div className={styles.stars}>
                {renderStars(Math.round((project.confidenceScore || 0) / 20))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Votes</h2>
            <div className={styles.statsValue}>{project.votesCommunity || 0}</div>
          </div>

          {/* Share */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Share</h2>
            <div className={styles.shareButtons}>
              <button className={styles.shareButton}>🐦 Share on Twitter</button>
              <button className={styles.shareButton}>✈️ Share on Telegram</button>
              <button className={styles.shareButton}>📋 Copy Link</button>
            </div>
          </div>

          {/* Timeline */}
          {(project.auditStartDate || project.auditEndDate) && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Audit Timeline</h2>
              <div className={styles.infoItem} style={{ marginBottom: '1rem' }}>
                <span className={styles.infoLabel}>Start Date</span>
                <span className={styles.infoValue}>
                  {project.auditStartDate ? new Date(project.auditStartDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>End Date</span>
                <span className={styles.infoValue}>
                  {project.auditEndDate ? new Date(project.auditEndDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
