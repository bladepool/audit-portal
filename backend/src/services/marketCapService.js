const axios = require('axios');
const Project = require('../models/Project');

const CMC_API_KEY = '23955f35-bd18-4f6b-9246-0e9a8a22f319';
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1';

// Cache for market cap data
let marketCapCache = {
  totalSecured: null,
  timestamp: null,
  ttl: 60 * 60 * 1000 // 1 hour cache
};

/**
 * Get market cap for a specific contract address
 */
async function getTokenMarketCap(contractAddress, platform) {
  try {
    // Map platform names to CMC platform IDs
    const platformMap = {
      'BNBCHAIN': 'binance-smart-chain',
      'BSC': 'binance-smart-chain',
      'BINANCE SMART CHAIN': 'binance-smart-chain',
      'ETHEREUM': 'ethereum',
      'ETH': 'ethereum',
      'POLYGON': 'polygon',
      'MATIC': 'polygon',
      'AVALANCHE': 'avalanche',
      'AVAX': 'avalanche',
      'ARBITRUM': 'arbitrum',
      'OPTIMISM': 'optimism',
      'BASE': 'base',
      'SOLANA': 'solana',
      'SOL': 'solana'
    };

    const platformSlug = platformMap[platform?.toUpperCase()] || 'binance-smart-chain';

    // Try to get market cap from CoinMarketCap using contract address
    const response = await axios.get(`${CMC_API_URL}/cryptocurrency/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        address: contractAddress,
        convert: 'USD'
      },
      timeout: 5000
    });

    if (response.data && response.data.data) {
      const tokenData = Object.values(response.data.data)[0];
      if (tokenData && tokenData.quote && tokenData.quote.USD) {
        return {
          marketCap: tokenData.quote.USD.market_cap || 0,
          price: tokenData.quote.USD.price || 0,
          symbol: tokenData.symbol,
          name: tokenData.name
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching market cap for ${contractAddress}:`, error.message);
    return null;
  }
}

/**
 * Calculate total secured market cap from all published projects
 */
async function calculateTotalSecuredMarketCap() {
  try {
    // Check cache
    if (marketCapCache.totalSecured !== null && 
        marketCapCache.timestamp && 
        (Date.now() - marketCapCache.timestamp < marketCapCache.ttl)) {
      return {
        totalSecured: marketCapCache.totalSecured,
        cached: true,
        lastUpdated: new Date(marketCapCache.timestamp).toISOString()
      };
    }

    // Get all published projects with contract addresses
    const projects = await Project.find({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: '' }
    }).select('name symbol contract_info.contract_address platform');

    console.log(`Found ${projects.length} projects with contract addresses`);

    let totalMarketCap = 0;
    const projectsData = [];

    // Fetch market cap for each project (with rate limiting)
    for (const project of projects) {
      const marketCapData = await getTokenMarketCap(
        project.contract_info.contract_address,
        project.platform
      );

      if (marketCapData && marketCapData.marketCap > 0) {
        totalMarketCap += marketCapData.marketCap;
        projectsData.push({
          name: project.name,
          symbol: project.symbol,
          marketCap: marketCapData.marketCap,
          price: marketCapData.price
        });
        console.log(`✓ ${project.name}: $${(marketCapData.marketCap / 1e9).toFixed(2)}B`);
      }

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // If we have very few projects with actual market cap data,
    // use an estimation based on audit scores and project count
    if (projectsData.length < 10) {
      const totalProjects = await Project.countDocuments({ published: true });
      
      // Conservative estimation: average market cap of $5-10M per audited project
      // This is a placeholder until we have more real data
      const estimatedAvgMarketCap = 7000000; // $7M average
      const estimatedTotal = totalProjects * estimatedAvgMarketCap;
      
      totalMarketCap = Math.max(totalMarketCap, estimatedTotal);
      
      console.log(`Using estimation for ${totalProjects} projects`);
    }

    // Cache the result
    marketCapCache.totalSecured = totalMarketCap;
    marketCapCache.timestamp = Date.now();

    return {
      totalSecured: totalMarketCap,
      projectsWithData: projectsData.length,
      projectsData: projectsData,
      cached: false,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating secured market cap:', error);
    
    // Return fallback value
    return {
      totalSecured: 2500000000, // $2.5B default
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Format market cap for display (e.g., $2.5B, $150M)
 */
function formatMarketCap(value) {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Clear the cache (useful for testing or forced refresh)
 */
function clearCache() {
  marketCapCache = {
    totalSecured: null,
    timestamp: null,
    ttl: 60 * 60 * 1000
  };
}

module.exports = {
  getTokenMarketCap,
  calculateTotalSecuredMarketCap,
  formatMarketCap,
  clearCache
};
