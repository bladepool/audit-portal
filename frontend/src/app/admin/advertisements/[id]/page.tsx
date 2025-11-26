'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Input,
  Button,
  Text,
  Switch,
  Spinner,
  makeStyles,
  tokens,
  Field,
} from '@fluentui/react-components';
import { advertisementsAPI } from '@/lib/api';
import LogoUpload from '@/components/LogoUpload';

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
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    padding: '24px',
  },
  actions: {
    padding: '24px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  imagePreview: {
    marginTop: '16px',
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

export default function AdvertisementFormPage() {
  const styles = useStyles();
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [adImage, setAdImage] = useState('https://analytixaudit-bucket.s3.eu-north-1.amazonaws.com/Group_10_a8c5fddcad.png');
  const [adUrl, setAdUrl] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadAdvertisement();
    }
  }, [params.id]);

  const loadAdvertisement = async () => {
    try {
      setLoading(true);
      const response = await advertisementsAPI.getById(params.id as string);
      const ad = response.data;
      
      setAdImage(ad.ad_image);
      setAdUrl(ad.ad_url);
      setPublished(ad.published);
    } catch (error) {
      console.error('Error loading advertisement:', error);
      alert('Failed to load advertisement');
      router.push('/admin/advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adImage.trim() || !adUrl.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSaving(true);

    const data = {
      ad_image: adImage,
      ad_url: adUrl,
      published,
    };

    try {
      if (isNew) {
        await advertisementsAPI.create(data);
      } else {
        await advertisementsAPI.update(params.id as string, data);
      }
      router.push('/admin/advertisements');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save advertisement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="extra-large" label="Loading advertisement..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.header}>
        <Button
          appearance="subtle"
          onClick={() => router.push('/admin/advertisements')}
          style={{ marginBottom: '12px' }}
        >
          ← Back to Advertisements
        </Button>
        <Text className={styles.title}>
          {isNew ? 'Create New Advertisement' : 'Edit Advertisement'}
        </Text>
      </Card>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Card className={styles.section}>
          <Text style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px' }}>
            Advertisement Details
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Ad Image URL *" required>
              <Input
                value={adImage}
                onChange={(e) => setAdImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                required
              />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
                Upload to IPFS below or manually enter URL
              </Text>
            </Field>

            {!isNew && (
              <Field label="Upload Image to IPFS">
                <LogoUpload
                  entityType="advertisement"
                  entityId={params.id as string}
                  currentLogoUrl={adImage}
                  onUploadSuccess={(imageUrl, ipfsHash) => {
                    setAdImage(imageUrl);
                    console.log('Advertisement image uploaded to IPFS:', ipfsHash);
                  }}
                  onUploadError={(error) => {
                    alert('Image upload failed: ' + error);
                  }}
                />
              </Field>
            )}

            {adImage && (
              <div>
                <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>
                  Image Preview:
                </Text>
                <img
                  src={adImage}
                  alt="Advertisement Preview"
                  className={styles.imagePreview}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
              </div>
            )}

            <Field label="Ad URL (Click Destination) *" required>
              <Input
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
                Where users will be redirected when they click the advertisement
              </Text>
            </Field>

            <Field label="Publish Advertisement">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Switch
                  checked={published}
                  onChange={(e) => setPublished(e.currentTarget.checked)}
                />
                <Text>
                  {published ? 'Published - Will appear on project pages' : 'Draft - Not visible to users'}
                </Text>
              </div>
            </Field>
          </div>
        </Card>

        <Card className={styles.actions}>
          <Button
            type="button"
            onClick={() => router.push('/admin/advertisements')}
          >
            Cancel
          </Button>
          <Button appearance="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Advertisement' : 'Save Changes'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
