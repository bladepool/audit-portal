const express = require('express');
const router = express.Router();
const { calculateTotalSecuredMarketCap, formatMarketCap, clearCache } = require('../services/marketCapService');

// Get total secured market cap
router.get('/secured', async (req, res) => {
  try {
    const result = await calculateTotalSecuredMarketCap();
    
    res.json({
      totalSecured: result.totalSecured,
      formatted: formatMarketCap(result.totalSecured),
      projectsWithData: result.projectsWithData || 0,
      cached: result.cached || false,
      lastUpdated: result.lastUpdated,
      fallback: result.fallback || false
    });
  } catch (error) {
    console.error('Error fetching secured market cap:', error);
    res.status(500).json({ 
      error: error.message,
      totalSecured: 2500000000, // Fallback to $2.5B
      formatted: '$2.5B',
      fallback: true
    });
  }
});

// Force refresh the market cap cache (admin only in production)
router.post('/refresh', async (req, res) => {
  try {
    clearCache();
    const result = await calculateTotalSecuredMarketCap();
    
    res.json({
      message: 'Market cap cache refreshed',
      totalSecured: result.totalSecured,
      formatted: formatMarketCap(result.totalSecured),
      projectsWithData: result.projectsWithData || 0,
      lastUpdated: result.lastUpdated
    });
  } catch (error) {
    console.error('Error refreshing market cap:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
