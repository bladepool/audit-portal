# IPFS Provider Settings - Admin Guide

## Overview

The Audit Portal now supports decentralized logo/image storage using IPFS (InterPlanetary File System). This guide explains how to configure and manage IPFS providers through the admin settings interface.

## ✅ Current Configuration

Your portal is now configured with the following IPFS providers:

### Primary Provider - Tatum ✅
- **API Key**: `t-69266c94...` (configured)
- **Free Tier**: 50MB/month
- **Dashboard**: https://dashboard.tatum.io
- **Status**: ✅ Active

### Fallback Provider - Pinata ✅
- **API Key**: `b3533dad84166424fcbb` (configured)
- **Secret Key**: `3654a227...` (configured)
- **JWT**: `eyJhbGci...` (configured - **preferred**)
- **Free Tier**: 1GB storage, unlimited bandwidth
- **Dashboard**: https://app.pinata.cloud
- **Status**: ✅ Active

### Optional Providers
- **Web3.Storage**: Unlimited free storage
- **NFT.Storage**: Unlimited free storage

## 🎯 How It Works

### Automatic Fallback System

The IPFS uploader tries providers in this order:

1. **Tatum** (Primary) - Fast, 50MB/month
2. **Pinata** (Fallback) - 1GB storage, best reliability
3. **Web3.Storage** (Optional) - If configured
4. **NFT.Storage** (Optional) - If configured

If one provider fails, it automatically tries the next one.

### Database-Backed Settings

API keys are stored in the MongoDB `settings` collection and can be updated via:
- **Admin Settings UI** (preferred): `/admin/settings`
- **Environment variables** (fallback): `.env` file

## 📝 Managing IPFS Settings

### View/Edit Settings in Admin UI

1. Navigate to: `http://localhost:3000/admin/settings`
2. Scroll to **"IPFS Storage Providers"** section
3. View or edit API keys:
   - Tatum API Key
   - Pinata API Key
   - Pinata Secret Key
   - Pinata JWT (preferred)
   - Web3.Storage Token
   - NFT.Storage Token
4. Click **"Save Settings"**

### Initialize Settings via Script

Run this script to bulk-initialize or update settings:

```bash
cd backend
node scripts/init-ipfs-settings.js
```

This will:
- Create/update all IPFS provider settings in database
- Set Tatum and Pinata credentials
- Leave Web3.Storage and NFT.Storage empty (optional)

### Test IPFS Upload

Verify your configuration works:

```bash
cd backend
node test-ipfs-upload.js
```

Expected output:
```
✓ Connected to MongoDB
✓ Settings loaded
IPFS Settings loaded: {
  tatum: '✓ Configured',
  pinata: '✓ Configured',
  ...
}
Uploading test file to IPFS...
✓ Upload successful!
  Provider: tatum
  IPFS Hash: bafkrei...
  Gateway URL: https://ipfs.io/ipfs/bafkrei...
```

## 🖼️ Using Logo Upload in Admin Pages

### Project Logos

1. Navigate to: `/admin/projects/[id]`
2. Find the **"Logo Upload"** section (below Logo URL field)
3. **Upload methods**:
   - Drag & drop image file
   - Click to browse and select
4. **Supported formats**: PNG, JPG, JPEG, GIF, SVG, WebP
5. **Size limit**: 10MB
6. **Auto-optimization**: Resized to 512x512px PNG
7. **Auto-update**: Logo URL field updates with IPFS URL
8. Click **"Save"** to persist

### Advertisement Images

1. Navigate to: `/admin/advertisements/[id]`
2. Find the **"Ad Image Upload"** section (below Ad Image URL field)
3. Same upload process as projects
4. **Auto-optimization**: Resized to 800x400px JPEG
5. **Auto-update**: Ad Image field updates with IPFS URL

## 🔐 API Key Management

### Pinata Authentication Methods

Pinata supports two authentication methods:

#### 1. JWT Token (Recommended) ✅

**Advantages**:
- Single token
- More secure
- Easier to manage
- Supports scoped permissions

**How to get**:
1. Go to https://app.pinata.cloud
2. Click **"API Keys"** in sidebar
3. Click **"New Key"**
4. Set permissions (Admin recommended)
5. Name it "Audit Portal"
6. Copy the JWT token
7. Paste in Admin Settings → **"Pinata JWT"** field

**Current JWT**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ✅

#### 2. API Key + Secret (Legacy)

**How to use**:
1. Get API Key and Secret from Pinata dashboard
2. Enter both in Admin Settings:
   - **Pinata API Key**: `b3533dad84166424fcbb`
   - **Pinata Secret Key**: `3654a227...`

**Note**: If JWT is provided, it takes precedence over API Key/Secret.

### Tatum API Key

**How to get**:
1. Go to https://dashboard.tatum.io
2. Sign up/login
3. Navigate to **"API Keys"**
4. Copy your API key
5. Paste in Admin Settings → **"Tatum API Key"** field

**Current Key**: `t-69266c94cfecb979898695e4-37b9d1c3668248c6b1c3b1be` ✅

