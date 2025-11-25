# Token Distribution Scanner - User Guide

## Phase 2 Complete ✅

The Token Distribution Scanner automatically fetches the top 5 token holders from blockchain explorers (Etherscan, BSCScan, Polygonscan) and populates your audit report with accurate holder data.

---

## Features

### 🔍 **Automatic Blockchain Scanning**
- Fetches top 5 token holders directly from blockchain APIs
- Supports Ethereum, Binance Smart Chain, and Polygon
- Smart wallet identification (Burn Wallet, Liquidity Pool, Contract, Holder)
- Automatic percentage calculations

### 🔐 **Liquidity Lock Tracking**
- Toggle liquidity lock status
- Record lock amount and location (Pinksale, Unicrypt, DxSale, etc.)
- Add lock verification links
- Track unlock amounts

### 📊 **Distribution Analytics**
- Total distributed tokens
- Remaining supply calculation
- Last scanned timestamp
- Scan source tracking (which blockchain explorer)

---

## Setup Instructions

### Step 1: Add API Keys (Settings Page)

1. Navigate to **Admin → Settings**
2. Scroll to **Blockchain Scanner API Keys** section
3. Add your API keys:
   - **Etherscan API Key** - Get from: https://etherscan.io/myapikey
   - **BSCScan API Key** - Get from: https://bscscan.com/myapikey
   - **Polygonscan API Key** - Get from: https://polygonscan.com/myapikey
4. Click **Test** buttons to verify each key works
5. Click **Save All Settings**

> **Note**: API keys are free. Create accounts on each explorer and generate keys from their "API Keys" section.

---

## Usage Instructions

### Step 2: Create/Edit a Project

1. Navigate to **Admin → Projects → Create New** (or edit existing)
2. Fill in **required fields**:
   - **Name** - Token name
   - **Symbol** - Token symbol
   - **Decimals** - Usually 9 or 18
   - **Supply** - Total token supply
   - **Contract Address** - Smart contract address (in Contract Information section)
   - **Platform** - Select blockchain (Ethereum, Binance Smart Chain, or Polygon)
3. Click **Save Project**

### Step 3: Scan Token Distribution

1. Scroll to **Token Distribution Scanner** section
2. Ensure:
   - ✅ Contract Address is filled
   - ✅ Platform is selected
   - ✅ Correct API key is set in Settings
3. Click **🔍 Scan Distribution** button
4. Wait for scan to complete (~5-10 seconds)

### Step 4: Review Scanned Data

The scanner will automatically populate:

**Top Token Holders Table:**
| Holder | Address | Amount | Percentage |
|--------|---------|--------|------------|
| Burn Wallet | 0x0000...dead | 1,250,000 | 5.00% |
| Liquidity Pool | 0x10ed...9cdc | 500,000 | 2.00% |
| Contract 1 | 0x7a25...8e89 | 250,000 | 1.00% |
| Holder 1 | 0x1234...5678 | 100,000 | 0.40% |
| Holder 2 | 0xabcd...ef01 | 75,000 | 0.30% |

**Summary Data:**
- Total Distributed: 2,175,000 tokens
- Remaining Supply: 22,825,000 tokens
- Last Scanned: 1/15/2025, 3:45 PM
- Scan Source: bscscan

### Step 5: Add Liquidity Lock Info (Optional)

1. Toggle **Liquidity Locked** switch to ON
2. Fill in lock details:
   - **Lock Amount**: e.g., "50 BNB"
   - **Lock Location**: Select from dropdown (Pinksale, Unicrypt, DxSale, etc.)
   - **Lock Link**: Verification URL from lock platform
   - **Unlock Amount**: Tokens available after unlock
3. Click **Save Project**

---

## Smart Wallet Identification

The scanner automatically identifies wallet types:

