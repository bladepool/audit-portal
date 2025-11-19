'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectsAPI, marketCapAPI } from '../lib/api';
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
  informational?: { found: number; pending: number; resolved: number };
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
  securedMarketCap: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalPass: 0,
    totalFail: 0,
    averageScore: 0,
    totalIssuesFound: 0,
    totalIssuesResolved: 0,
    criticalIssues: 0,
    highRiskProjects: 0,
    securedMarketCap: '$2.5B',
  });

  useEffect(() => {
    fetchProjects();
    fetchMarketCap();
    fetchPortfolioStats();
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      const projectsData = response.data; // All published projects from API
      setProjects(projectsData);
      calculateStats(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioStats = async () => {
    try {
      const response = await projectsAPI.getStats();
      const statsData = response.data;
      
      setStats(prev => ({
        ...prev,
        totalProjects: statsData.totalProjects,
        totalIssuesFound: statsData.findings.total,
        criticalIssues: statsData.findings.critical,
      }));
    } catch (error) {
      console.error('Error fetching portfolio stats:', error);
    }
  };

  const fetchMarketCap = async () => {
    try {
      const response = await marketCapAPI.getSecured();
      setStats(prev => ({
        ...prev,
        securedMarketCap: response.data.formatted || '$2.5B'
      }));
    } catch (error) {
      console.error('Error fetching market cap:', error);
      // Keep default value
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

    setStats(prev => ({
      ...prev,
      totalProjects,
      totalPass,
      totalFail,
      averageScore,
      totalIssuesFound,
      totalIssuesResolved,
      criticalIssues,
      highRiskProjects,
    }));
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

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.symbol?.toLowerCase().includes(query) ||
      project.slug?.toLowerCase().includes(query) ||
      project.ecosystem?.toLowerCase().includes(query) ||
      project.platform?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
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
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search projects"
            >
              🔍
            </button>
          </nav>
        </div>
        {searchOpen && (
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search projects by name, symbol, ecosystem, or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            <button 
              className={styles.searchClose} 
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            >
              ✕
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Smart Contract<br />Development.</h1>
            <p className={styles.heroSubtitle}>
              Smart contract development & audit experts for Blockchain Networks. 
              Customized, secure and fully balanced.
            </p>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.animatedGraphic}>
              {/* Rotating gears */}
              <div className={styles.gear1}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <path d="M40 10 L45 20 L55 20 L60 10 L65 15 L70 25 L70 35 L65 45 L55 50 L45 50 L35 50 L25 45 L20 35 L20 25 L25 15 L30 10 Z" 
                        fill="#333" stroke="#444" strokeWidth="2"/>
                  <circle cx="40" cy="30" r="8" fill="#555"/>
                </svg>
              </div>
              
              <div className={styles.gear2}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <path d="M30 5 L35 12 L42 12 L47 5 L50 10 L55 18 L55 25 L50 33 L42 37 L35 37 L28 37 L20 33 L15 25 L15 18 L20 10 L23 5 Z" 
                        fill="#333" stroke="#444" strokeWidth="2"/>
                  <circle cx="30" cy="22" r="6" fill="#555"/>
                </svg>
              </div>

              {/* Documents */}
              <div className={styles.document1}>
                <svg width="50" height="60" viewBox="0 0 50 60">
                  <rect x="5" y="5" width="40" height="50" fill="#fff" stroke="#ccc" strokeWidth="1" rx="2"/>
                  <rect x="35" y="5" width="10" height="10" fill="#ef4444"/>
                  <line x1="12" y1="20" x2="38" y2="20" stroke="#ddd" strokeWidth="2"/>
                  <line x1="12" y1="28" x2="38" y2="28" stroke="#ddd" strokeWidth="2"/>
                  <line x1="12" y1="36" x2="30" y2="36" stroke="#ddd" strokeWidth="2"/>
                </svg>
              </div>

              <div className={styles.document2}>
                <svg width="50" height="60" viewBox="0 0 50 60">
                  <rect x="5" y="5" width="40" height="50" fill="#fff" stroke="#ccc" strokeWidth="1" rx="2"/>
                  <rect x="35" y="5" width="10" height="10" fill="#ef4444"/>
                  <line x1="12" y1="20" x2="38" y2="20" stroke="#ddd" strokeWidth="2"/>
                  <line x1="12" y1="28" x2="38" y2="28" stroke="#ddd" strokeWidth="2"/>
                </svg>
              </div>

              {/* Main Shield with Checkmark */}
              <div className={styles.mainShield}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {/* Red circle background */}
                  <circle cx="90" cy="90" r="70" fill="#ef4444" className={styles.pulseCircle}/>
                  
                  {/* Shield */}
                  <path d="M90 30 L130 50 L130 100 C130 120 110 135 90 142 C70 135 50 120 50 100 L50 50 Z" 
                        fill="#fff" stroke="#ddd" strokeWidth="2"/>
                  
                  {/* Inner shield gradient */}
                  <path d="M90 40 L120 55 L120 95 C120 110 105 120 90 125 C75 120 60 110 60 95 L60 55 Z" 
                        fill="url(#shieldGradient)"/>
                  
                  {/* Checkmark */}
                  <path d="M75 90 L85 100 L105 75" 
                        stroke="#ef4444" strokeWidth="6" fill="none" 
                        strokeLinecap="round" strokeLinejoin="round"
                        className={styles.checkmark}/>
                  
                  <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f5f5f5"/>
                      <stop offset="100%" stopColor="#e0e0e0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Settings Icon */}
              <div className={styles.settingsIcon}>
                <svg width="50" height="50" viewBox="0 0 50 50">
                  <path d="M25 15 L28 20 L33 20 L36 15 L38 17 L40 22 L40 28 L38 33 L33 36 L28 36 L23 36 L18 33 L16 28 L16 22 L18 17 L20 15 Z" 
                        fill="#ef4444" stroke="#ef4444" strokeWidth="1"/>
                  <circle cx="25" cy="25" r="5" fill="#fff"/>
                </svg>
              </div>

              {/* Floating Dots */}
              <div className={styles.dot1}></div>
              <div className={styles.dot2}></div>
              <div className={styles.dot3}></div>
              <div className={styles.dot4}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Stats Dashboard */}
      <section className={styles.globalStats}>
        <h2 className={styles.insightsTitle}>Audit Portfolio Insights</h2>
        <div className={styles.statsContainer}>
          {/* Total Audits Card */}
          <div className={styles.statCard2}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel2}>Total Audits</span>
              <span className={styles.infoIcon}>ⓘ</span>
            </div>
            <div className={styles.statValue2}>{stats.totalProjects}</div>
          </div>

          {/* Findings by Severity - Donut Chart */}
          <div className={styles.statCard2Large}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel2}>Findings by Severity</span>
              <span className={styles.infoIcon}>ⓘ</span>
            </div>
            <div className={styles.chartContainer}>
              {(() => {
                const total = stats.totalIssuesFound || 1;
                const criticalPct = (stats.criticalIssues / total) * 100;
                const highPct = (projects.reduce((sum, p) => sum + (p.major?.found || 0), 0) / total) * 100;
                const mediumPct = (projects.reduce((sum, p) => sum + (p.medium?.found || 0), 0) / total) * 100;
                const lowPct = (projects.reduce((sum, p) => sum + (p.minor?.found || 0) + ((p as any).informational?.found || 0), 0) / total) * 100;
                
                return (
                  <>
                    <div className={styles.chartLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{background: '#ef4444'}}></span>
                        <span className={styles.legendText}>Critical</span>
                        <span className={styles.legendValue}>{stats.criticalIssues} ({Math.round(criticalPct)}%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{background: '#f97316'}}></span>
                        <span className={styles.legendText}>High</span>
                        <span className={styles.legendValue}>{projects.reduce((sum, p) => sum + (p.major?.found || 0), 0)} ({Math.round(highPct)}%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{background: '#f59e0b'}}></span>
                        <span className={styles.legendText}>Medium</span>
                        <span className={styles.legendValue}>{projects.reduce((sum, p) => sum + (p.medium?.found || 0), 0)} ({Math.round(mediumPct)}%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{background: '#3b82f6'}}></span>
                        <span className={styles.legendText}>Observation</span>
                        <span className={styles.legendValue}>{projects.reduce((sum, p) => sum + (p.minor?.found || 0) + ((p as any).informational?.found || 0), 0)} ({Math.round(lowPct)}%)</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Audits by Platform - Donut Chart */}
          <div className={styles.statCard2Large}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel2}>Audits By Platform</span>
              <span className={styles.infoIcon}>ⓘ</span>
            </div>
            <div className={styles.chartContainer}>
              <svg className={styles.donutChart} viewBox="0 0 200 200">
                {(() => {
                  const platforms = projects.reduce((acc, p) => {
                    const platform = p.platform || 'Other';
                    acc[platform] = (acc[platform] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const total = Object.values(platforms).reduce((sum, count) => sum + count, 0);
                  const colors = ['#3b82f6', '#1e40af', '#06b6d4', '#0891b2', '#8b5cf6'];
                  let offset = 0;
                  
                  return Object.entries(platforms).map(([platform, count], index) => {
                    const percentage = (count / total) * 502;
                    const color = colors[index % colors.length];
                    const circle = (
                      <circle 
                        key={platform}
                        cx="100" cy="100" r="80" fill="none" 
                        stroke={color} 
                        strokeWidth="40" 
                        strokeDasharray={`${percentage} 502`} 
                        strokeDashoffset={`-${offset}`} 
                        transform="rotate(-90 100 100)" 
                      />
                    );
                    offset += percentage;
                    return circle;
                  });
                })()}
              </svg>
              <div className={styles.chartLegend}>
                {Object.entries(projects.reduce((acc, p) => {
                  const platform = p.platform || 'Other';
                  acc[platform] = (acc[platform] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([platform, count], index) => (
                  <div key={platform} className={styles.legendItem}>
                    <span className={styles.legendColor} style={{background: ['#3b82f6', '#1e40af', '#06b6d4', '#0891b2', '#8b5cf6'][index % 5]}}></span>
                    <span className={styles.legendText}>{platform}</span>
                    <span className={styles.legendValue}>{count} ({Math.round((count / stats.totalProjects) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secured Market Cap Card */}
          <div className={styles.statCard2}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel2}>Secured Market Cap</span>
              <span className={styles.infoIcon} title="Total market capitalization of audited projects">ⓘ</span>
            </div>
            <div className={styles.statValue2}>{stats.securedMarketCap}</div>
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
          <h2 className={styles.auditsTitle}>
            Audits {searchQuery && `(${filteredProjects.length} results)`}
          </h2>
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
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                      {searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects found'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((project, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr 
                          key={project._id} 
                          onClick={() => router.push(`/${project.slug}`)}
                          className={styles.tableRow}
                        >
                          <td>{globalIndex}</td>
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
                            <span className={styles.ecosystem}>{project.platform || 'BINANCE SMART CHAIN'}</span>
                          </td>
                          <td>{project.symbol}</td>
                          <td>{project.total_votes || 0}</td>
                        <td>
                          <div className={styles.confidence}>
                            {renderStars(project.audit_confidence || project.audit_score)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className={styles.pagination}>
          <span className={styles.paginationText}>
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProjects.length)} out of {filteredProjects.length}
          </span>
          <div className={styles.paginationButtons}>
            <button 
              className={styles.paginationButton}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className={styles.pageNumber}>Page {currentPage} of {Math.ceil(filteredProjects.length / itemsPerPage)}</span>
            <button 
              className={styles.paginationButton}
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProjects.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(filteredProjects.length / itemsPerPage)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
