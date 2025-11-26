'use client';

import React, { useState, useRef } from 'react';
import {
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { CloudArrowUpRegular, CheckmarkRegular, DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      borderColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  uploadAreaDragging: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorNeutralBackground2Pressed,
  },
  preview: {
    width: '100%',
    maxWidth: '300px',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  previewContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  removeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  success: {
    color: tokens.colorPaletteGreenForeground1,
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface LogoUploadProps {
  entityType: 'project' | 'advertisement';
  entityId: string;
  currentLogoUrl?: string;
  onUploadSuccess: (logoUrl: string, ipfsHash: string) => void;
  onUploadError?: (error: string) => void;
}

export default function LogoUpload({
  entityType,
  entityId,
  currentLogoUrl,
  onUploadSuccess,
  onUploadError,
}: LogoUploadProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileSelect = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ type: 'error', message: 'Please select an image file' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus({ type: 'error', message: 'File size must be less than 10MB' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('logo', file);


      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://audit-portal-production.up.railway.app/api';
      const endpoint = entityType === 'project'
        ? `${apiBase}/upload/logo/project/${entityId}`
        : `${apiBase}/upload/logo/advertisement/${entityId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      setUploadStatus({
        type: 'success',
        message: `Uploaded to ${data[entityType].provider} IPFS`,
      });

      onUploadSuccess(data[entityType].logo, data[entityType].ipfsHash);

      // Clear status after 3 seconds
      setTimeout(() => {
        setUploadStatus({ type: null, message: '' });
      }, 3000);

    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      setUploadStatus({ type: 'error', message: errorMessage });
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadStatus({ type: null, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {preview ? (
        <div className={styles.previewContainer}>
          <img src={preview} alt="Logo preview" className={styles.preview} />
          {!uploading && (
            <Button
              className={styles.removeButton}
              appearance="secondary"
              size="small"
              icon={<DismissRegular />}
              onClick={handleRemove}
            />
          )}
        </div>
      ) : (
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudArrowUpRegular fontSize={48} />
          <Text weight="semibold">
            {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
          </Text>
          <Text size={200}>
            Supports JPG, PNG, GIF up to 10MB
          </Text>
          <Text size={100} style={{ opacity: 0.7 }}>
            Will be uploaded to IPFS (decentralized storage)
          </Text>
        </div>
      )}

      {uploading && (
        <div className={styles.status}>
          <Spinner size="tiny" />
          <Text size={200}>Uploading to IPFS...</Text>
        </div>
      )}

      {uploadStatus.type === 'success' && (
        <div className={`${styles.status} ${styles.success}`}>
          <CheckmarkRegular fontSize={20} />
          <Text size={200}>{uploadStatus.message}</Text>
        </div>
      )}

      {uploadStatus.type === 'error' && (
        <div className={`${styles.status} ${styles.error}`}>
          <DismissRegular fontSize={20} />
          <Text size={200}>{uploadStatus.message}</Text>
        </div>
      )}
    </div>
  );
}
