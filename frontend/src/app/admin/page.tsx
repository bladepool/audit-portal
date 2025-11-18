'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Input,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { authAPI } from '@/lib/api';

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
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '32px',
    textAlign: 'center',
    color: 'white',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.875rem',
  },
});

export default function AdminLoginPage() {
  const styles = useStyles();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Admin Login</h1>
        <Card className={styles.loginCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <Text weight="semibold">Email</Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            <div>
              <Text weight="semibold">Password</Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            {error && <Text className={styles.error}>{error}</Text>}
            <Button
              appearance="primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
