'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Divider,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  Globe24Regular,
  Chat24Regular,
} from '@fluentui/react-icons';
import { projectsAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    paddingTop: '40px',
    paddingBottom: '40px',
  },
  header: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  projectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '24px',
  },
  logo: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  launchpadBadge: {
    display: 'inline-block',
    marginLeft: '16px',
  },
  socials: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  socialLink: {
    fontSize: '1.5rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  scoreCard: {
    textAlign: 'center',
    padding: '32px',
  },
  scoreValue: {
    fontSize: '4rem',
    fontWeight: '700',
    marginBottom: '8px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  findingsSection: {
    marginTop: '24px',
  },
  findingCard: {
    marginBottom: '12px',
    padding: '16px',
    borderLeft: '4px solid',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '40px',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '24px',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '-32px',
      top: '8px',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: tokens.colorBrandBackground,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '-24px',
      top: '24px',
      width: '2px',
      height: 'calc(100% - 16px)',
      background: tokens.colorNeutralStroke2,
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
});

export default function ProjectPage() {
  const styles = useStyles();
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      loadProject(params.slug as string);
    }
  }, [params.slug]);

  const loadProject = async (slug: string) => {
    try {
      setLoading(true);
      const response = await projectsAPI.getBySlug(slug);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return tokens.colorPaletteGreenForeground1;
    if (score >= 80) return tokens.colorPaletteLightGreenForeground1;
    if (score >= 70) return tokens.colorPaletteYellowForeground1;
    return tokens.colorPaletteRedForeground1;
  };

  const getSeverityColor = (severity: string) => {
    const colors: any = {
      critical: tokens.colorPaletteRedBackground3,
      major: tokens.colorPaletteDarkOrangeBackground3,
      medium: tokens.colorPaletteYellowBackground3,
      minor: tokens.colorPaletteLightGreenBackground3,
      informational: tokens.colorPaletteBlueBackground2,
    };
    return colors[severity.toLowerCase()] || tokens.colorNeutralBackground3;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="extra-large" label="Loading project..." />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const chartData = project.score_history?.data?.map((score, index) => ({
    name: `V${index + 1}`,
    score,
  })) || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }} className={styles.container}>
      <div className={styles.header}>
        <div className={styles.projectHeader}>
          {project.logo && (
            <img src={project.logo} alt={project.name} className={styles.logo} />
          )}
          <div className={styles.projectInfo}>
            <h1 className={styles.projectName}>
              {project.name}
              {project.launchpad && (
                <Badge className={styles.launchpadBadge} appearance="filled">
                  {project.launchpad}
                </Badge>
              )}
            </h1>
            <Text size={500}>{project.symbol}</Text>
            <div className={styles.socials}>
              {project.socials.website && (
                <a href={project.socials.website} target="_blank" rel="noopener noreferrer">
                  🌐
                </a>
              )}
              {project.socials.telegram && (
                <a href={project.socials.telegram} target="_blank" rel="noopener noreferrer">
                  💬
                </a>
              )}
              {project.socials.twitter && (
                <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer">
                  🐦
                </a>
              )}
              {project.socials.github && (
                <a href={project.socials.github} target="_blank" rel="noopener noreferrer">
                  💻
                </a>
              )}
            </div>
          </div>
        </div>
        <ReactMarkdown>{project.description}</ReactMarkdown>
      </div>

      <div className={styles.grid}>
        <Card className={styles.scoreCard}>
          <Caption1>Audit Security Score</Caption1>
          <Text
            className={styles.scoreValue}
            style={{ color: getScoreColor(project.audit_score) }}
          >
            {project.audit_score}%
          </Text>
          <Badge appearance="filled" color={project.audit_confidence === 'High' ? 'success' : 'warning'}>
            {project.audit_confidence} Confidence
          </Badge>
          {chartData.length > 0 && (
            <div style={{ marginTop: '24px', height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke={tokens.colorBrandBackground} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <Text size={600} weight="semibold">Token Analysis</Text>
          <Divider style={{ margin: '16px 0' }} />
          <div className={styles.infoGrid}>
            <div>
              <Caption1>Token Name</Caption1>
              <Body1>{project.name}</Body1>
            </div>
            <div>
              <Caption1>Symbol</Caption1>
              <Body1>{project.symbol}</Body1>
            </div>
            <div>
              <Caption1>Decimals</Caption1>
              <Body1>{project.decimals}</Body1>
            </div>
            <div>
              <Caption1>Total Supply</Caption1>
              <Body1>{project.supply}</Body1>
            </div>
            <div>
              <Caption1>Platform</Caption1>
              <Body1>{project.platform}</Body1>
            </div>
            <div>
              <Caption1>Verified</Caption1>
              <Body1>{project.contract_info.contract_verified ? '✅ Yes' : '❌ No'}</Body1>
            </div>
          </div>
        </Card>

        <Card>
          <Text size={600} weight="semibold">Page Statistics</Text>
          <Divider style={{ margin: '16px 0' }} />
          <div style={{ fontSize: '2rem', textAlign: 'center', margin: '24px 0' }}>
            👁️ {project.page_view} Views
          </div>
          <div style={{ fontSize: '2rem', textAlign: 'center', margin: '24px 0' }}>
            🗳️ {project.total_votes} Votes
          </div>
        </Card>
      </div>

      <Card>
        <Text size={600} weight="semibold">Manual Code Review Risk Results</Text>
        <Divider style={{ margin: '16px 0' }} />
        <div className={styles.infoGrid}>
          {[
            { label: 'Can Mint?', value: project.overview.mint },
            { label: 'Edit Taxes over 25%', value: project.overview.modify_tax },
            { label: 'Max Transaction', value: project.overview.max_transaction },
            { label: 'Max Wallet', value: project.overview.max_wallet },
            { label: 'Enable Trade', value: project.overview.enable_trading },
            { label: 'Honeypot', value: project.overview.honeypot },
            { label: 'Trading Cooldown', value: project.overview.trading_cooldown },
            { label: 'Transfer Pausable', value: project.overview.pause_transfer },
            { label: 'Can Pause Trade?', value: project.overview.pause_trade },
            { label: 'Anti Bot', value: project.overview.anti_bot },
            { label: 'Antiwhale', value: project.overview.anit_whale },
            { label: 'Proxy Contract', value: project.overview.proxy_check },
            { label: 'Blacklisted', value: project.overview.blacklist },
            { label: 'Hidden Ownership', value: project.overview.hidden_owner },
            { label: 'Self-destruct', value: project.overview.self_destruct },
            { label: 'Whitelisted', value: project.overview.whitelist },
            { label: 'External Call', value: project.overview.external_call },
          ].map((item) => (
            <div key={item.label} className={styles.checkItem}>
              {item.value ? (
                <DismissCircle24Regular color={tokens.colorPaletteRedForeground1} />
              ) : (
                <CheckmarkCircle24Regular color={tokens.colorPaletteGreenForeground1} />
              )}
              <Text>{item.label}</Text>
            </div>
          ))}
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div className={styles.infoGrid}>
          <div>
            <Caption1>Buy Tax</Caption1>
            <Body1>{project.overview.buy_tax}%</Body1>
          </div>
          <div>
            <Caption1>Sell Tax</Caption1>
            <Body1>{project.overview.sell_tax}%</Body1>
          </div>
        </div>
      </Card>

      <Card>
        <Text size={600} weight="semibold">Audit History</Text>
        <Divider style={{ margin: '16px 0' }} />
        <div className={styles.grid}>
          {[
            { label: 'Critical', data: project.critical, color: tokens.colorPaletteRedBackground3 },
            { label: 'High', data: project.major, color: tokens.colorPaletteDarkOrangeBackground3 },
            { label: 'Medium', data: project.medium, color: tokens.colorPaletteYellowBackground3 },
            { label: 'Low', data: project.minor, color: tokens.colorPaletteLightGreenBackground3 },
            { label: 'Informational', data: project.informational, color: tokens.colorPaletteBlueBackground2 },
          ].map((severity) => (
            <div key={severity.label} style={{ padding: '16px', background: severity.color, borderRadius: '8px' }}>
              <Text size={500} weight="semibold">{severity.label}</Text>
              <div style={{ marginTop: '12px' }}>
                <Body1>Found: {severity.data.found}</Body1>
                <Body1>Pending: {severity.data.pending}</Body1>
                <Body1>Resolved: {severity.data.resolved}</Body1>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {project.timeline && (
        <Card>
          <Text size={600} weight="semibold">Timeline</Text>
          <Divider style={{ margin: '16px 0' }} />
          <div className={styles.timeline}>
            {project.timeline.audit_request && (
              <div className={styles.timelineItem}>
                <Caption1>Audit Request</Caption1>
                <Body1>{project.timeline.audit_request}</Body1>
              </div>
            )}
            {project.timeline.onboarding_process && (
              <div className={styles.timelineItem}>
                <Caption1>Onboarding Process</Caption1>
                <Body1>{project.timeline.onboarding_process}</Body1>
              </div>
            )}
            {project.timeline.audit_preview && (
              <div className={styles.timelineItem}>
                <Caption1>Audit Preview</Caption1>
                <Body1>{project.timeline.audit_preview}</Body1>
              </div>
            )}
            {project.timeline.audit_release && (
              <div className={styles.timelineItem}>
                <Caption1>Audit Release</Caption1>
                <Body1>{project.timeline.audit_release}</Body1>
              </div>
            )}
          </div>
        </Card>
      )}

      {project.contract_info && (
        <Card>
          <Text size={600} weight="semibold">Contract Information</Text>
          <Divider style={{ margin: '16px 0' }} />
          <div className={styles.infoGrid}>
            <div>
              <Caption1>Contract Name</Caption1>
              <Body1>{project.contract_info.contract_name}</Body1>
            </div>
            <div>
              <Caption1>Language</Caption1>
              <Body1>{project.contract_info.contract_language}</Body1>
            </div>
            <div>
              <Caption1>Compiler</Caption1>
              <Body1>{project.contract_info.contract_compiler}</Body1>
            </div>
            <div>
              <Caption1>License</Caption1>
              <Body1>{project.contract_info.contract_license}</Body1>
            </div>
            <div>
              <Caption1>Owner Address</Caption1>
              <Body1 style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {project.contract_info.contract_owner}
              </Body1>
            </div>
            <div>
              <Caption1>Contract Address</Caption1>
              <Body1 style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {project.contract_info.contract_address}
              </Body1>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
