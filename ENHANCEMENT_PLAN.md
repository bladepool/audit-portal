# Audit Portal Enhancements - Implementation Plan

## Overview
This document outlines the implementation of major enhancements to the CFG Ninja Audit Portal based on user requirements.

## Phase 1: Global Settings & API Keys Management ✅ IN PROGRESS

### 1.1 Backend - Settings API
- **File**: `backend/src/routes/settings.js` (NEW)
- **Endpoints**:
  - `GET /api/settings` - Get all settings
  - `GET /api/settings/:key` - Get specific setting
  - `PUT /api/settings/:key` - Update setting
  - `POST /api/settings/bulk` - Update multiple settings
- **API Keys to Manage**:
  - Etherscan API Key
  - BSC Scan API Key
  - Polygonscan API Key
  - Avalanche Scan API Key
  - GitHub API Key
  - TrustBlock API Key
  - CoinMarketCap API Key
  - GoPlus Security API Key

### 1.2 Frontend - Settings Page
- **File**: `frontend/src/app/admin/settings/page.tsx` (NEW)
- **Features**:
  - Tabbed interface for different setting categories
  - Secure input fields for API keys (masked display)
  - Test connection buttons for each API
  - Save/Reset functionality
  - Toast notifications for success/error

## Phase 2: Token Distribution Scanner

### 2.1 Backend - Token Holder API Integration
- **File**: `backend/src/services/tokenHolderService.js` (NEW)
- **Features**:
  - Integration with Etherscan/BSCScan API
  - Fetch top 5 token holders
  - Calculate distribution percentages
  - Identify liquidity pool addresses
  - Cache results to avoid rate limiting

### 2.2 Schema Updates - Liquidity Lock Fields
- **File**: `backend/src/models/Project.js`
- **New Fields**:
  ```javascript
  tokenDistribution: {
    distributions: [{
      name: String,        // Wallet name or address
      address: String,     // Full wallet address
      amount: String,      // Token amount
      percentage: Number   // % of total supply
    }],
    isLiquidityLock: Boolean,
    liquidityLockLink: String,
    lockAmount: String,
    lockLocation: String,   // Default: "Pinksale"
    unlockAmount: String,
    totalDistributed: Number,  // Sum of top 5
    remainingSupply: Number    // Supply - totalDistributed
  }
  ```

### 2.3 Frontend - Distribution Scanner UI
- **Location**: Customer project page, Token Distribution section
- **Features**:
  - "Scan Distribution" button
  - Progress indicator during scan
  - Auto-populate distribution table
  - Manual edit capability
  - Lock status toggle
  - Lock details form (location, amount, link)

## Phase 3: Notes Section & Audit Timeline

### 3.1 Schema Updates - Notes Field
- **File**: `backend/src/models/Project.js`
- **New Fields**:
  ```javascript
  notes: {
    internalNotes: String,    // Admin-only notes
    auditorNotes: String,     // Appear in PDF
    clientNotes: String,      // From client
    timeline: [{
      date: Date,
      event: String,
      user: String
    }]
  }
  ```

### 3.2 Automatic Audit Status Updates
- **Logic**:
  ```
  1. Audit Request → Auto-filled on project creation
  2. Onboarding Process → Auto-filled when 50%+ fields complete
  3. Audit Preview → Auto-filled when 90%+ fields complete
  4. Audit Release → Auto-filled on PDF generation
  
  Status Calculation:
  - "Audit Requested" → Only audit_request has date
  - "Onboarding" → audit_request + onboarding_process have dates
  - "Preview Ready" → All except audit_release have dates
  - "Published" → All dates filled, project.published = true
  ```

### 3.3 Frontend - Notes Section UI
- **Location**: New tab/section in project editor
- **Features**:
  - Rich text editor for internal notes
  - Separate field for auditor notes (included in PDF)
  - Timeline view showing all status changes
  - Auto-save functionality

## Phase 4: All Projects Page Enhancements

### 4.1 Search & Filter
- **Features**:
  - Global search across name, symbol, platform
  - Filter by platform (BSC, ETH, etc.)
  - Filter by status (Published, Draft, etc.)
  - Filter by audit date range
  - Sort by multiple columns

### 4.2 Pagination & Grid View
- **Features**:
  - Items per page: 10, 20, 30, 50, 100
  - Grid view with cards
  - List view with table
  - Quick actions (Edit, Delete, Publish, Download PDF)
  - Bulk actions selection

### 4.3 Performance Optimization
- **Backend**: Implement cursor-based pagination
- **Frontend**: Virtual scrolling for large lists
- **Caching**: Redis cache for frequently accessed projects

## Phase 5: JSON Import Function

### 5.1 Backend - Import Endpoint
- **File**: `backend/src/routes/projects.js`
- **Endpoint**: `POST /api/projects/import`
- **Features**:
  - Parse data.json format
  - Validate all fields
  - Map old field names to new schema
  - Handle file uploads (logos, PDFs)
  - Create project with all data
  - Return validation errors

