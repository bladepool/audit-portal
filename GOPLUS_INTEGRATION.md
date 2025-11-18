# GoPlus Labs API Integration

## Overview
This audit portal automatically fetches real-time security data from GoPlus Labs API when a project is flagged as "Live". This provides comprehensive token security assessment including honeypot detection, tax checks, ownership risks, and more.

## Features

### Automatic Data Fetching
When an admin flags a project as "Live" (toggles the `live` field to `true`), the system automatically:
1. Detects the contract address and blockchain platform
2. Queries the GoPlus Labs Token Security API
3. Updates all risk assessment fields with real-time data
4. Saves the updated project with security information

### Manual Data Fetching
Admins can manually trigger a GoPlus data fetch by:
1. Opening the project edit page (`/admin/projects/[id]`)
2. Ensuring the contract address is filled in
3. Clicking the "Fetch GoPlus Security Data" button
4. The form fields will automatically update with fetched data

## Supported Security Checks

The integration fetches and maps the following 20+ security parameters:

| Field | GoPlus API Field | Description |
|-------|------------------|-------------|
| Can Mint? | `is_mintable` | Token owner can mint unlimited tokens |
| Edit Taxes over 25% | `slippage_modifiable` | Contract can modify taxes above 25% |
| Max Transaction | `trading_cooldown` | Maximum transaction amount limit exists |
| Max Wallet | N/A | Maximum wallet holding limit (not directly provided) |
| Enable Trade | `can_take_back_ownership` | Owner can enable/disable trading |
| Modify Tax | `slippage_modifiable` | Owner can modify buy/sell taxes |
| Honeypot | `is_honeypot` | Token is a honeypot (cannot sell) |
| Trading Cooldown | `trading_cooldown` | Cooldown period between trades exists |
| Transfer Pausable | `transfer_pausable` | Owner can pause transfers |
| Can Pause Trade? | `transfer_pausable` | Owner can pause trading |
| Anti Bot | `is_anti_bot` | Anti-bot mechanism present (GOOD) |
| Antiwhale | `is_anti_whale` | Anti-whale mechanism present (GOOD) |
| Proxy Contract | `is_proxy` | Contract uses proxy pattern |
| Blacklisted | `is_blacklisted` | Blacklist mechanism exists |
| Hidden Ownership | `hidden_owner` | Ownership is hidden/obfuscated |
| Buy Tax | `buy_tax` | Buy tax percentage (0-100) |
| Sell Tax | `sell_tax` | Sell tax percentage (0-100) |
| Selfdestruct | `selfdestruct` | Contract has selfdestruct function |
| Whitelisted | `is_whitelisted` | Whitelist mechanism exists |
| External Call | `external_call` | Contract makes external calls |
| Cannot Buy | `cannot_buy` | Buying is disabled |
| Cannot Sell | `cannot_sell_all` | Selling is disabled |

## Supported Blockchains

The integration supports multiple blockchain networks:

| Platform | Chain ID | Notes |
|----------|----------|-------|
| Ethereum | 1 | Default |
| BSC (Binance Smart Chain) | 56 | |
| Polygon | 137 | |
| Arbitrum | 42161 | |
| Optimism | 10 | |
| Avalanche | 43114 | |
| Fantom | 250 | |
| Cronos | 25 | |
| Base | 8453 | |
| Solana | solana | Special handling |

## API Endpoints

### Automatic Fetch (On Update)
```
PUT /api/projects/:id
```
When `live: true` is set in the request body, the server automatically fetches GoPlus data.

### Manual Fetch
```
POST /api/projects/:id/fetch-goplus
```
Manually trigger GoPlus data fetch for a specific project.

**Response:**
```json
{
  "success": true,
  "message": "GoPlus security data fetched and updated successfully",
  "overview": { ... },
  "rawData": { ... }
}
```

## Implementation Details

### Backend Service (`backend/src/services/goplusService.js`)

The service provides:
- `fetchTokenSecurity(chainId, contractAddress)` - Fetches security data from GoPlus API
- `getChainId(platform)` - Maps platform names to chain IDs
- `mapGoPlusToOverview(securityData)` - Maps GoPlus response to our schema

