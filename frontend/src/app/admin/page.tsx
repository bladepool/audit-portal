'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

const ADMIN_WALLET = '0x771d463e16aab8bafff9ff67eb822c7dae3b1ad3';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '32px',
    textAlign: 'center',
    color: 'white',
  },
  subtitle: {
    marginBottom: '24px',
    color: tokens.colorNeutralForeground2,
  },
  walletInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
    fontSize: '0.875rem',
    wordBreak: 'break-all',
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.875rem',
    marginTop: '16px',
  },
  success: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '0.875rem',
    marginTop: '16px',
  },
});

export default function AdminLoginPage() {
  const styles = useStyles();
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if already logged in
    const savedWallet = localStorage.getItem('adminWallet');
    if (savedWallet && savedWallet.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const connectWallet = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      setWalletAddress(address);

      // Check if connected wallet is the admin wallet
      if (address.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
        // Generate a simple auth token (wallet address + timestamp)
        const token = btoa(`${address}:${Date.now()}`);
        
        localStorage.setItem('adminWallet', address);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          name: 'Blade Ninja',
          wallet: address,
          role: 'admin'
        }));
        
        setMessage('Authentication successful! Redirecting...');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1000);
      } else {
        throw new Error(`Unauthorized wallet. Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setWalletAddress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Admin Portal</h1>
        <Card className={styles.loginCard}>
          <Text className={styles.subtitle}>
            Connect your wallet to access the admin dashboard
          </Text>
          
          <Button
            appearance="primary"
            size="large"
            onClick={connectWallet}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Connecting...' : '🦊 Connect MetaMask'}
          </Button>

          {walletAddress && (
            <div className={styles.walletInfo}>
              <Text size={200} weight="semibold">Connected Wallet:</Text>
              <br />
              <Text size={200}>{walletAddress}</Text>
            </div>
          )}

          {error && <Text className={styles.error}>❌ {error}</Text>}
          {message && <Text className={styles.success}>✅ {message}</Text>}

          <Text size={100} style={{ marginTop: '24px', color: tokens.colorNeutralForeground3 }}>
            Only authorized wallets can access the admin panel
          </Text>
        </Card>
      </div>
    </div>
  );
}