### 5.2 Frontend - Import UI
- **Location**: Admin projects page
- **Features**:
  - File upload dropzone
  - JSON preview/validation
  - Field mapping interface
  - Import progress indicator
  - Success/error summary

### 5.3 Field Mapping (data.json → Project Schema)
```
data.json Field → Project Schema Field
================================
name → name
symbol → symbol
address → contract_info.contract_address
owner/ownerAddress → contract_info.contract_owner
Platform → platform
decimals → decimals
supply → supply
description → description
Url → socials.website
Telegram → socials.telegram
Twitter → socials.twitter
GitHub → socials.github
... (complete mapping in implementation)
```

## Phase 6: Icon Fields & Symbol Selector

### 6.1 Schema Updates - Icon Fields
- **File**: `backend/src/models/Project.js`
- **Pattern**: For each icon field (icon0-icon30+)
- **New Fields**:
  ```javascript
  icons: {
    buyTax: { type: String, default: 'symbols/low.png' },
    saleTax: { type: String, default: 'symbols/low.png' },
    honeypot: { type: String, default: 'symbols/low.png' },
    // ... all icon fields
  }
  ```

### 6.2 Frontend - Symbol Selector Component
- **Component**: `frontend/src/components/SymbolSelector.tsx`
- **Features**:
  - Visual selector showing all symbol icons
  - Categories: low (pass), medium (warning), high (danger), critical, info
  - Preview of selected icon
  - Quick keyboard shortcuts (L, M, H, C)

### 6.3 Import Symbols from Custom Contract
- **Action**: Copy symbols from:
  - Source: `e:\Desktop\Old Desktop November 2023\audits\PDFscript\CFGNinjaScripts\Custom Contract\symbols\`
  - Destination: `g:\auditportal\frontend\public\pdf-assets\symbols\`
- **Files**: all PNG files (low.png, medium.png, high.png, critical.png, info.png, etc.)

## Phase 7: PinkSale Fields

### 7.1 Schema Updates
- **File**: `backend/src/models/Project.js`
- **New Fields**:
  ```javascript
  pinkSale: {
    isPinkSaleStandard: { type: Boolean, default: false },
    isPinkSaleBabyToken: { type: Boolean, default: false },
    isPinkSaleLiquidityGen: { type: Boolean, default: false },
    pinkSaleUrl: { type: String }
  }
  ```

### 7.2 Frontend - PinkSale Section
- **Location**: Project editor, new section
- **Features**:
  - Three toggle switches
  - URL field for PinkSale link
  - Info tooltips explaining each option

## Phase 8: Asset Management

### 8.1 Copy Assets from Custom Contract
- **Logos**: Copy from `e:\...\Custom Contract\clogo\` to `frontend/public/pdf-assets/logos/`
- **Symbols**: Copy from `e:\...\Custom Contract\symbols\` to `frontend/public/pdf-assets/symbols/`
- **Fonts**: Verify RedHatDisplay and Montserrat are in `frontend/public/pdf-assets/fonts/`

### 8.2 Asset Management UI (Future)
- Upload interface for logos
- Symbol library manager
- Font library manager

## Implementation Priority

### HIGH PRIORITY (Week 1)
1. ✅ Global Settings page with API keys
2. ✅ Token distribution scanner integration
3. ✅ Liquidity lock fields
4. ✅ Notes section
5. ✅ Automatic audit status logic

### MEDIUM PRIORITY (Week 2)
6. ✅ Search and pagination for All Projects
7. ✅ JSON import function
8. ✅ Icon fields and symbol selector

### LOW PRIORITY (Week 3)
9. ✅ PinkSale fields
10. ✅ Asset imports and organization

## Testing Checklist

- [ ] Settings page saves/loads correctly
- [ ] Token scanner fetches real data from APIs
- [ ] Distribution calculations are accurate
- [ ] Audit status updates automatically
- [ ] Search filters projects correctly
- [ ] Pagination works with all page sizes
- [ ] JSON import handles errors gracefully
- [ ] Symbol selector updates icons in real-time
- [ ] PDF generation includes all new fields
- [ ] All assets load correctly in PDFs

## Migration Notes

### Database Migration Required
- Run migration script to add new fields to existing projects
- Set default values for icon fields
- Initialize tokenDistribution structure

### Environment Variables to Add
```env
ETHERSCAN_API_KEY=your_key_here
BSCSCAN_API_KEY=your_key_here
POLYGONSCAN_API_KEY=your_key_here
AVALANCHESCAN_API_KEY=your_key_here
```

## Documentation Updates

- Update README with new features
- Document API endpoints in Postman collection
- Create admin user guide for new features
- Video tutorials for JSON import and distribution scanner

---

**Status**: Phase 1 In Progress  
**Last Updated**: December 2024  
**Next Review**: After Phase 1 completion
