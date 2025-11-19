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
  platform?: string;
  audit_score: number;
  auditStatus?: string;
  total_votes: number;
  page_view?: number;
  total_issues: number;
  audit_confidence: string;
  published: boolean;
  createdAt?: string;
  critical?: { found: number; pending: number; resolved: number };
  major?: { found: number; pending: number; resolved: number };
  medium?: { found: number; pending: number; resolved: number };
  minor?: { found: number; pending: number; resolved: number };
}

interface Stats {
  totalProjects: number;
  totalPass: number;
  totalFail: number;
  averageScore: number;
  totalIssuesFound: number;
  totalIssuesResolved: number;
  criticalIssues: number;
  highRiskProjects: number;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalPass: 0,
    totalFail: 0,
    averageScore: 0,
    totalIssuesFound: 0,
    totalIssuesResolved: 0,
    criticalIssues: 0,
    highRiskProjects: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      const projectsData = response.data.filter((p: Project) => p.published);
      setProjects(projectsData);
      calculateStats(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsData: Project[]) => {
    const totalProjects = projectsData.length;
    const totalPass = projectsData.filter(p => 
      p.auditStatus === 'Pass' || p.audit_score >= 70
    ).length;
    const totalFail = totalProjects - totalPass;
    
    const averageScore = projectsData.length > 0
      ? Math.round(projectsData.reduce((sum, p) => sum + (p.audit_score || 0), 0) / projectsData.length)
      : 0;

    let totalIssuesFound = 0;
    let totalIssuesResolved = 0;
    let criticalIssues = 0;
    let highRiskProjects = 0;

    projectsData.forEach(p => {
      const critical = p.critical?.found || 0;
      const major = p.major?.found || 0;
      const medium = p.medium?.found || 0;
      const minor = p.minor?.found || 0;
      
      totalIssuesFound += critical + major + medium + minor;
      totalIssuesResolved += (p.critical?.resolved || 0) + (p.major?.resolved || 0) + 
                             (p.medium?.resolved || 0) + (p.minor?.resolved || 0);
      
      criticalIssues += critical;
      if (critical > 0 || major > 2) highRiskProjects++;
    });

    setStats({
      totalProjects,
      totalPass,
      totalFail,
      averageScore,
      totalIssuesFound,
      totalIssuesResolved,
      criticalIssues,
      highRiskProjects,
    });
  };

  const renderStars = (confidence: string | number) => {
    const stars = [];
    let fullStars = 3; // default
    
    if (typeof confidence === 'string') {
      const confMap: { [key: string]: number } = {
        'Very High': 5,
        'High': 4,
        'Medium': 3,
        'Low': 2,
        'Very Low': 1
      };
      fullStars = confMap[confidence] || 3;
    } else {
      fullStars = Math.floor(confidence / 20);
    }
    
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
            <img 
              src="/pdf-assets/logos/CFG-Logo-red-black-FULL.png" 
              alt="CFG Ninja" 
              className={styles.logoImage}
            />
          </div>
          <nav className={styles.nav}>
            <button className={styles.navButton} onClick={() => window.open('https://t.me/Bladepool', '_blank')}>
              Request an Audit
            </button>
            <button className={styles.searchButton}>🔍</button>
            <span className={styles.qualityBadge}>HIGH QUALITY AUDIT</span>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Smart<br />Contract<br />Development.</h1>
            <p className={styles.heroSubtitle}>
              Smart contract development & audit experts for Blockchain Networks. 
              Customized, secure and fully balanced.
            </p>
            <button 
              className={styles.requestButton}
              onClick={() => window.open('https://t.me/Bladepool', '_blank')}
            >
              Request an Audit
            </button>
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

      {/* Global Stats Dashboard */}
      <section className={styles.globalStats}>
        <div className={styles.statsContainer}>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statValue}>{stats.totalProjects}</div>
            <div className={styles.statLabel}>Total Audits</div>
          </div>
          
          <div className={styles.statBox}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statValue}>{stats.totalPass}</div>
            <div className={styles.statLabel}>Passed Audits</div>
            <div className={styles.statPercentage}>
              {stats.totalProjects > 0 ? Math.round((stats.totalPass / stats.totalProjects) * 100) : 0}%
            </div>
          </div>
          
          <div className={styles.statBox}>
            <div className={styles.statIcon}>❌</div>
            <div className={styles.statValue}>{stats.totalFail}</div>
            <div className={styles.statLabel}>Failed Audits</div>
            <div className={styles.statPercentage}>
              {stats.totalProjects > 0 ? Math.round((stats.totalFail / stats.totalProjects) * 100) : 0}%
            </div>
          </div>
          
          <div className={styles.statBox}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statValue}>{stats.averageScore}</div>
            <div className={styles.statLabel}>Average Score</div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>🔥 Most Voted</h3>
            <div className={styles.statItems}>
              {projects
                .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
                .slice(0, 5)
                .map((project, index) => (
                <div key={project._id} className={styles.statItem} onClick={() => router.push(`/${project.slug}`)}>
                  <span className={styles.statRank}>#{index + 1}</span>
                  <img src={project.logo || '/default-logo.png'} alt={project.name} className={styles.statLogo} />
                  <span className={styles.statName}>{project.name}</span>
                  <span className={styles.statBadge}>{getScoreBadge(project.audit_score)}</span>
                  <span className={styles.statVotes}>👍 {project.total_votes || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>👀 Most Viewed</h3>
            <div className={styles.statItems}>
              {projects
                .sort((a, b) => (b.page_view || 0) - (a.page_view || 0))
                .slice(0, 5)
                .map((project, index) => (
                <div key={project._id} className={styles.statItem} onClick={() => router.push(`/${project.slug}`)}>
                  <span className={styles.statRank}>#{index + 1}</span>
                  <img src={project.logo || '/default-logo.png'} alt={project.name} className={styles.statLogo} />
                  <span className={styles.statName}>{project.name}</span>
                  <span className={styles.statBadge}>{getScoreBadge(project.audit_score)}</span>
                  <span className={styles.statVotes}>👁️ {project.page_view || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>🆕 Recently Added</h3>
            <div className={styles.statItems}>
              {projects
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 5)
                .map((project, index) => (
                <div key={project._id} className={styles.statItem} onClick={() => router.push(`/${project.slug}`)}>
                  <span className={styles.statRank}>#{index + 1}</span>
                  <img src={project.logo || '/default-logo.png'} alt={project.name} className={styles.statLogo} />
                  <span className={styles.statName}>{project.name}</span>
                  <span className={styles.statBadge}>{getScoreBadge(project.audit_score)}</span>
                  <span className={styles.statVotes}>⭐ {project.audit_score}</span>
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
