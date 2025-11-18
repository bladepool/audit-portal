'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectsAPI } from '../lib/api';
import styles from './page.module.css';

interface Project {
  _id: string;
  name: string;
  slug: string;
  symbol: string;
  logo?: string;
  ecosystem: string;
  audit_score: number;
  total_votes: number;
  total_issues: number;
  audit_confidence: number;
  published: boolean;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score / 20);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < fullStars ? styles.starFilled : styles.starEmpty}>
          ★
        </span>
      );
    }
    return stars;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <span className={styles.badgeHigh}>HIGH</span>;
    if (score >= 70) return <span className={styles.badgeMedium}>GOOD</span>;
    if (score >= 50) return <span className={styles.badgeLow}>PASS</span>;
    return <span className={styles.badgeFail}>FAIL</span>;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🛡️</span>
            <span className={styles.logoText}>CFG.NINJA</span>
          </div>
          <nav className={styles.nav}>
            <button className={styles.navButton}>Request Audit</button>
            <button className={styles.navButton}>🔍</button>
            <button className={styles.signInButton} onClick={() => router.push('/admin')}>Sign in</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Smart<br />Contract<br />Development.</h1>
            <p className={styles.heroSubtitle}>
              Smart contract development is a skill unique to Blockchain Networks.
              Customized, secure and fully balanced.
            </p>
            <button className={styles.requestButton}>Request an Audit</button>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.shieldIcon}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <path d="M100 20 L160 50 L160 120 C160 150 130 170 100 180 C70 170 40 150 40 120 L40 50 Z" 
                      fill="#ef4444" opacity="0.2" stroke="#ef4444" strokeWidth="2"/>
                <path d="M80 100 L95 115 L120 85" 
                      stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Most Voted</h3>
            <div className={styles.statItems}>
              {projects.slice(0, 3).map((project, index) => (
                <div key={project._id} className={styles.statItem}>
                  <span className={styles.statRank}>{index + 1}</span>
                  <span className={styles.statName}>{project.name}</span>
                  <span className={styles.statBadge}>{getScoreBadge(project.audit_score)}</span>
                  <span className={styles.statVotes}>{project.total_votes} Votes</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Most Viewed</h3>
            <div className={styles.statItems}>
              {projects.slice(0, 3).map((project, index) => (
                <div key={project._id} className={styles.statItem}>
                  <span className={styles.statRank}>{index + 1}</span>
                  <span className={styles.statName}>{project.name}</span>
                  <span className={styles.statBadge}>{getScoreBadge(project.audit_score)}</span>
                  <span className={styles.statVotes}>{project.total_votes} Votes</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Recently Added</h3>
            <div className={styles.statItems}>
              {projects.slice(0, 3).map((project, index) => (
                <div key={project._id} className={styles.statItem}>
                  <span className={styles.statRank}>{index + 1}</span>
                  <span className={styles.statName}>{project.name}</span>
                  <span className={styles.statBadge}>{getScoreBadge(project.audit_score)}</span>
                  <span className={styles.statVotes}>0 Votes</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audits Table */}
      <section className={styles.auditsSection}>
        <div className={styles.auditsHeader}>
          <h2 className={styles.auditsTitle}>Audits</h2>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading audits...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Ecosystem</th>
                  <th>Symbol</th>
                  <th>Total Votes</th>
                  <th>Audit Confidence</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr 
                    key={project._id} 
                    onClick={() => router.push(`/${project.slug}`)}
                    className={styles.tableRow}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.projectName}>
                        {project.logo && (
                          <img src={project.logo} alt={project.name} className={styles.projectLogo} />
                        )}
                        <span>{project.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.scoreBadge}>
                        {getScoreBadge(project.audit_score)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.ecosystem}>{project.ecosystem || 'BINANCE SMART CHAIN'}</span>
                    </td>
                    <td>{project.symbol}</td>
                    <td>{project.total_votes || 0}</td>
                    <td>
                      <div className={styles.confidence}>
                        {renderStars(project.audit_confidence || project.audit_score)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className={styles.pagination}>
          <span className={styles.paginationText}>Showing 1-10 out of {projects.length}</span>
          <div className={styles.paginationButtons}>
            <button className={styles.paginationButton}>Prev</button>
            <button className={styles.paginationButton}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
