'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Text,
  Button,
  Spinner,
  makeStyles,
  tokens,
  Body1,
  Caption1,
  Badge,
} from '@fluentui/react-components';
import { projectsAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import Link from 'next/link';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    paddingTop: '40px',
    paddingBottom: '40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
    color: 'white',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '16px',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subtitle: {
    fontSize: '1.25rem',
    opacity: 0.9,
  },
  ctaButton: {
    marginTop: '24px',
    padding: '12px 32px',
    fontSize: '1.1rem',
  },
  section: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: 'white',
    marginBottom: '24px',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  projectCard: {
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    },
  },
  projectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  projectLogo: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  projectSymbol: {
    color: tokens.colorNeutralForeground2,
  },
  scoreSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  score: {
    fontSize: '2rem',
    fontWeight: '700',
  },
  stats: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.875rem',
    color: tokens.colorNeutralForeground2,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
});

export default function HomePage() {
  const styles = useStyles();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'votes' | 'views'>('recent');

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll(filter);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return tokens.colorPaletteGreenBackground3;
    if (score >= 80) return tokens.colorPaletteLightGreenBackground3;
    if (score >= 70) return tokens.colorPaletteYellowBackground3;
    return tokens.colorPaletteRedBackground3;
  };

  const getConfidenceBadge = (confidence?: string) => {
    const colors: any = {
      High: 'success',
      Medium: 'warning',
      Low: 'danger',
    };
    return confidence || 'Medium';
  };

  const mostVoted = [...projects].sort((a, b) => b.total_votes - a.total_votes).slice(0, 3);
  const mostViewed = [...projects].sort((a, b) => b.page_view - a.page_view).slice(0, 3);
  const recentlyAdded = [...projects].slice(0, 3);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="extra-large" label="Loading audit portal..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }} className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>SmartContract Development</h1>
        <p className={styles.subtitle}>
          Smart contract development & audit experts for Blockchain Networks.
          <br />
          Customized, secure and fully balanced.
        </p>
        <Button
          appearance="primary"
          size="large"
          className={styles.ctaButton}
          as="a"
          href="https://t.me/Bladepool"
          target="_blank"
        >
          Request an Audit
        </Button>
      </div>

      {mostVoted.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>⭐ Most Voted</h2>
          <div className={styles.grid}>
            {mostVoted.map((project) => (
              <Card
                key={project._id}
                className={styles.projectCard}
                onClick={() => router.push(`/${project.slug}`)}
              >
                <div className={styles.projectHeader}>
                  {project.logo && (
                    <img
                      src={project.logo}
                      alt={project.name}
                      className={styles.projectLogo}
                    />
                  )}
                  <div className={styles.projectInfo}>
                    <Text className={styles.projectName}>{project.name}</Text>
                    <Caption1 className={styles.projectSymbol}>{project.symbol}</Caption1>
                  </div>
                </div>
                <Body1>{project.description?.substring(0, 100)}...</Body1>
                <div className={styles.scoreSection}>
                  <div>
                    <Caption1>Audit Score</Caption1>
                    <Text
                      className={styles.score}
                      style={{ color: getScoreColor(project.audit_score) }}
                    >
                      {project.audit_score}
                    </Text>
                  </div>
                  <div className={styles.stats}>
                    <div>👁️ {project.page_view} Views</div>
                    <div>🗳️ {project.total_votes} Votes</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {mostViewed.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👁️ Most Viewed</h2>
          <div className={styles.grid}>
            {mostViewed.map((project) => (
              <Card
                key={project._id}
                className={styles.projectCard}
                onClick={() => router.push(`/${project.slug}`)}
              >
                <div className={styles.projectHeader}>
                  {project.logo && (
                    <img
                      src={project.logo}
                      alt={project.name}
                      className={styles.projectLogo}
                    />
                  )}
                  <div className={styles.projectInfo}>
                    <Text className={styles.projectName}>{project.name}</Text>
                    <Caption1 className={styles.projectSymbol}>{project.symbol}</Caption1>
                  </div>
                </div>
                <Body1>{project.description?.substring(0, 100)}...</Body1>
                <div className={styles.scoreSection}>
                  <div>
                    <Caption1>Audit Score</Caption1>
                    <Text
                      className={styles.score}
                      style={{ color: getScoreColor(project.audit_score) }}
                    >
                      {project.audit_score}
                    </Text>
                  </div>
                  <div className={styles.stats}>
                    <div>👁️ {project.page_view} Views</div>
                    <div>🗳️ {project.total_votes} Votes</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recentlyAdded.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🆕 Recently Added</h2>
          <div className={styles.grid}>
            {recentlyAdded.map((project) => (
              <Card
                key={project._id}
                className={styles.projectCard}
                onClick={() => router.push(`/${project.slug}`)}
              >
                <div className={styles.projectHeader}>
                  {project.logo && (
                    <img
                      src={project.logo}
                      alt={project.name}
                      className={styles.projectLogo}
                    />
                  )}
                  <div className={styles.projectInfo}>
                    <Text className={styles.projectName}>{project.name}</Text>
                    <Caption1 className={styles.projectSymbol}>{project.symbol}</Caption1>
                  </div>
                </div>
                <Body1>{project.description?.substring(0, 100)}...</Body1>
                <div className={styles.scoreSection}>
                  <div>
                    <Caption1>Audit Score</Caption1>
                    <Text
                      className={styles.score}
                      style={{ color: getScoreColor(project.audit_score) }}
                    >
                      {project.audit_score}
                    </Text>
                  </div>
                  <div className={styles.stats}>
                    <div>👁️ {project.page_view} Views</div>
                    <div>🗳️ {project.total_votes} Votes</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
