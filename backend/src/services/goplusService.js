const axios = require('axios');

/**
 * GoPlus Labs API Service
 * Fetches token security data from GoPlus Labs
 */

const GOPLUS_API_BASE = 'https://api.gopluslabs.io/api/v1';

/**
 * Map GoPlus API response to our Project model overview fields
 * GoPlus returns "0" for false/pass and "1" for true/fail for most fields
 * @param {Object} securityData - GoPlus security data
 * @returns {Object} - Mapped overview object
 */
function mapGoPlusToOverview(securityData) {
  const overview = {};
  
  // Helper to convert GoPlus "0"/"1" to boolean (1 = risk present = true)
  const toBool = (value) => value === "1" || value === true;
  
  // Can Mint? - is_mintable
  overview.mint = toBool(securityData.is_mintable);
  
  // Edit Taxes over 25% - Check if can_take_back_ownership exists or slippage_modifiable
  overview.max_tax = toBool(securityData.slippage_modifiable);
  
  // Max Transaction - trading_cooldown or transfer_pausable might indicate this
  overview.max_transaction = toBool(securityData.trading_cooldown);
  
  // Max Wallet - No direct field, use anti_whale
  overview.max_wallet = false; // Not directly provided by GoPlus
  
  // Enable Trade - can_take_back_ownership might control trading
  overview.enable_trading = toBool(securityData.can_take_back_ownership);
  
  // Modify Tax - slippage_modifiable
  overview.modify_tax = toBool(securityData.slippage_modifiable);
  
  // Honeypot - is_honeypot
  overview.honeypot = toBool(securityData.is_honeypot);
  
  // Trading Cooldown - trading_cooldown
  overview.trading_cooldown = toBool(securityData.trading_cooldown);
  
  // Transfer Pausable - transfer_pausable
  overview.pause_transfer = toBool(securityData.transfer_pausable);
  
  // Can Pause Trade? - transfer_pausable or cannot_sell_all
  overview.pause_trade = toBool(securityData.transfer_pausable);
  
  // Anti Bot - is_anti_bot (Note: "1" means anti-bot is present = GOOD)
  overview.anti_bot = toBool(securityData.is_anti_bot);
  
  // Antiwhale - is_anti_whale (Note: "1" means anti-whale is present = GOOD)
  overview.anit_whale = toBool(securityData.is_anti_whale);
  
  // Proxy Contract - is_proxy
  overview.proxy_check = toBool(securityData.is_proxy);
  
  // Blacklisted - is_blacklisted
  overview.blacklist = toBool(securityData.is_blacklisted);
  
  // Hidden Ownership - hidden_owner
  overview.hidden_owner = toBool(securityData.hidden_owner);
  
  // Buy Tax - buy_tax (comes as string percentage like "5.00")
  overview.buy_tax = securityData.buy_tax ? parseFloat(securityData.buy_tax) : 0;
  
  // Sell Tax - sell_tax (comes as string percentage like "5.00")
  overview.sell_tax = securityData.sell_tax ? parseFloat(securityData.sell_tax) : 0;
  
  // Selfdestruct - selfdestruct
  overview.self_destruct = toBool(securityData.selfdestruct);
  
  // Whitelisted - is_whitelisted
  overview.whitelist = toBool(securityData.is_whitelisted);
  
  // External Call - external_call
  overview.external_call = toBool(securityData.external_call);
  
  // Additional fields from GoPlus
  // cannot_buy
  overview.cannot_buy = toBool(securityData.cannot_buy);
  
  // cannot_sell_all (cannot sell)
  overview.cannot_sell = toBool(securityData.cannot_sell_all);
  
  // can_take_back_ownership
  overview.can_take_ownership = toBool(securityData.can_take_back_ownership);
  
  return overview;
}

/**
 * Fetch token security data from GoPlus Labs API
 * @param {String} chainId - Chain ID (e.g., "1" for Ethereum, "56" for BSC)
 * @param {String} contractAddress - Token contract address
 * @returns {Object} - Security overview data
 */
async function fetchTokenSecurity(chainId, contractAddress) {
  try {
    if (!contractAddress) {
      throw new Error('Contract address is required');
    }
    
    // Default to Ethereum if chainId not provided
    const chain = chainId || '1';
    
    // GoPlus API endpoint: /api/v1/token_security/{chain_id}?contract_addresses={addresses}
    const url = `${GOPLUS_API_BASE}/token_security/${chain}`;
    
    console.log(`Fetching token security from GoPlus: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        contract_addresses: contractAddress.toLowerCase()
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (response.data && response.data.result) {
      const tokenData = response.data.result[contractAddress.toLowerCase()];
      
      if (!tokenData) {
        throw new Error('Token data not found in GoPlus response');
      }
      
      // Map GoPlus data to our overview structure
      const overview = mapGoPlusToOverview(tokenData);
      
      return {
        success: true,
        overview,
        rawData: tokenData, // Keep raw data for reference
        fetchedAt: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid response from GoPlus API');
    }
  } catch (error) {
    console.error('GoPlus API Error:', error.message);
    
    return {
      success: false,
      error: error.message,
      overview: null
    };
  }
}

/**
 * Get chain ID from platform name
 * @param {String} platform - Platform name (e.g., "Ethereum", "BSC", "Polygon")
 * @returns {String} - Chain ID
 */
function getChainId(platform) {
  const chainMap = {
    'ethereum': '1',
    'eth': '1',
    'bsc': '56',
    'binance smart chain': '56',
    'polygon': '137',
    'matic': '137',
    'arbitrum': '42161',
    'optimism': '10',
    'avalanche': '43114',
    'fantom': '250',
    'cronos': '25',
    'base': '8453',
    'solana': 'solana', // GoPlus supports Solana differently
  };
  
  const platformLower = (platform || 'ethereum').toLowerCase();
  return chainMap[platformLower] || '1'; // Default to Ethereum
}

module.exports = {
  fetchTokenSecurity,
  getChainId,
  mapGoPlusToOverview
};
