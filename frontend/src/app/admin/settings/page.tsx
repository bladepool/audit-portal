"use client";

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
import { settingsAPI, telegramAPI } from '@/lib/api';
import Link from 'next/link';
// ...existing code...

import api from '@/lib/api';

// Ensure a test helper exists on settingsAPI for testing API keys
if (!settingsAPI.test) {
  settingsAPI.test = (service: string, apiKey: string) => api.post(`/settings/test/${service}`, { apiKey });
}


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
  // Admin token for backend admin actions (saved but not shown by default)
  const [adminToken, setAdminToken] = useState('');

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

  // Settings state - IPFS Storage Providers
  const [tatumApiKey, setTatumApiKey] = useState('');
  const [pinataApiKey, setPinataApiKey] = useState('');
  const [pinataSecretKey, setPinataSecretKey] = useState('');
  const [pinataJwt, setPinataJwt] = useState('');
  const [web3StorageToken, setWeb3StorageToken] = useState('');
  const [nftStorageToken, setNftStorageToken] = useState('');


  // Settings state - Telegram Bot
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramBotUsername, setTelegramBotUsername] = useState('');
  const [telegramAdminUserId, setTelegramAdminUserId] = useState('');
  const [telegramWebhookUrl, setTelegramWebhookUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiApiKeyDesc, setGeminiApiKeyDesc] = useState('Gemini API key for AI message generation');
  const [allowBotCreateGroup, setAllowBotCreateGroup] = useState(false);

  // Telegram bot status
  const [telegramStatus, setTelegramStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [telegramStatusMsg, setTelegramStatusMsg] = useState('');

  // AI (Gemini) status
  const [aiStatus, setAiStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  // AI settings
  const [allowAIReplies, setAllowAIReplies] = useState(false);

  useEffect(() => {
    // Fetch Telegram bot status
    const fetchStatus = async () => {
      try {
        setTelegramStatus('loading');
        const res = await telegramAPI.getStatus();
        setTelegramStatus('ok');
        setTelegramStatusMsg(`Connected as @${res.data.bot.username}`);
      } catch (err: any) {
        setTelegramStatus('error');
        setTelegramStatusMsg(err.response?.data?.error || 'Bot not connected');
      }
    };
    fetchStatus();

    // Fetch Gemini AI status
    const fetchAIStatus = async () => {
      try {
        setAiStatus('loading');
        const res = await settingsAPI.test('gemini', geminiApiKey);
        if (res.data.success) {
          setAiStatus('ok');
          setAiStatusMsg('AI enabled');
        } else {
          setAiStatus('error');
          setAiStatusMsg(res.data.message || 'AI not available');
        }
      } catch (err: any) {
        setAiStatus('error');
        setAiStatusMsg(err.response?.data?.error || 'AI not available');
      }
    };
    fetchAIStatus();
  }, [geminiApiKey]);

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

      // Load IPFS provider settings
      if (settings.tatum_api_key) {
        setTatumApiKey(settings.tatum_api_key.value || '');
      }
      if (settings.pinata_api_key) {
        setPinataApiKey(settings.pinata_api_key.value || '');
      }
      if (settings.pinata_secret_key) {
        setPinataSecretKey(settings.pinata_secret_key.value || '');
      }
      if (settings.pinata_jwt) {
        setPinataJwt(settings.pinata_jwt.value || '');
      }
      if (settings.web3_storage_token) {
        setWeb3StorageToken(settings.web3_storage_token.value || '');
      }
      if (settings.nft_storage_token) {
        setNftStorageToken(settings.nft_storage_token.value || '');
      }

      // Load Telegram bot settings
      if (settings.telegram_bot_token) {
        setTelegramBotToken(settings.telegram_bot_token.value || '');
      }
      if (settings.telegram_bot_username) {
        setTelegramBotUsername(settings.telegram_bot_username.value || '');
      }
      if (settings.telegram_admin_user_id) {
        setTelegramAdminUserId(settings.telegram_admin_user_id.value || '');
      }
      if (settings.telegram_webhook_url) {
        setTelegramWebhookUrl(settings.telegram_webhook_url.value || '');
      }
      if (settings.gemini_api_key) {
        setGeminiApiKey(settings.gemini_api_key.value || '');
        setGeminiApiKeyDesc(settings.gemini_api_key.description || geminiApiKeyDesc);
      }
      if (settings.admin_token) {
        setAdminToken(settings.admin_token.value || '');
      }
      if (settings.allow_bot_create_group) {
        setAllowBotCreateGroup(Boolean(settings.allow_bot_create_group.value));
      }
      if (settings.allow_ai_replies) {
        setAllowAIReplies(Boolean(settings.allow_ai_replies.value));
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
        admin_token: { value: adminToken, description: 'Server admin token for authenticating admin actions and webhook.' },
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
        },
        // IPFS Storage Provider API Keys
        tatum_api_key: {
          value: tatumApiKey,
          description: 'Tatum API key for IPFS storage (50MB/month free)'
        },
        pinata_api_key: {
          value: pinataApiKey,
          description: 'Pinata API key for IPFS storage (1GB free)'
        },
        pinata_secret_key: {
          value: pinataSecretKey,
          description: 'Pinata Secret API key'
        },
        pinata_jwt: {
          value: pinataJwt,
          description: 'Pinata JWT token (preferred over API key/secret)'
        },
        web3_storage_token: {
          value: web3StorageToken,
          description: 'Web3.Storage token for IPFS (unlimited free)'
        },
        nft_storage_token: {
          value: nftStorageToken,
          description: 'NFT.Storage token for IPFS (unlimited free)'
        },
        // Telegram Bot Settings
        telegram_bot_token: {
          value: telegramBotToken,
          description: 'Telegram bot token from @BotFather for audit request notifications'
        },
        telegram_bot_username: {
          value: telegramBotUsername,
          description: 'Telegram bot username (without @) for deep links'
        },
        telegram_admin_user_id: {
          value: telegramAdminUserId,
          description: 'Telegram username or numeric user ID to receive audit notifications'
        },
        telegram_webhook_url: {
          value: telegramWebhookUrl,
          description: 'Webhook URL for Telegram bot updates (optional, for production)'
        }
        ,
        gemini_api_key: {
          value: geminiApiKey,
          description: geminiApiKeyDesc
        },
        allow_bot_create_group: {
          value: allowBotCreateGroup,
          description: 'If enabled, the bot will attempt to create Telegram groups programmatically (may fail depending on bot permissions).'
        }
        ,
        allow_ai_replies: {
          value: allowAIReplies,
          description: 'Enable AI-powered non-command replies from the Telegram bot (requires Gemini API key).'
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

      {/* AI Settings */}
      <Card className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Key24Regular />
          AI Settings
        </Text>
        <Text style={{ marginBottom: '12px', color: tokens.colorNeutralForeground2 }}>
          Configure AI features for the Telegram bot. Gemini API key is used for polishing messages and generating replies.
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="Gemini API Key (Optional)" hint="Used to polish bot messages via Gemini">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter Gemini API key"
                style={{ flex: 1 }}
              />
              <Button
                appearance="secondary"
                onClick={() => testApiKey('gemini', 'gemini', geminiApiKey)}
                disabled={testingKey === 'gemini' || !geminiApiKey}
              >
                {testingKey === 'gemini' ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {testResults.gemini && (
              <Text size={200} style={{ color: testResults.gemini.success ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1 }}>
                {testResults.gemini.message}
              </Text>
            )}
          </Field>

          <Field label="Enable AI Replies" hint="If enabled and Gemini is configured, the bot will reply to non-command messages using AI">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={allowAIReplies} onChange={(e) => setAllowAIReplies(e.target.checked)} />
              <span style={{ color: tokens.colorNeutralForeground2 }}>Enable AI-powered conversational replies (requires Gemini API key)</span>
            </label>
          </Field>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Text weight="semibold">AI Status:</Text>
            {aiStatus === 'loading' && <Spinner size="tiny" label="Checking..." />}
            {aiStatus === 'ok' && <Text style={{ color: tokens.colorPaletteGreenForeground1 }}>{aiStatusMsg}</Text>}
            {aiStatus === 'error' && <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{aiStatusMsg}</Text>}
          </div>
        </div>
      </Card>

      {/* Blockchain Scanners */}
      <Card className={styles.section}>
        {/* Telegram Bot Status */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <Text weight="semibold">Bot Status: </Text>
            {telegramStatus === 'loading' && <Spinner size="tiny" label="Checking..." />}
            {telegramStatus === 'ok' && <Text style={{ color: tokens.colorPaletteGreenForeground1 }}>{telegramStatusMsg}</Text>}
            {telegramStatus === 'error' && <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{telegramStatusMsg}</Text>}
          </div>
          <div>
            <Text weight="semibold">AI Enabled: </Text>
            {aiStatus === 'loading' && <Spinner size="tiny" label="Checking..." />}
            {aiStatus === 'ok' && <Text style={{ color: tokens.colorPaletteGreenForeground1 }}>{aiStatusMsg}</Text>}
            {aiStatus === 'error' && <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{aiStatusMsg}</Text>}
          </div>
        </div>
        
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

      {/* IPFS Storage Providers */}
      <Card className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Key24Regular />
          IPFS Storage Providers (Logo Uploads)
        </Text>
        <Text style={{ marginBottom: '16px', color: tokens.colorNeutralForeground2 }}>
          Configure IPFS providers for decentralized logo storage. System tries providers in order: Tatum → Pinata → Web3.Storage → NFT.Storage
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Tatum API Key (Primary - 50MB/month free)" hint="Get from dashboard.tatum.io">
            <Input
              type="password"
              value={tatumApiKey}
              onChange={(e) => setTatumApiKey(e.target.value)}
              placeholder="t-xxxxx-xxxxx"
            />
          </Field>

          <Field label="Pinata API Key (Fallback - 1GB free)" hint="Get from app.pinata.cloud">
            <Input
              type="password"
              value={pinataApiKey}
              onChange={(e) => setPinataApiKey(e.target.value)}
              placeholder="Enter Pinata API key"
            />
          </Field>

          <Field label="Pinata Secret Key" hint="Required if using API Key method">
            <Input
              type="password"
              value={pinataSecretKey}
              onChange={(e) => setPinataSecretKey(e.target.value)}
              placeholder="Enter Pinata Secret key"
            />
          </Field>

          <Field label="Pinata JWT (Recommended)" hint="Preferred over API Key/Secret - Get from app.pinata.cloud → API Keys">
            <Textarea
              value={pinataJwt}
              onChange={(e) => setPinataJwt(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              rows={3}
            />
          </Field>

          <Field label="Web3.Storage Token (Alternative - Unlimited)" hint="Get from web3.storage">
            <Input
              type="password"
              value={web3StorageToken}
              onChange={(e) => setWeb3StorageToken(e.target.value)}
              placeholder="Enter Web3.Storage token"
            />
          </Field>

          <Field label="NFT.Storage Token (Alternative - Unlimited)" hint="Get from nft.storage">
            <Input
              type="password"
              value={nftStorageToken}
              onChange={(e) => setNftStorageToken(e.target.value)}
              placeholder="Enter NFT.Storage token"
            />
          </Field>

          <div style={{ 
            padding: '12px', 
            backgroundColor: tokens.colorNeutralBackground4, 
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>
              ℹ️ Setup at least ONE provider:
            </Text>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Tatum</strong> (Recommended): dashboard.tatum.io → API Keys</li>
              <li><strong>Pinata</strong> (Best storage): app.pinata.cloud → API Keys → New Key</li>
              <li><strong>Web3.Storage</strong>: web3.storage → Account → Create API Token</li>
              <li><strong>NFT.Storage</strong>: nft.storage → API Keys → New API Key</li>
            </ul>
            <Text style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground2 }}>
              Used for uploading project logos and advertisement images to IPFS.
            </Text>
          </div>
        </div>
      </Card>

      {/* Telegram Bot Settings */}
      <Card className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Key24Regular />
          Telegram Bot (Audit Requests)
        </Text>
        <Text style={{ marginBottom: '16px', color: tokens.colorNeutralForeground2 }}>
          Configure Telegram bot to receive audit request notifications. Users can click "Request Audit" to start a chat with you.
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Bot Token" hint="Get from @BotFather on Telegram">
            <Input
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
          </Field>

          <Field label="Bot Username" hint="Without @ symbol (e.g., CFGNINJA_Bot)">
            <Input
              value={telegramBotUsername}
              onChange={(e) => setTelegramBotUsername(e.target.value)}
              placeholder="CFGNINJA_Bot"
            />
          </Field>

          <Field label="Admin User ID" hint="Your Telegram username or numeric user ID">
            <Input
              value={telegramAdminUserId}
              onChange={(e) => setTelegramAdminUserId(e.target.value)}
              placeholder="bladepool or 123456789"
            />
          </Field>

          <Field label="Webhook URL (Optional)" hint="For production deployments">
            <Input
              value={telegramWebhookUrl}
              onChange={(e) => setTelegramWebhookUrl(e.target.value)}
              placeholder="https://yourdomain.com/api/audit-request/webhook"
            />
          </Field>

          <Field label="Allow Bot To Create Groups" hint="If enabled, the bot will attempt programmatic group creation">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={allowBotCreateGroup} onChange={(e) => setAllowBotCreateGroup(e.target.checked)} />
              <span style={{ color: tokens.colorNeutralForeground2 }}>Allow bot to attempt creating Telegram groups (may fail depending on permissions)</span>
            </label>
          </Field>
          

          <div style={{ 
            padding: '12px', 
            backgroundColor: tokens.colorNeutralBackground4, 
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>
              📱 Setup Instructions:
            </Text>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Open Telegram and search for <strong>@BotFather</strong></li>
              <li>Send <code>/newbot</code> and follow instructions</li>
              <li>Copy the bot token (looks like 1234567890:ABCdef...)</li>
              <li>Paste token in "Bot Token" field above</li>
              <li>Enter your bot username (without @)</li>
              <li>Start a chat with your bot on Telegram</li>
              <li>Send <code>/start</code> to activate it</li>
            </ol>
            <Text style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground2 }}>
              Bot Link: {telegramBotUsername ? `https://t.me/${telegramBotUsername}` : 'Enter username above'}
            </Text>
          </div>

            {/* Webhook control buttons (start/stop) - secure proxy to backend */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button
                appearance="secondary"
                onClick={async () => {
                  try {
                    setSaving(true);
                    const res = await fetch('/api/telegram/admin/start', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      showMessage(data.error || 'Failed to start webhook', 'error');
                    } else {
                      showMessage(data.message || 'Webhook started', 'success');
                      // Refresh status
                      try {
                        const sres = await telegramAPI.getStatus();
                        setTelegramStatus('ok');
                        setTelegramStatusMsg(`Connected as @${sres.data.bot.username}`);
                      } catch (e: any) {
                        setTelegramStatus('error');
                        setTelegramStatusMsg('Webhook started, but status check failed');
                      }
                    }
                  } catch (err: any) {
                    showMessage(err.message || 'Start request failed', 'error');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Start Webhook
              </Button>

              <Button
                appearance="subtle"
                onClick={async () => {
                  try {
                    setSaving(true);
                    const res = await fetch('/api/telegram/admin/stop', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      showMessage(data.error || 'Failed to stop webhook', 'error');
                    } else {
                      showMessage(data.message || 'Webhook stopped', 'success');
                      setTelegramStatus('error');
                      setTelegramStatusMsg('Webhook disabled');
                    }
                  } catch (err: any) {
                    showMessage(err.message || 'Stop request failed', 'error');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Stop Webhook
              </Button>
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
