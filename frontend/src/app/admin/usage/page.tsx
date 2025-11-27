"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUsageAPI } from '@/lib/api';
import {
  Card,
  Text,
  Button,
  Spinner,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@fluentui/react-components';

export default function AdminUsagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await adminUsageAPI.getUsage(params);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch admin usage', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Text style={{ fontSize: 20, fontWeight: 700 }}>Admin Usage Report</Text>
          <Text size={200} style={{ display: 'block', marginTop: 4 }}>Totals and per-ad breakdown</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button appearance="subtle" onClick={() => { localStorage.removeItem('token'); router.push('/admin'); }}>Logout</Button>
        </div>
      </div>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12 }}>Start date</label>
            <Input type="date" value={startDate} onChange={(e:any) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12 }}>End date</label>
            <Input type="date" value={endDate} onChange={(e:any) => setEndDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <Button onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }}>Reset</Button>
            <Button appearance="primary" onClick={fetchData}>Apply</Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner label="Loading report..." />
        </div>
      )}

      {error && (
        <Card style={{ marginBottom: 16, padding: 12 }}>
          <Text style={{ color: 'var(--danger-foreground, #a80000)' }}>{error}</Text>
        </Card>
      )}

      {data && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Card style={{ padding: 12, flex: 1 }}>
              <Text weight="semibold">Page Views</Text>
              <Text style={{ fontSize: 20 }}>{data.pageViewsTotal ?? 0}</Text>
            </Card>
            <Card style={{ padding: 12, flex: 1 }}>
              <Text weight="semibold">Votes</Text>
              <Text style={{ fontSize: 20 }}>{data.votesTotal ?? 0}</Text>
            </Card>
            <Card style={{ padding: 12, flex: 1 }}>
              <Text weight="semibold">Owner Updates</Text>
              <Text style={{ fontSize: 20 }}>{data.ownerUpdatesTotal ?? 0}</Text>
            </Card>
            <Card style={{ padding: 12, flex: 1 }}>
              <Text weight="semibold">Estimated Ad Revenue (USD)</Text>
              <Text style={{ fontSize: 20 }}>${(data.estimatedRevenueTotal || 0).toFixed(2)}</Text>
            </Card>
          </div>

          <Card style={{ padding: 12 }}>
            <Text weight="semibold">Ads breakdown</Text>
            <div style={{ marginTop: 12 }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Ad</TableCell>
                    <TableCell numeric>Views</TableCell>
                    <TableCell numeric>Clicks</TableCell>
                    <TableCell numeric>CPM</TableCell>
                    <TableCell numeric>CPC</TableCell>
                    <TableCell numeric>Estimated Revenue</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.ads || []).map((ad: any) => (
                    <TableRow key={ad._id || ad.adId}>
                      <TableCell>{ad.title || ad.adId || ad._id}</TableCell>
                      <TableCell numeric>{ad.views || 0}</TableCell>
                      <TableCell numeric>{ad.clicks || 0}</TableCell>
                      <TableCell numeric>${(ad.cpm || 0).toFixed(2)}</TableCell>
                      <TableCell numeric>${(ad.cpc || 0).toFixed(2)}</TableCell>
                      <TableCell numeric>${(ad.estimatedRevenue || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Text,
  Button,
  Input,
  makeStyles,
  tokens,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@fluentui/react-components';
import { adminUsageAPI, authAPI } from '@/lib/api';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  card: {
    padding: '16px',
    marginBottom: '16px',
  }
});

export default function AdminUsagePage() {
  const styles = useStyles();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/admin');
      const resp = await authAPI.getMe();
      setUser(resp.data);
      fetchReport();
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/admin');
    }
  };

  const fetchReport = async (opts?: { startDate?: string; endDate?: string }) => {
    try {
      setLoading(true);
      const params: any = {};
      if (opts?.startDate) params.startDate = opts.startDate;
      if (opts?.endDate) params.endDate = opts.endDate;
      const res = await adminUsageAPI.getUsage(params);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load usage report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchReport({ startDate, endDate });

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <Spinner label="Checking authentication..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Text weight="semibold" size={700}>Admin — Usage Reports</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>View portal usage, votes, owner updates and ad performance.</Text>
        </div>
        <div>
          <Button appearance="secondary" onClick={() => router.push('/admin/dashboard')}>Back</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => { localStorage.removeItem('token'); router.push('/admin'); }}>Logout</Button>
        </div>
      </div>

      <Card className={styles.card}>
        <div className={styles.filters}>
          <div>
            <Text size={200}>Start Date</Text>
            <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Text size={200}>End Date</Text>
            <Input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <Button appearance="primary" onClick={handleRefresh}>Fetch</Button>
          </div>
        </div>

        {loading && <Spinner label="Loading report..." />}

        {report && (
          <div>
            <Card style={{ padding: 12, marginBottom: 12 }}>
              <Text weight="semibold">Totals</Text>
              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <div><Text>Page Views</Text><div>{report.pageViews}</div></div>
                <div><Text>Secure Votes</Text><div>{report.votes?.secure}</div></div>
                <div><Text>Insecure Votes</Text><div>{report.votes?.insecure}</div></div>
                <div><Text>Owner Updates</Text><div>{report.ownerUpdates}</div></div>
                <div><Text>Ad Views</Text><div>{report.totals?.adViews}</div></div>
                <div><Text>Ad Clicks</Text><div>{report.totals?.adClicks}</div></div>
                <div><Text>Estimated Revenue (USD)</Text><div>${report.totals?.estimatedRevenue}</div></div>
              </div>
            </Card>

            <Card style={{ padding: 12 }}>
              <Text weight="semibold">Ads</Text>
              <Table aria-label="Ads report">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Ad URL</TableHeaderCell>
                    <TableHeaderCell>Views</TableHeaderCell>
                    <TableHeaderCell>Clicks</TableHeaderCell>
                    <TableHeaderCell>CPM</TableHeaderCell>
                    <TableHeaderCell>CPC</TableHeaderCell>
                    <TableHeaderCell>Estimated Revenue</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(report.ads || []).map((ad: any) => (
                    <TableRow key={ad.adId}>
                      <TableCell><a href={ad.ad_url} target="_blank" rel="noreferrer">{ad.ad_url}</a></TableCell>
                      <TableCell>{ad.views}</TableCell>
                      <TableCell>{ad.clicks}</TableCell>
                      <TableCell>{ad.cpm}</TableCell>
                      <TableCell>{ad.cpc}</TableCell>
                      <TableCell>${ad.estimatedRevenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

      </Card>
    </div>
  );
}
