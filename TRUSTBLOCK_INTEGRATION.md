# TrustBlock Integration

This document explains the TrustBlock integration for publishing audit reports.

## Overview

The TrustBlock integration allows you to publish audit reports from the admin panel to TrustBlock's platform using their API.

**API Documentation:** https://docs.trustblock.run/technical/publish#web-report

## Configuration

### API Key
The TrustBlock API key is stored in `.env`:
```
TRUSTBLOCK_API_KEY=zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M
```

## Admin API Endpoints

### 1. Publish Single Project
```bash
POST /api/admin/trustblock/publish/:slug
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin/trustblock/publish/pecunity \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Published Pecunity to TrustBlock",
  "data": {
    "id": "uuid-here",
    "report_url": "https://app.trustblock.run/audit/uuid-here"
  }
}
```

### 2. Batch Publish Specific Projects
```bash
POST /api/admin/trustblock/publish-batch
```

**Body:**
```json
{
  "slugs": ["pecunity", "dogwifhat", "slerf-cat"]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin/trustblock/publish-batch \
  -H "Content-Type: application/json" \
  -d '{"slugs": ["pecunity", "dogwifhat"]}'
```

### 3. Publish All Unpublished Projects
```bash
POST /api/admin/trustblock/publish-all
```

This will publish all projects that:
- Are marked as `published: true`
- Don't have a `trustblock_url` field

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin/trustblock/publish-all
```

**Response:**
```json
{
  "success": true,
  "message": "Published 50 projects, 2 failed",
  "total": 52,
  "results": [
    {
      "project": "Pecunity",
      "success": true,
      "data": { ... }
    },
    {
      "project": "Project Name",
      "success": false,
      "error": "Error message"
    }
  ]
}
```

### 4. Get Publishing Status
```bash
GET /api/admin/trustblock/status
```

**Response:**
```json
{
  "success": true,
  "total_published": 376,
  "on_trustblock": 5,
  "not_on_trustblock": 371,
  "percentage": "1.3%"
}
```

## Data Format

The integration sends the following data to TrustBlock:

```javascript
{
  project_name: "Pecunity",
  project_symbol: "PEC",
  contract_address: "0x413c2834f02003752d6Cc0Bcd1cE85Af04D62fBE",
  audit_date: "2025-10-20",
  auditor: "CFG Ninja",
  report_url: "https://auditportal.cfg.ninja/pecunity",
  pdf_url: "https://github.com/CFG-NINJA/audits/blob/.../audit.pdf",
  blockchain: "Binance Smart Chain",
  findings: {
    critical: 1,
    high: 1,
    medium: 1,
    low: 2,
    informational: 0
  },
  score: 95,
  metadata: {
    slug: "pecunity",
    owner: "0x353527391365b7589503eCfFcafDFBAFf0a24D1B",
    deployer: "0xd4Fa4ee93D7D27c1c4Be36bfBa67183dD4320123",
    verified: true,
    language: "Solidity"
  }
}
```

## Database Fields

After successful publication, the following fields are added to the project:

- `trustblock_url` - The TrustBlock report URL
- `trustblock_published_at` - Timestamp of publication
- `trustblock_id` - The TrustBlock report ID (UUID)

## Manual TrustBlock URL Import

For projects already on TrustBlock, use the manual import script:

```bash
node import-trustblock-urls.js
```

Edit the script to add mappings:
```javascript
const trustBlockMappings = [
  { name: 'Project Name', trustblock: 'uuid-from-trustblock' },
  // Add more...
];
```

## Scraping TrustBlock

Attempt to auto-discover projects on TrustBlock:

```bash
node scrape-trustblock.js
```

**Note:** TrustBlock uses JavaScript rendering, so this may only find initially loaded projects. For complete data, use the manual import or API publishing.

## Rate Limiting

The API includes a 1-second delay between batch requests to avoid rate limiting.

## Testing

Test the TrustBlock API integration:

```javascript
const { TrustBlockAPI } = require('./src/services/trustBlockService');

const api = new TrustBlockAPI('your-api-key');
// Test single publish
await api.publishReport(api.formatProjectForTrustBlock(projectData));
```

## Admin Frontend Integration

Add buttons to the admin panel:

```typescript
// Publish single project
const publishToTrustBlock = async (slug: string) => {
  const response = await fetch(`/api/admin/trustblock/publish/${slug}`, {
    method: 'POST'
  });
  const result = await response.json();
  console.log(result);
};

// Publish all
const publishAllToTrustBlock = async () => {
  const response = await fetch('/api/admin/trustblock/publish-all', {
    method: 'POST'
  });
  const result = await response.json();
  console.log(result);
};
```

## Current Status

After merging BNBCHAIN → Binance Smart Chain:
- Total published projects: **376**
- Projects on TrustBlock: **5**
- Projects not on TrustBlock: **371**
- Platform distribution fixed: BSC now shows **270 projects (71.8%)**

## Next Steps

1. Test publishing a single project to TrustBlock
2. If successful, batch publish all 371 remaining projects
3. Add TrustBlock publish button to admin interface
4. Monitor TrustBlock URLs and update as needed
