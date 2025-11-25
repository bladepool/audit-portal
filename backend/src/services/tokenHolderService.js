const Settings = require('../models/Settings');

/**
 * Token Holder Scanner Service
 * Fetches top token holders from blockchain explorers
 */
class TokenHolderService {
  /**
   * Scan token holders for a contract address
   * @param {string} contractAddress - Token contract address
   * @param {string} platform - 'ethereum', 'bsc', 'polygon'
   * @param {string} supply - Total token supply
   * @returns {Promise<Object>} Distribution data
   */
  async scanTokenHolders(contractAddress, platform, supply) {
    try {
      let apiKey, baseUrl, scanSource;
      
      // Determine which API to use based on platform
      switch (platform.toLowerCase()) {
        case 'ethereum':
        case 'eth':
        case 'mainnet':
          apiKey = await Settings.get('etherscan_api_key');
          baseUrl = 'https://api.etherscan.io/api';
          scanSource = 'etherscan';
          break;
          
        case 'bsc':
        case 'binance smart chain':
        case 'bnbchain':
          apiKey = await Settings.get('bscscan_api_key');
          baseUrl = 'https://api.bscscan.com/api';
          scanSource = 'bscscan';
          break;
          
        case 'polygon':
        case 'matic':
          apiKey = await Settings.get('polygonscan_api_key');
          baseUrl = 'https://api.polygonscan.com/api';
          scanSource = 'polygonscan';
          break;
          
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      
      if (!apiKey) {
        throw new Error(`API key not configured for ${platform}. Please add it in Settings.`);
      }
      
      // Fetch token holders
      const holders = await this.fetchTopHolders(baseUrl, contractAddress, apiKey);
      
      // Calculate distribution
      const distribution = this.calculateDistribution(holders, supply);
      
      return {
        success: true,
        scanSource,
        lastScanned: new Date(),
        ...distribution
      };
      
    } catch (error) {
      console.error('Token holder scan error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch top token holders from blockchain explorer API
   */
  async fetchTopHolders(baseUrl, contractAddress, apiKey) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      // API endpoint for token holder list
      const url = `${baseUrl}?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=5&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(data.result || 'Failed to fetch token holders');
      }
      
      return data.result || [];
    } catch (error) {
      console.error('Error fetching token holders:', error);
      throw error;
    }
  }
  
  /**
   * Calculate distribution percentages and totals
   */
  calculateDistribution(holders, totalSupply) {
    // Remove commas from supply string
    const supplyNumber = parseFloat(totalSupply.replace(/,/g, ''));
    
    const distributions = holders.map((holder, index) => {
      const amount = parseFloat(holder.TokenHolderQuantity || holder.value || 0);
      const percentage = (amount / supplyNumber) * 100;
      
      return {
        name: this.identifyWalletName(holder.TokenHolderAddress, index),
        address: holder.TokenHolderAddress,
        amount: this.formatNumber(amount),
        percentage: parseFloat(percentage.toFixed(2)),
        description: this.getWalletDescription(holder.TokenHolderAddress)
      };
    });
    
    // Calculate total distributed among top 5
    const totalDistributed = distributions.reduce((sum, dist) => {
      return sum + parseFloat(dist.amount.replace(/,/g, ''));
    }, 0);
    
    const remainingSupply = supplyNumber - totalDistributed;
    
    return {
      distributions,
      totalDistributed: this.formatNumber(totalDistributed),
      remainingSupply: this.formatNumber(remainingSupply)
    };
  }
  
  /**
   * Identify wallet name based on address patterns
   */
  identifyWalletName(address, index) {
    const lowerAddress = address.toLowerCase();
    
    // Common patterns
    if (lowerAddress === '0x000000000000000000000000000000000000dead' || 
        lowerAddress === '0x0000000000000000000000000000000000000000') {
      return 'Burn Wallet';
    }
    
    // Check if it's a known DEX
    if (this.isDexAddress(lowerAddress)) {
      return 'Liquidity Pool';
    }
    
    // Check if it's a contract (this is a simple heuristic)
    if (this.looksLikeContract(lowerAddress)) {
      return `Contract ${index + 1}`;
    }
    
    return `Holder ${index + 1}`;
  }
  
  /**
   * Get wallet description based on known patterns
   */
  getWalletDescription(address) {
    const lowerAddress = address.toLowerCase();
    
    if (lowerAddress === '0x000000000000000000000000000000000000dead') {
      return 'Tokens permanently removed from circulation';
    }
    
    if (this.isDexAddress(lowerAddress)) {
      return 'Tokens locked in liquidity pool';
    }
    
    return 'Token holder wallet';
  }
  
  /**
   * Check if address is a known DEX contract
   */
  isDexAddress(address) {
    const knownDexPatterns = [
      '0x10ed43c718714eb63d5aa57b78b54704e256024e', // PancakeSwap Router
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
    ];
    
    return knownDexPatterns.some(pattern => address.includes(pattern.toLowerCase()));
  }
  
  /**
   * Heuristic to check if address looks like a contract
   */
  looksLikeContract(address) {
    // Simple heuristic: contracts often have patterns in their addresses
    // This is not 100% accurate but helps with labeling
    const contractPatterns = [
      /^0x[0-9a-f]{8}0{8}/i,  // Starts with 8 chars then 8 zeros
      /0{8}[0-9a-f]{8}$/i,    // Ends with 8 zeros then 8 chars
    ];
    
    return contractPatterns.some(pattern => pattern.test(address));
  }
  
  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  }
  
  /**
   * Get contract info (decimals, symbol, name)
   */
  async getContractInfo(baseUrl, contractAddress, apiKey) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      const url = `${baseUrl}?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.result && data.result.length > 0) {
        return data.result[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching contract info:', error);
      return null;
    }
  }
}

module.exports = new TokenHolderService();
