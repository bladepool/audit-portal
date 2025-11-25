const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Public (should be protected in production)
 */
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.find().select('-__v');
    
    // Convert array to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt
      };
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @route   GET /api/settings/:key
 * @desc    Get a specific setting by key
 * @access  Public
 */
router.get('/:key', async (req, res) => {
  try {
    const value = await Settings.get(req.params.key);
    
    if (value === null) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ 
      key: req.params.key, 
      value 
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

/**
 * @route   PUT /api/settings/:key
 * @desc    Update or create a setting
 * @access  Public (should be protected in production)
 */
router.put('/:key', async (req, res) => {
  try {
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const setting = await Settings.set(req.params.key, value, description);
    
    res.json({
      success: true,
      setting: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * @route   POST /api/settings/bulk
 * @desc    Update multiple settings at once
 * @access  Public (should be protected in production)
 */
router.post('/bulk', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const [key, data] of Object.entries(settings)) {
      try {
        const setting = await Settings.set(
          key, 
          data.value, 
          data.description || ''
        );
        results.push({
          key: setting.key,
          value: setting.value,
          success: true
        });
      } catch (error) {
        errors.push({
          key,
          error: error.message
        });
      }
    }
    
    res.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    res.status(500).json({ error: 'Failed to bulk update settings' });
  }
});

/**
 * @route   DELETE /api/settings/:key
 * @desc    Delete a setting
 * @access  Public (should be protected in production)
 */
router.delete('/:key', async (req, res) => {
  try {
    const result = await Settings.deleteOne({ key: req.params.key });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Setting deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

/**
 * @route   POST /api/settings/test/:service
 * @desc    Test API key connection for a service
 * @access  Public
 */
router.post('/test/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { apiKey } = req.body;
    
    let testResult = { success: false, message: 'Service not implemented' };
    
    switch (service) {
      case 'etherscan':
        testResult = await testEtherscanKey(apiKey);
        break;
      case 'bscscan':
        testResult = await testBSCScanKey(apiKey);
        break;
      case 'github':
        testResult = await testGitHubKey(apiKey);
        break;
      case 'trustblock':
        testResult = await testTrustBlockKey(apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Unknown service' });
    }
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to test API key',
      error: error.message 
    });
  }
});

// Helper functions to test API keys
async function testEtherscanKey(apiKey) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === '1') {
      return { success: true, message: 'Etherscan API key is valid' };
    } else {
      return { success: false, message: data.result || 'Invalid API key' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testBSCScanKey(apiKey) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://api.bscscan.com/api?module=stats&action=bnbsupply&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === '1') {
      return { success: true, message: 'BSCScan API key is valid' };
    } else {
      return { success: false, message: data.result || 'Invalid API key' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testGitHubKey(apiKey) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${apiKey}`,
        'User-Agent': 'CFG-Ninja-Audit-Portal'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: `GitHub API key is valid (${data.login})` 
      };
    } else {
      return { success: false, message: 'Invalid GitHub API key' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testTrustBlockKey(apiKey) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.trustblock.run/audits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true, message: 'TrustBlock API key is valid' };
    } else {
      return { success: false, message: 'Invalid TrustBlock API key' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = router;