| Wallet Type | Detection Method | Example |
|-------------|------------------|---------|
| **Burn Wallet** | Address ends with "dead" or "0000" | 0x000000000000000000000000000000000000dead |
| **Liquidity Pool** | Matches known DEX routers (PancakeSwap, Uniswap V2/V3) | 0x10ed43c718714eb63d5aa57b78b54704e256024e |
| **Contract N** | Non-DEX contract addresses | 0x7a250d5630b4cf539739df2c5dacb4c659f2488d |
| **Holder N** | Regular wallet addresses | 0x1234567890abcdef1234567890abcdef12345678 |

---

## API Integration Details

### Blockchain Endpoints Used

**Etherscan:**
```
https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress={address}&page=1&offset=5&apikey={key}
```

**BSCScan:**
```
https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress={address}&page=1&offset=5&apikey={key}
```

**Polygonscan:**
```
https://api.polygonscan.com/api?module=token&action=tokenholderlist&contractaddress={address}&page=1&offset=5&apikey={key}
```

---

## Troubleshooting

### ❌ "Contract address is required to scan token distribution"
**Solution**: Fill in the Contract Address field in the Contract Information section.

### ❌ "Platform is required to scan token distribution"
**Solution**: Select a blockchain from the Platform dropdown (must be Ethereum, BSC, or Polygon).

### ❌ "No API key configured for {platform}"
**Solution**: Go to Settings page and add the API key for the selected blockchain.

### ❌ "Invalid API Key"
**Solution**: 
1. Verify API key is correct in Settings
2. Click "Test" button to check
3. Generate a new key if needed
4. Make sure you copied the entire key (no spaces)

### ❌ "Contract address not found on blockchain"
**Solution**: 
1. Verify contract address is correct
2. Ensure contract is deployed on the selected blockchain
3. Wait a few minutes if contract was just deployed

---

## Backend Architecture

### Files Modified/Created

1. **backend/src/models/Project.js** ✅
   - Enhanced `tokenDistribution` schema with comprehensive fields
   - Added distributions array, lock fields, scan metadata

2. **backend/src/services/tokenHolderService.js** ✅ (NEW - 212 lines)
   - `scanTokenHolders()` - Main entry point
   - `fetchTopHolders()` - API call to blockchain
   - `calculateDistribution()` - Percentage math
   - `identifyWalletName()` - Smart wallet labeling
   - `isDexAddress()` - DEX router detection
   - `formatNumber()` - Comma formatting

3. **backend/src/routes/projects.js** ✅
   - Added `POST /api/projects/:id/scan-distribution` endpoint
   - Requires authentication
   - Returns distribution data

4. **frontend/src/app/admin/projects/[id]/page.tsx** ✅
   - Added distribution state variables
   - Created `handleScanDistribution()` function
   - Enhanced UI with scanner button and table
   - Added liquidity lock toggle and fields

---

## Next Steps (Phase 3)

The following features are planned for the next phase:

- [ ] **Notes Section** - Internal notes, auditor notes, client notes
- [ ] **Automatic Audit Status Updates** - Timeline auto-updates based on completion %
- [ ] **PDF Generator Update** - Include distribution data in generated reports
- [ ] **Manual Distribution Editing** - Add/edit/delete distribution entries manually

---

## Testing Checklist

Before using in production, test the following:

- ✅ API key testing in Settings page
- ✅ Scan distribution on Ethereum contract
- ✅ Scan distribution on BSC contract
- ✅ Scan distribution on Polygon contract
- ✅ Liquidity lock toggle and fields
- ✅ Distribution data persists after save
- ✅ Distribution data loads when editing project
- ⏳ PDF generation includes distribution data (pending Phase 3)

---

## Support

For issues or questions, refer to:
- **Backend Service**: `backend/src/services/tokenHolderService.js`
- **Frontend Component**: `frontend/src/app/admin/projects/[id]/page.tsx`
- **API Route**: `backend/src/routes/projects.js` (line 374-437)
- **Schema**: `backend/src/models/Project.js` (line 172-196)

Last Updated: January 15, 2025
Phase 2 Status: ✅ COMPLETE
