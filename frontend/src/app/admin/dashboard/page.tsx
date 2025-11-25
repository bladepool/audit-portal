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
import { getVersionInfo } from '@/config/version';

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
  versionInfo: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
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

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAllAdmin();
      setProjects(response.data);
      setTotalItems(response.data.length);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate projects
  const getFilteredProjects = () => {
    let filtered = [...projects];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.symbol?.toLowerCase().includes(query) ||
        p.platform?.toLowerCase().includes(query) ||
        p.slug?.toLowerCase().includes(query)
      );
    }
    
    // Apply platform filter
    if (platformFilter) {
      filtered = filtered.filter(p => p.platform === platformFilter);
    }
    
    // Apply status filter
    if (statusFilter === 'published') {
      filtered = filtered.filter(p => p.published);
    } else if (statusFilter === 'draft') {
      filtered = filtered.filter(p => !p.published);
    }
    
    // Update totals
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      projects: filtered.slice(startIndex, endIndex),
      total,
      pages
    };
  };
  
  const { projects: displayedProjects, total, pages } = getFilteredProjects();
  
  // Get unique platforms for filter dropdown
  const uniquePlatforms = Array.from(new Set(projects.map(p => p.platform).filter(Boolean)));

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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTogglePublish(item._id, item.published);
            }}
            title={item.published ? 'Unpublish' : 'Publish'}
          />
          <Button
            size="small"
            icon={<Edit24Regular />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/admin/projects/${item._id}`);
            }}
            title="Edit"
          />
          <Button
            size="small"
            icon={<Delete24Regular />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(item._id, item.name);
            }}
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
          <Text className={styles.versionInfo}>
            {getVersionInfo().fullVersion} • {getVersionInfo().date}
          </Text>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => router.push('/admin/projects/new')}
          >
            New Project
          </Button>
          <Button onClick={() => router.push('/admin/advertisements')}>
            Manage Ads
          </Button>
          <Button onClick={() => router.push('/admin/settings')}>
            Settings
          </Button>
          <Button onClick={() => router.push('/')}>View Portal</Button>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </Card>

      <Card className={styles.tableCard}>
        <Text size={600} weight="semibold" style={{ marginBottom: '16px' }}>
          All Projects ({total} total, {displayedProjects.length} showing)
        </Text>
        
        {/* Search and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, symbol, platform, or slug..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Platforms</option>
              {uniquePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
              Items Per Page
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        
        <DataGrid
          items={displayedProjects}
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
        
        {/* Pagination Controls */}
        {pages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '16px',
            padding: '12px 0',
            borderTop: '1px solid #e0e0e0'
          }}>
            <Text size={300}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total}
            </Text>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                First
              </Button>
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              <Text style={{ padding: '0 16px', lineHeight: '32px' }}>
                Page {currentPage} of {pages}
              </Text>
              
              <Button
                size="small"
                disabled={currentPage === pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
              <Button
                size="small"
                disabled={currentPage === pages}
                onClick={() => setCurrentPage(pages)}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
