'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Input,
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  Badge,
} from '@fluentui/react-components';
import {
  EditRegular,
  DeleteRegular,
  CopyRegular,
  AddRegular,
  SearchRegular,
} from '@fluentui/react-icons';
import { advertisementsAPI } from '@/lib/api';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: tokens.colorNeutralBackground3,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
    padding: '24px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  tableCard: {
    padding: '0',
    overflow: 'hidden',
  },
  actionsCell: {
    display: 'flex',
    gap: '8px',
  },
  imagePreview: {
    width: '100px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '4px',
  },
  statusBadge: {
    textTransform: 'capitalize',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
});

interface Advertisement {
  _id: string;
  ad_image: string;
  ad_url: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdvertisementsPage() {
  const styles = useStyles();
  const router = useRouter();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [filteredAds, setFilteredAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAdvertisements();
  }, []);

  useEffect(() => {
    // Filter advertisements based on search query
    if (searchQuery.trim() === '') {
      setFilteredAds(advertisements);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = advertisements.filter(
        (ad) =>
          ad.ad_url.toLowerCase().includes(query) ||
          ad.ad_image.toLowerCase().includes(query)
      );
      setFilteredAds(filtered);
    }
  }, [searchQuery, advertisements]);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await advertisementsAPI.getAll();
      setAdvertisements(response.data);
      setFilteredAds(response.data);
    } catch (error) {
      console.error('Error loading advertisements:', error);
      alert('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }

    try {
      await advertisementsAPI.delete(id);
      loadAdvertisements();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      alert('Failed to delete advertisement');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await advertisementsAPI.duplicate(id);
      loadAdvertisements();
    } catch (error) {
      console.error('Error duplicating advertisement:', error);
      alert('Failed to duplicate advertisement');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="extra-large" label="Loading advertisements..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <Button
              appearance="subtle"
              onClick={() => router.push('/admin/dashboard')}
              style={{ marginBottom: '12px' }}
            >
              ← Back
            </Button>
            <Text className={styles.title}>Advertisement Management</Text>
            <Text style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground3 }}>
              {filteredAds.length} {filteredAds.length === 1 ? 'entry' : 'entries'} found
            </Text>
          </div>
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={() => router.push('/admin/advertisements/new')}
          >
            Create new entry
          </Button>
        </div>

        <div className={styles.searchBar}>
          <SearchRegular />
          <Input
            placeholder="Search by URL or image name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '400px' }}
          />
        </div>
      </Card>

      <Card className={styles.tableCard}>
        {filteredAds.length === 0 ? (
          <div className={styles.emptyState}>
            <Text size={500} weight="semibold">
              {searchQuery ? 'No advertisements found' : 'No advertisements yet'}
            </Text>
            <Text style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground3 }}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first advertisement to get started'}
            </Text>
            {!searchQuery && (
              <Button
                appearance="primary"
                icon={<AddRegular />}
                onClick={() => router.push('/admin/advertisements/new')}
                style={{ marginTop: '16px' }}
              >
                Create Advertisement
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Ad Image</TableHeaderCell>
                <TableHeaderCell>Ad URL</TableHeaderCell>
                <TableHeaderCell>Created At</TableHeaderCell>
                <TableHeaderCell>State</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad._id}>
                  <TableCell>
                    <TableCellLayout>
                      <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {ad._id.slice(-8)}
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <img
                        src={ad.ad_image}
                        alt="Advertisement"
                        className={styles.imagePreview}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="60"%3E%3Crect fill="%23ddd" width="100" height="60"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <Text style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                        {ad.ad_image.split('/').pop()?.substring(0, 30)}...
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <a
                        href={ad.ad_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: tokens.colorBrandForeground1, textDecoration: 'none' }}
                      >
                        {ad.ad_url}
                      </a>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <Text style={{ fontSize: '13px' }}>{formatDate(ad.createdAt)}</Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <Badge
                        appearance={ad.published ? 'filled' : 'outline'}
                        color={ad.published ? 'success' : 'subtle'}
                        className={styles.statusBadge}
                      >
                        {ad.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <div className={styles.actionsCell}>
                        <Button
                          appearance="subtle"
                          icon={<EditRegular />}
                          size="small"
                          onClick={() => router.push(`/admin/advertisements/${ad._id}`)}
                          title="Edit"
                        />
                        <Button
                          appearance="subtle"
                          icon={<CopyRegular />}
                          size="small"
                          onClick={() => handleDuplicate(ad._id)}
                          title="Duplicate"
                        />
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          size="small"
                          onClick={() => handleDelete(ad._id)}
                          title="Delete"
                        />
                      </div>
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
