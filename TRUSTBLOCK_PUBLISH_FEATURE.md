# TrustBlock Publishing Feature - Quick Guide

## Overview

Added a **"Publish to TrustBlock"** button in the admin portal, positioned next to the "Generate Audit PDF" button. This allows you to publish audit reports directly to TrustBlock with one click.

## Location

**Admin Project Edit Page** → **PDF Generation Section** (bottom of page)

```
https://audit-portal-gamma.vercel.app/admin/projects/[project-id]
```

## Features

✅ **One-click publishing** to TrustBlock  
✅ **Auto-updates** project with TrustBlock URL  
✅ **Real-time status** messages  
✅ **Validates** contract address before publishing  
✅ **Works with MongoDB ID or slug**  
✅ **Beautiful UI** with cloud upload icon  

## Usage

1. **Open any project** in admin panel
2. **Scroll to "PDF Generation"** section
3. **Click "Publish to TrustBlock"** button
4. **Wait for confirmation**:
   ```
   Publishing to TrustBlock...
   ✅ Successfully published to TrustBlock!
   https://app.trustblock.run/auditor/cfg-ninja/project-slug
   ```

## Requirements

Before publishing, ensure:
- ✅ Project is saved
- ✅ Contract address is filled
- ✅ Backend has valid `TRUSTBLOCK_API_KEY`

## API Flow

```
Frontend (Admin Panel)
    ↓
Next.js API Route (/api/admin/trustblock/publish/[id])
    ↓
Backend Express Route (/api/trustblock/publish/:identifier)
    ↓
TrustBlock Service (trustBlockService.js)
    ↓
TrustBlock API (https://api.trustblock.run/v1/audit)
```

## Backend Route Enhancement

The backend route now accepts **both MongoDB ObjectId and slug**:

```javascript
// Works with MongoDB ID
POST /api/trustblock/publish/507f1f77bcf86cd799439011

// Also works with slug
POST /api/trustblock/publish/pecunity
```

## Auto-Updates

After successful publishing, the project record is automatically updated:

```json
{
  "socials": {
    "trustblock": "https://app.trustblock.run/auditor/cfg-ninja/project-slug"
  },
  "trustblock_url": "https://app.trustblock.run/auditor/cfg-ninja/project-slug",
  "trustblock_published_at": "2025-11-22T...",
  "trustblock_id": "..."
}
```

## Error Handling

### ❌ "Please save the project first"
- **Cause**: Trying to publish a new (unsaved) project
- **Solution**: Click "Save Changes" first

### ❌ "Contract address is required"
- **Cause**: Project doesn't have a contract address
- **Solution**: Fill in the contract address field and save

### ❌ "Failed to publish to TrustBlock"
- **Possible causes**:
  - Invalid API key
  - Network issue
  - TrustBlock API down
  - Project data format issue
- **Solution**: Check backend logs for details

## UI Layout

The buttons are arranged side-by-side:

```
┌────────────────────────────────────────────────────┐
│  PDF Generation                                     │
├────────────────────────────────────────────────────┤
│  ☐ Upload to GitHub                                │
│     PDF will only be downloaded locally            │
│                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │ 📄 Generate PDF     │  │ ☁️ Publish to TB     │ │
│  └─────────────────────┘  └──────────────────────┘ │
│                                                     │
│  ✅ PDF generated successfully!                     │
│  ✅ Successfully published to TrustBlock!           │
└────────────────────────────────────────────────────┘
```

## Status Messages

The button provides real-time feedback:

**During:**
```
Publishing to TrustBlock...
```

**Success:**
```
✅ Successfully published to TrustBlock!
https://app.trustblock.run/auditor/cfg-ninja/project-slug
```

**Error:**
```
❌ Error: Contract address is required to publish to TrustBlock
```

## Combined Workflow

You can now handle the complete audit publishing workflow:

1. **Edit project data** in admin panel
2. **Update findings** using FindingsManager
3. **Calculate scores** from findings
4. **Save project**
5. **Generate PDF** (downloads + GitHub upload)
6. **Publish to TrustBlock** (one click)
7. **Set published=true**
8. **Project is live** on all platforms!

## Testing

To test the feature:

```bash
# 1. Ensure backend is running
cd g:\auditportal\backend
npm start

# 2. Open admin panel
https://audit-portal-gamma.vercel.app/admin

# 3. Open a project (e.g., Pecunity)
https://audit-portal-gamma.vercel.app/admin/projects/[id]

# 4. Scroll to bottom
# 5. Click "Publish to TrustBlock"
# 6. Check status message
```

## Backend Configuration

Ensure your `.env` file has:

```env
TRUSTBLOCK_API_KEY=zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M
```

## Batch Publishing

For publishing multiple projects, use the existing batch endpoints:

```bash
# Publish all unpublished projects
POST /api/trustblock/publish-all

# Publish specific slugs
POST /api/trustblock/publish-batch
{
  "slugs": ["project1", "project2"]
}
```

## Future Enhancements

Potential improvements:
- [ ] Batch publish from project list page
- [ ] Preview TrustBlock data before publishing
- [ ] Auto-publish after PDF generation (optional)
- [ ] TrustBlock status indicator (published/not published)
- [ ] Edit TrustBlock data directly in admin
- [ ] Unpublish/update existing TrustBlock audits

---

**Deployed**: November 22, 2025  
**Status**: ✅ Live in Production  
**Commit**: 27598c6