### Frontend Integration

**Admin Form (`frontend/src/app/admin/projects/[id]/page.tsx`)**
- Displays "Fetch GoPlus Security Data" button when editing existing projects
- Shows real-time fetch status messages
- Auto-updates all form fields with fetched data
- Info banner explains automatic fetch behavior

**API Client (`frontend/src/lib/api.ts`)**
- `projectsAPI.fetchGoPlus(id)` - Calls the manual fetch endpoint

## Usage Examples

### Example 1: Flag Project as Live (Automatic Fetch)
```javascript
// When admin toggles "Live" switch to ON and saves
const projectData = {
  ...existingData,
  live: true,
  contract_info: {
    contract_address: '0x...',
  },
  platform: 'BSC'
};

await projectsAPI.update(projectId, projectData);
// GoPlus data is automatically fetched and merged into overview
```

### Example 2: Manual Fetch
```javascript
// Admin clicks "Fetch GoPlus Security Data" button
const response = await projectsAPI.fetchGoPlus(projectId);
if (response.data.success) {
  // Form fields are automatically updated
  console.log('Security data fetched:', response.data.overview);
}
```

## Error Handling

The integration handles various error scenarios:
- **Missing contract address**: Returns error message asking for contract address
- **GoPlus API timeout**: 10-second timeout with graceful failure
- **Invalid chain**: Defaults to Ethereum (chain ID 1)
- **API rate limits**: Logs error but continues with update
- **Network errors**: Catches and returns error message

## Data Interpretation

### Pass vs Fail Logic
For most security fields:
- **GoPlus returns "0"** → Safe (false in our model) → **Pass**
- **GoPlus returns "1"** → Risk present (true in our model) → **Fail**

**Exceptions (where "1" is good):**
- `is_anti_bot`: "1" means anti-bot is present → **Pass**
- `is_anti_whale`: "1" means anti-whale is present → **Pass**

### Tax Values
- `buy_tax` and `sell_tax` are returned as string percentages (e.g., "5.00")
- Converted to numbers and stored as 0-100 values

## Customer-Facing Display

The fetched data is displayed on the customer portal (`/[slug]`) in the "Manual Code Review Risk Results" section:

```
✓ Can Mint? - Pass
✓ Honeypot - Pass
✓ Buy Tax - 5%
✓ Sell Tax - 5%
✗ Max Transaction - Fail
```

## Configuration

No additional configuration is required. The integration:
- Uses the public GoPlus Labs API (no API key needed)
- Works out-of-the-box once deployed
- Automatically detects platform and contract address from project data

## Testing

To test the integration:

1. **Create a test project** with a valid contract address (e.g., a known BSC token)
2. **Set platform** to match the contract's blockchain
3. **Click "Fetch GoPlus Security Data"** button
4. **Verify** the form fields update with real data
5. **Save** and check the customer portal to see the data displayed

## Limitations

- GoPlus API may have rate limits for excessive requests
- Some fields are not directly provided by GoPlus and use approximations
- `max_wallet` field is not directly available from GoPlus
- Solana contracts require different handling
- Data accuracy depends on GoPlus Labs' scanning capabilities

## Troubleshooting

**Issue: "Failed to fetch GoPlus data"**
- Check if contract address is valid
- Verify the contract exists on the specified blockchain
- Check backend logs for detailed error messages

**Issue: "Token data not found in GoPlus response"**
- Contract may be too new (not yet indexed by GoPlus)
- Contract address may be incorrect
- Blockchain may not be supported

**Issue: Fields not updating**
- Ensure you're editing an existing project (not creating new)
- Verify contract address is filled in before clicking fetch
- Check browser console for frontend errors

## Future Enhancements

Potential improvements:
- Add caching to reduce API calls
- Support for more blockchains
- Background scheduled updates for live projects
- Historical security data tracking
- GoPlus API key integration for higher rate limits
- Webhook notifications when security status changes