### Optional Providers

#### Web3.Storage

1. Go to https://web3.storage
2. Sign up/login
3. Navigate to **"Account"** → **"Create API Token"**
4. Copy token
5. Paste in Admin Settings → **"Web3.Storage Token"** field

#### NFT.Storage

1. Go to https://nft.storage
2. Sign up/login
3. Navigate to **"API Keys"** → **"New API Key"**
4. Copy token
5. Paste in Admin Settings → **"NFT.Storage Token"** field

## 🔧 Technical Details

### IPFS Utility (`backend/src/utils/ipfs.js`)

**Key Features**:
- Multi-provider support with automatic fallback
- Database-backed settings (reads from `settings` collection)
- Environment variable fallback (`.env` file)
- Image optimization (Sharp library)
- Validation (file size, type)
- Multiple IPFS gateway URLs

**Usage Example**:

```javascript
const { uploadToIPFS } = require('./src/utils/ipfs');

// Upload buffer
const result = await uploadToIPFS(fileBuffer, 'logo.png');

console.log(result);
// {
//   success: true,
//   provider: 'tatum',
//   ipfsHash: 'bafkrei...',
//   url: 'https://ipfs.io/ipfs/bafkrei...',
//   gatewayUrl: 'https://gateway.pinata.cloud/ipfs/bafkrei...'
// }
```

### Upload API Routes (`backend/src/routes/upload.js`)

**Endpoints**:

1. **POST** `/api/upload/logo/project/:id`
   - Upload project logo
   - Optimizes to 512x512px PNG
   - Updates Project.logo field
   - Stores IPFS hash

2. **POST** `/api/upload/logo/advertisement/:id`
   - Upload ad image
   - Optimizes to 800x400px JPEG
   - Updates Advertisement.imageUrl field
   - Stores IPFS hash

3. **POST** `/api/upload/bulk-logos`
   - Batch upload (up to 10 files)
   - Returns array of results

4. **GET** `/api/upload/ipfs/:hash`
   - Get gateway URLs for IPFS hash
   - Returns 5 gateway URLs

### Frontend Component (`frontend/src/components/LogoUpload.tsx`)

**Features**:
- Drag-and-drop interface
- Live preview
- Upload progress indicator
- Success/error messages
- Auto-updates parent form field

**Props**:
```typescript
interface LogoUploadProps {
  entityType: 'project' | 'advertisement';
  entityId: string;
  currentLogoUrl?: string;
  onUploadSuccess: (logoUrl: string, ipfsHash: string) => void;
  onUploadError?: (error: string) => void;
}
```

## 📊 Monitoring & Troubleshooting

### Check Settings

```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Settings = require('./src/models/Settings'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal').then(async () => { const settings = await Settings.find({ key: /ipfs|tatum|pinata/ }); console.log(JSON.stringify(settings, null, 2)); await mongoose.connection.close(); });"
```

### Common Issues

#### Upload fails with "All IPFS providers failed"

**Cause**: No providers configured or all API keys invalid

**Solution**:
1. Go to Admin Settings
2. Verify at least one provider has valid API key
3. Test with `node test-ipfs-upload.js`

#### Upload fails with "Tatum upload failed"

**Cause**: Tatum API key invalid or quota exceeded

**Solution**:
- Check Tatum dashboard for quota usage
- Pinata will automatically be used as fallback
- Consider adding Web3.Storage for unlimited storage

#### Settings not loading in admin UI

**Cause**: Settings collection empty or incorrect keys

**Solution**:
```bash
cd backend
node scripts/init-ipfs-settings.js
```

### View Upload Logs

Backend logs show which provider was used:

```
Attempting upload to tatum...
Successfully uploaded to tatum
```

or

```
Attempting upload to tatum...
tatum failed, trying next provider...
Attempting upload to pinata...
Successfully uploaded to pinata
```

## 🚀 Next Steps

1. ✅ **Test logo upload** in admin project page
2. ✅ **Verify IPFS URLs** are accessible
3. ⏳ **Add Web3.Storage token** (optional - unlimited storage)
4. ⏳ **Monitor upload statistics** in admin dashboard
5. ⏳ **Set up public "Request Audit" form** with logo upload

## 📚 Resources

- **Tatum Docs**: https://docs.tatum.io/reference/storeipfs
- **Pinata Docs**: https://docs.pinata.cloud/
- **IPFS Docs**: https://docs.ipfs.tech/
- **Web3.Storage**: https://web3.storage/docs/
- **NFT.Storage**: https://nft.storage/docs/

## 🎯 Summary

Your Audit Portal now has:
- ✅ **Database-backed IPFS settings** (managed via Admin UI)
- ✅ **Tatum configured** (50MB/month, primary provider)
- ✅ **Pinata configured** (1GB storage, fallback with JWT)
- ✅ **Automatic fallback system** (high reliability)
- ✅ **Logo upload UI** (drag-and-drop in admin pages)
- ✅ **Image optimization** (Sharp library)
- ✅ **Multiple IPFS gateways** (redundancy)

All systems operational! 🎉
