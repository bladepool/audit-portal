'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  createTableColumn,
  TableCellLayout,
  Badge,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Eye24Regular,
  EyeOff24Regular,
} from '@fluentui/react-icons';
import { projectsAPI, authAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import Link from 'next/link';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  tableCard: {
    padding: '24px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
});

export default function AdminDashboard() {
  const styles = useStyles();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await authAPI.getMe();
      setUser(response.data);
      loadProjects();
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/admin');
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAllAdmin();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin');
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await projectsAPI.publish(id, !currentStatus);
      loadProjects();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await projectsAPI.delete(id);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const columns = [
    createTableColumn<Project>({
      columnId: 'name',
      renderHeaderCell: () => 'Project Name',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.name}</Text>
          <Text size={200}>{item.symbol}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<Project>({
      columnId: 'slug',
      renderHeaderCell: () => 'Slug',
      renderCell: (item) => item.slug,
    }),
    createTableColumn<Project>({
      columnId: 'score',
      renderHeaderCell: () => 'Score',
      renderCell: (item) => (
        <Badge
          appearance="filled"
          color={
            item.audit_score >= 90
              ? 'success'
              : item.audit_score >= 80
              ? 'informative'
              : item.audit_score >= 70
              ? 'warning'
              : 'danger'
          }
        >
          {item.audit_score}
        </Badge>
      ),
    }),
    createTableColumn<Project>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge appearance="filled" color={item.published ? 'success' : 'subtle'}>
          {item.published ? 'Published' : 'Draft'}
        </Badge>
      ),
    }),
    createTableColumn<Project>({
      columnId: 'stats',
      renderHeaderCell: () => 'Stats',
      renderCell: (item) => (
        <TableCellLayout>
          <Text size={200}>👁️ {item.page_view} views</Text>
          <Text size={200}>🗳️ {item.total_votes} votes</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<Project>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <div className={styles.actionButtons}>
          <Button
            size="small"
            icon={item.published ? <EyeOff24Regular /> : <Eye24Regular />}
            onClick={() => handleTogglePublish(item._id, item.published)}
            title={item.published ? 'Unpublish' : 'Publish'}
          />
          <Button
            size="small"
            icon={<Edit24Regular />}
            onClick={() => router.push(`/admin/projects/${item._id}`)}
            title="Edit"
          />
          <Button
            size="small"
            icon={<Delete24Regular />}
            onClick={() => handleDelete(item._id, item.name)}
            title="Delete"
          />
        </div>
      ),
    }),
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="extra-large" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.header}>
        <div>
          <Text className={styles.title}>Audit Portal Admin</Text>
          <Text>Welcome back, {user?.name}</Text>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => router.push('/admin/projects/new')}
          >
            New Project
          </Button>
          <Button onClick={() => router.push('/')}>View Portal</Button>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </Card>

      <Card className={styles.tableCard}>
        <Text size={600} weight="semibold" style={{ marginBottom: '16px' }}>
          All Projects ({projects.length})
        </Text>
        <DataGrid
          items={projects}
          columns={columns}
          sortable
          focusMode="composite"
        >
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<Project>>
            {({ item, rowId }) => (
              <DataGridRow<Project> key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </Card>
    </div>
  );
}
