const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private (Admin only)
 */
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Settings.find({});
    
    // Convert to key-value object
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
 * @desc    Get a specific setting
 * @access  Public (for specific keys like github_token which are sensitive)
 */
router.get('/:key', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

/**
 * @route   PUT /api/settings/:key
 * @desc    Update a setting
 * @access  Private (Admin only)
 */
router.put('/:key', auth, async (req, res) => {
  try {
    const { value, description } = req.body;
    
    const setting = await Settings.set(req.params.key, value, description);
    
    res.json({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * @route   DELETE /api/settings/:key
 * @desc    Delete a setting
 * @access  Private (Admin only)
 */
router.delete('/:key', auth, async (req, res) => {
  try {
    const setting = await Settings.findOneAndDelete({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

/**
 * @route   POST /api/settings/bulk
 * @desc    Update multiple settings at once
 * @access  Private (Admin only)
 */
router.post('/bulk', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }
    
    const promises = Object.entries(settings).map(([key, data]) => {
      return Settings.set(key, data.value, data.description);
    });
    
    await Promise.all(promises);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * @route   POST /api/settings/test/:service
 * @desc    Test API key connection for a service
 * @access  Private (Admin only)
 */
router.post('/test/:service', auth, async (req, res) => {
  try {
    const { service } = req.params;
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    let testResult = { success: false, message: 'Service not implemented' };
    
    switch (service) {
      case 'etherscan':
        testResult = await testEtherscanKey(apiKey);
        break;
      case 'bscscan':
        testResult = await testBSCScanKey(apiKey);
        break;
      case 'polygonscan':
        testResult = await testPolygonscanKey(apiKey);
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
      return { success: true, message: 'Etherscan API key is valid ✓' };
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
      return { success: true, message: 'BSCScan API key is valid ✓' };
    } else {
      return { success: false, message: data.result || 'Invalid API key' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testPolygonscanKey(apiKey) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://api.polygonscan.com/api?module=stats&action=maticsupply&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === '1') {
      return { success: true, message: 'Polygonscan API key is valid ✓' };
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
        message: `GitHub API key is valid ✓ (${data.login})` 
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
      return { success: true, message: 'TrustBlock API key is valid ✓' };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid TrustBlock API key' };
    } else {
      return { success: true, message: 'TrustBlock API key appears valid (cannot fully verify)' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = router;
