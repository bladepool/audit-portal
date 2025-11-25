'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Input,
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
  Field,
  Textarea,
} from '@fluentui/react-components';
import {
  Save24Regular,
  ArrowLeft24Regular,
  Key24Regular,
} from '@fluentui/react-icons';
import { settingsAPI } from '@/lib/api';
import Link from 'next/link';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: tokens.colorNeutralBackground3,
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
    padding: '24px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1rem',
    color: tokens.colorNeutralForeground2,
  },
  section: {
    padding: '24px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actions: {
    padding: '24px',
    display: 'flex',
    gap: '12px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    marginTop: '12px',
  },
  success: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
  },
  error: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground1,
  },
});

export default function SettingsPage() {
  const styles = useStyles();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Settings state - GitHub
  const [githubToken, setGithubToken] = useState('');
  const [githubTokenDesc, setGithubTokenDesc] = useState('GitHub Personal Access Token for uploading audit PDFs to CFG-NINJA/audits repository');
  const [githubRepoOwner, setGithubRepoOwner] = useState('CFG-NINJA');
  const [githubRepoName, setGithubRepoName] = useState('audits');
  const [githubRepoBranch, setGithubRepoBranch] = useState('main');

  // Settings state - Blockchain Scanners
  const [etherscanApiKey, setEtherscanApiKey] = useState('');
  const [bscscanApiKey, setBscscanApiKey] = useState('');
  const [polygonscanApiKey, setPolygonscanApiKey] = useState('');
  const [avalanchescanApiKey, setAvalanchescanApiKey] = useState('');

  // Settings state - Third-Party Services
  const [trustBlockApiKey, setTrustBlockApiKey] = useState('');
  const [coinMarketCapApiKey, setCoinMarketCapApiKey] = useState('');
  const [goPlusApiKey, setGoPlusApiKey] = useState('');

  // Testing states
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin');
      return;
    }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAll();
      const settings = response.data;

      // Load GitHub settings
      if (settings.github_token) {
        setGithubToken(settings.github_token.value || '');
        setGithubTokenDesc(settings.github_token.description || githubTokenDesc);
      }
      if (settings.github_repo_owner) {
        setGithubRepoOwner(settings.github_repo_owner.value || 'CFG-NINJA');
      }
      if (settings.github_repo_name) {
        setGithubRepoName(settings.github_repo_name.value || 'audits');
      }
      if (settings.github_repo_branch) {
        setGithubRepoBranch(settings.github_repo_branch.value || 'main');
      }

      // Load Blockchain Scanner API Keys
      if (settings.etherscan_api_key) {
        setEtherscanApiKey(settings.etherscan_api_key.value || '');
      }
      if (settings.bscscan_api_key) {
        setBscscanApiKey(settings.bscscan_api_key.value || '');
      }
      if (settings.polygonscan_api_key) {
        setPolygonscanApiKey(settings.polygonscan_api_key.value || '');
      }
      if (settings.avalanchescan_api_key) {
        setAvalanchescanApiKey(settings.avalanchescan_api_key.value || '');
      }

      // Load Third-Party Service API Keys
      if (settings.trustblock_api_key) {
        setTrustBlockApiKey(settings.trustblock_api_key.value || '');
      }
      if (settings.coinmarketcap_api_key) {
        setCoinMarketCapApiKey(settings.coinmarketcap_api_key.value || '');
      }
      if (settings.goplus_api_key) {
        setGoPlusApiKey(settings.goplus_api_key.value || '');
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      showMessage('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const testApiKey = async (key: string, service: string, apiKeyValue: string) => {
    if (!apiKeyValue) {
      showMessage('Please enter an API key first', 'error');
      return;
    }

    setTestingKey(key);
    setTestResults(prev => ({ ...prev, [key]: { success: false, message: 'Testing...' } }));
    
    try {
      const response = await fetch(`http://localhost:5000/api/settings/test/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKeyValue }),
      });
      
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [key]: result }));
      
      // Clear result after 5 seconds
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[key];
          return newResults;
        });
      }, 5000);
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [key]: { success: false, message: 'Test failed: ' + error.message },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const settingsToUpdate = {
        // GitHub settings
        github_token: {
          value: githubToken,
          description: githubTokenDesc
        },
        github_repo_owner: {
          value: githubRepoOwner,
          description: 'GitHub repository owner/organization'
        },
        github_repo_name: {
          value: githubRepoName,
          description: 'GitHub repository name'
        },
        github_repo_branch: {
          value: githubRepoBranch,
          description: 'GitHub repository branch'
        },
        // Blockchain Scanner API Keys
        etherscan_api_key: {
          value: etherscanApiKey,
          description: 'Etherscan API key for Ethereum mainnet'
        },
        bscscan_api_key: {
          value: bscscanApiKey,
          description: 'BSCScan API key for Binance Smart Chain'
        },
        polygonscan_api_key: {
          value: polygonscanApiKey,
          description: 'Polygonscan API key for Polygon network'
        },
        avalanchescan_api_key: {
          value: avalanchescanApiKey,
          description: 'Avalanche Scan API key'
        },
        // Third-Party Service API Keys
        trustblock_api_key: {
          value: trustBlockApiKey,
          description: 'TrustBlock API key for audit publishing'
        },
        coinmarketcap_api_key: {
          value: coinMarketCapApiKey,
          description: 'CoinMarketCap API key for market data'
        },
        goplus_api_key: {
          value: goPlusApiKey,
          description: 'GoPlus Security API key for automated checks'
        }
      };

      await settingsAPI.bulkUpdate(settingsToUpdate);
      showMessage('Settings saved successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showMessage(error.response?.data?.error || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size="large" label="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <Link href="/admin/dashboard">
            <Button icon={<ArrowLeft24Regular />} appearance="subtle">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Text className={styles.title}>Admin Settings</Text>
        <Text className={styles.subtitle}>
          Configure global settings for the audit portal
        </Text>
      </Card>

      {/* Blockchain Scanners */}
      <Card className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Key24Regular />
          Blockchain Scanner API Keys
        </Text>
        <Text style={{ marginBottom: '16px', color: tokens.colorNeutralForeground2 }}>
          Configure API keys for blockchain explorers to fetch token holder data and contract information.
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Etherscan API Key" hint="For Ethereum mainnet - Get from etherscan.io/myapikey">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                type="password"
                value={etherscanApiKey}
                onChange={(e) => setEtherscanApiKey(e.target.value)}
                placeholder="Enter Etherscan API key"
                style={{ flex: 1 }}
              />
              <Button
                appearance="secondary"
                onClick={() => testApiKey('etherscan', 'etherscan', etherscanApiKey)}
                disabled={testingKey === 'etherscan' || !etherscanApiKey}
              >
                {testingKey === 'etherscan' ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {testResults.etherscan && (
              <Text size={200} style={{ color: testResults.etherscan.success ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1 }}>
                {testResults.etherscan.message}
              </Text>
            )}
          </Field>

          <Field label="BSCScan API Key" hint="For Binance Smart Chain - Get from bscscan.com/myapikey">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                type="password"
                value={bscscanApiKey}
                onChange={(e) => setBscscanApiKey(e.target.value)}
                placeholder="Enter BSCScan API key"
                style={{ flex: 1 }}
              />
              <Button
                appearance="secondary"
                onClick={() => testApiKey('bscscan', 'bscscan', bscscanApiKey)}
                disabled={testingKey === 'bscscan' || !bscscanApiKey}
              >
                {testingKey === 'bscscan' ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {testResults.bscscan && (
              <Text size={200} style={{ color: testResults.bscscan.success ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1 }}>
                {testResults.bscscan.message}
              </Text>
            )}
          </Field>

          <Field label="Polygonscan API Key" hint="For Polygon network - Get from polygonscan.com/myapikey">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                type="password"
                value={polygonscanApiKey}
                onChange={(e) => setPolygonscanApiKey(e.target.value)}
                placeholder="Enter Polygonscan API key"
                style={{ flex: 1 }}
              />
              <Button
                appearance="secondary"
                onClick={() => testApiKey('polygonscan', 'polygonscan', polygonscanApiKey)}
                disabled={testingKey === 'polygonscan' || !polygonscanApiKey}
              >
                {testingKey === 'polygonscan' ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {testResults.polygonscan && (
              <Text size={200} style={{ color: testResults.polygonscan.success ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1 }}>
                {testResults.polygonscan.message}
              </Text>
            )}
          </Field>

          <Field label="Avalanche Scan API Key (Optional)" hint="For Avalanche network">
            <Input
              type="password"
              value={avalanchescanApiKey}
              onChange={(e) => setAvalanchescanApiKey(e.target.value)}
              placeholder="Enter Avalanche Scan API key"
            />
          </Field>
        </div>
      </Card>

      {/* Third-Party Services */}
      <Card className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Key24Regular />
          Third-Party Service API Keys
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="TrustBlock API Key" hint="For publishing audits to TrustBlock platform">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                type="password"
                value={trustBlockApiKey}
                onChange={(e) => setTrustBlockApiKey(e.target.value)}
                placeholder="Enter TrustBlock API key"
                style={{ flex: 1 }}
              />
              <Button
                appearance="secondary"
                onClick={() => testApiKey('trustblock', 'trustblock', trustBlockApiKey)}
                disabled={testingKey === 'trustblock' || !trustBlockApiKey}
              >
                {testingKey === 'trustblock' ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {testResults.trustblock && (
              <Text size={200} style={{ color: testResults.trustblock.success ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1 }}>
                {testResults.trustblock.message}
              </Text>
            )}
          </Field>

          <Field label="CoinMarketCap API Key (Optional)" hint="For fetching market data">
            <Input
              type="password"
              value={coinMarketCapApiKey}
              onChange={(e) => setCoinMarketCapApiKey(e.target.value)}
              placeholder="Enter CoinMarketCap API key"
            />
          </Field>

          <Field label="GoPlus Security API Key (Optional)" hint="For automated security checks">
            <Input
              type="password"
              value={goPlusApiKey}
              onChange={(e) => setGoPlusApiKey(e.target.value)}
              placeholder="Enter GoPlus API key"
            />
          </Field>
        </div>
      </Card>

      {/* GitHub Integration */}
      <Card className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Key24Regular />
          GitHub Integration
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="GitHub Personal Access Token" required hint="Token with 'repo' scope for uploading PDFs">
            <Input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            />
          </Field>
          
          <Field label="Description (Optional)">
            <Textarea
              value={githubTokenDesc}
              onChange={(e) => setGithubTokenDesc(e.target.value)}
              rows={2}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Repository Owner">
              <Input
                value={githubRepoOwner}
                onChange={(e) => setGithubRepoOwner(e.target.value)}
                placeholder="CFG-NINJA"
              />
            </Field>
            
            <Field label="Repository Name">
              <Input
                value={githubRepoName}
                onChange={(e) => setGithubRepoName(e.target.value)}
                placeholder="audits"
              />
            </Field>
          </div>

          <Field label="Branch">
            <Input
              value={githubRepoBranch}
              onChange={(e) => setGithubRepoBranch(e.target.value)}
              placeholder="main"
            />
          </Field>

          <div style={{ 
            padding: '12px', 
            backgroundColor: tokens.colorNeutralBackground4, 
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>
              How to get a GitHub token:
            </Text>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select scope: ✅ repo (Full control of private repositories)</li>
              <li>Generate and copy the token (starts with ghp_)</li>
            </ol>
            <Text style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground2 }}>
              Token will be used globally for all PDF uploads from the admin portal.
            </Text>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className={styles.actions}>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Link href="/admin/dashboard">
          <Button appearance="subtle">Cancel</Button>
        </Link>
      </Card>

      {message && (
        <Card className={`${styles.message} ${messageType === 'success' ? styles.success : styles.error}`}>
          <Text>{message}</Text>
        </Card>
      )}
    </div>
  );
}
