"use client";
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
