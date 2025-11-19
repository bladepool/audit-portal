const express = require('express');
const router = express.Router();

let axios;
try {
  axios = require('axios');
} catch (error) {
  console.error('⚠️ Failed to load axios in blockchains route:', error.message);
}

const CMC_API_KEY = '23955f35-bd18-4f6b-9246-0e9a8a22f319';
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1';

// Cache for blockchain/platform data
let blockchainCache = {
  data: null,
  timestamp: null,
  ttl: 24 * 60 * 60 * 1000 // 24 hours
};

function getFallbackBlockchains() {
  const fallbackBlockchains = [
    { name: 'Algorand', symbol: 'ALGO', slug: 'algorand' },
    { name: 'Aptos', symbol: 'APT', slug: 'aptos' },
    { name: 'Arbitrum', symbol: 'ARB', slug: 'arbitrum' },
    { name: 'Avalanche', symbol: 'AVAX', slug: 'avalanche' },
    { name: 'Base', symbol: 'BASE', slug: 'base' },
    { name: 'Binance Smart Chain', symbol: 'BSC', slug: 'binance-smart-chain' },
    { name: 'Bitcoin', symbol: 'BTC', slug: 'bitcoin' },
    { name: 'BNB Chain', symbol: 'BNB', slug: 'bnb-chain' },
    { name: 'Cardano', symbol: 'ADA', slug: 'cardano' },
    { name: 'Cosmos', symbol: 'ATOM', slug: 'cosmos' },
    { name: 'Cronos', symbol: 'CRO', slug: 'cronos' },
    { name: 'Ethereum', symbol: 'ETH', slug: 'ethereum' },
    { name: 'Fantom', symbol: 'FTM', slug: 'fantom' },
    { name: 'Hedera', symbol: 'HBAR', slug: 'hedera' },
    { name: 'Linea', symbol: 'LINEA', slug: 'linea' },
    { name: 'Near Protocol', symbol: 'NEAR', slug: 'near-protocol' },
    { name: 'Optimism', symbol: 'OP', slug: 'optimism' },
    { name: 'Polygon', symbol: 'MATIC', slug: 'polygon' },
    { name: 'Polkadot', symbol: 'DOT', slug: 'polkadot' },
    { name: 'Solana', symbol: 'SOL', slug: 'solana' },
    { name: 'Stellar', symbol: 'XLM', slug: 'stellar' },
    { name: 'Sui', symbol: 'SUI', slug: 'sui' },
    { name: 'Tron', symbol: 'TRX', slug: 'tron' },
    { name: 'zkSync Era', symbol: 'ZK', slug: 'zksync' }
  ];
  
  return {
    blockchains: fallbackBlockchains,
    count: fallbackBlockchains.length,
    lastUpdated: new Date().toISOString(),
    fallback: true
  };
}

// Get list of blockchains/platforms
router.get('/list', async (req, res) => {
  // If axios not available, return fallback immediately
  if (!axios) {
    return res.json(getFallbackBlockchains());
  }
  
  try {
    // Check if cache is valid
    if (blockchainCache.data && blockchainCache.timestamp && 
        (Date.now() - blockchainCache.timestamp < blockchainCache.ttl)) {
      return res.json(blockchainCache.data);
    }

    // Fetch from CoinMarketCap
    const response = await axios.get(`${CMC_API_URL}/cryptocurrency/map`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        limit: 5000,
        sort: 'cmc_rank'
      }
    });

    if (response.data && response.data.data) {
      // Extract unique platforms/blockchains
      const platformsSet = new Set();
      const blockchains = [];

      response.data.data.forEach(crypto => {
        if (crypto.platform && crypto.platform.name) {
          if (!platformsSet.has(crypto.platform.name)) {
            platformsSet.add(crypto.platform.name);
            blockchains.push({
              id: crypto.platform.id,
              name: crypto.platform.name,
              symbol: crypto.platform.symbol,
              slug: crypto.platform.slug
            });
          }
        }
      });

      // Add common standalone blockchains that might not appear as platforms
      const commonBlockchains = [
        { name: 'Bitcoin', symbol: 'BTC', slug: 'bitcoin' },
        { name: 'Binance Smart Chain', symbol: 'BSC', slug: 'binance-smart-chain' },
        { name: 'Ethereum', symbol: 'ETH', slug: 'ethereum' },
        { name: 'Polygon', symbol: 'MATIC', slug: 'polygon' },
        { name: 'Avalanche', symbol: 'AVAX', slug: 'avalanche' },
        { name: 'Solana', symbol: 'SOL', slug: 'solana' },
        { name: 'Cardano', symbol: 'ADA', slug: 'cardano' },
        { name: 'Polkadot', symbol: 'DOT', slug: 'polkadot' },
        { name: 'Arbitrum', symbol: 'ARB', slug: 'arbitrum' },
        { name: 'Optimism', symbol: 'OP', slug: 'optimism' },
        { name: 'Base', symbol: 'BASE', slug: 'base' },
        { name: 'Tron', symbol: 'TRX', slug: 'tron' },
        { name: 'Cosmos', symbol: 'ATOM', slug: 'cosmos' },
        { name: 'BNB Chain', symbol: 'BNB', slug: 'bnb-chain' },
        { name: 'Fantom', symbol: 'FTM', slug: 'fantom' },
        { name: 'Cronos', symbol: 'CRO', slug: 'cronos' },
        { name: 'Near Protocol', symbol: 'NEAR', slug: 'near-protocol' },
        { name: 'Aptos', symbol: 'APT', slug: 'aptos' },
        { name: 'Sui', symbol: 'SUI', slug: 'sui' },
        { name: 'Stellar', symbol: 'XLM', slug: 'stellar' },
        { name: 'Algorand', symbol: 'ALGO', slug: 'algorand' },
        { name: 'Hedera', symbol: 'HBAR', slug: 'hedera' },
        { name: 'zkSync Era', symbol: 'ZK', slug: 'zksync' },
        { name: 'Linea', symbol: 'LINEA', slug: 'linea' }
      ];

      // Merge and deduplicate
      commonBlockchains.forEach(cb => {
        if (!platformsSet.has(cb.name)) {
          platformsSet.add(cb.name);
          blockchains.push(cb);
        }
      });

      // Sort alphabetically
      blockchains.sort((a, b) => a.name.localeCompare(b.name));

      // Cache the result
      const result = {
        blockchains,
        count: blockchains.length,
        lastUpdated: new Date().toISOString()
      };

      blockchainCache.data = result;
      blockchainCache.timestamp = Date.now();

      res.json(result);
    } else {
      throw new Error('Invalid response from CoinMarketCap API');
    }
  } catch (error) {
    console.error('Error fetching blockchains:', error.message);
    
    // Return fallback list if API fails
    const fallbackData = getFallbackBlockchains();
    fallbackData.error = error.message;
    return res.json(fallbackData);
  }
});

module.exports = router;
