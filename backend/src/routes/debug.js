const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');
const { telegramBot } = require('../utils/telegram');

// GET /api/debug/telegram-logs?lines=200
router.get('/telegram-logs', async (req, res) => {
  try {
    const lines = Math.min(1000, Number(req.query.lines) || 200);

    const adminTokenEnv = process.env.ADMIN_TOKEN || null;
    const adminTokenSetting = await Settings.get('admin_token');
    const expected = adminTokenEnv || adminTokenSetting || null;

    // Allow if running locally (no origin) or token matches header
    const provided = req.headers['x-admin-token'] || req.query.token || '';
    if (expected && provided !== expected) {
      return res.status(403).json({ success: false, error: 'Forbidden: invalid admin token' });
    }

    const logPath = process.env.TELEGRAM_DEBUG_LOG_PATH || path.join(__dirname, '..', '..', 'logs', 'telegram-debug.log');

    // If file doesn't exist, return empty
    if (!fs.existsSync(logPath)) {
      return res.json({ success: true, lines: [] });
    }

    const data = await fs.promises.readFile(logPath, 'utf8');
    const allLines = data.split(/\r?\n/).filter(Boolean);
    const tail = allLines.slice(-lines);

    res.json({ success: true, lines: tail });
  } catch (err) {
    console.error('Error reading telegram debug logs:', err?.message || err);
    res.status(500).json({ success: false, error: 'Failed to read logs' });
  }
});

// POST /api/debug/gemini-test
// Body: { prompt?: string, lines?: number }
router.post('/gemini-test', async (req, res) => {
  try {
    const { prompt, lines } = req.body || {};

    const adminTokenEnv = process.env.ADMIN_TOKEN || null;
    const adminTokenSetting = await Settings.get('admin_token');
    const expected = adminTokenEnv || adminTokenSetting || null;

    const provided = req.headers['x-admin-token'] || req.query.token || '';
    if (expected && provided !== expected) {
      return res.status(403).json({ success: false, error: 'Forbidden: invalid admin token' });
    }

    const testPrompt = typeof prompt === 'string' && prompt.trim().length > 0
      ? prompt.trim()
      : "You are CFG Ninja's assistant. In one short paragraph, explain what someone should include when requesting a smart contract audit.";

    // Ensure telegram settings are reloaded so it picks up Gemini key from Settings if present
    try { await telegramBot.reloadSettings(); } catch (e) { /* ignore */ }

    const ai = await telegramBot.generateGeminiText(testPrompt, { temperature: 0.2, maxTokens: 300 });

    const logPath = process.env.TELEGRAM_DEBUG_LOG_PATH || require('path').join(__dirname, '..', '..', 'logs', 'telegram-debug.log');
    let tail = [];
    try {
      if (require('fs').existsSync(logPath)) {
        const data = await require('fs').promises.readFile(logPath, 'utf8');
        tail = data.split(/\r?\n/).filter(Boolean).slice(-(Number(lines) || 200));
      }
    } catch (e) {
      // ignore
    }

    res.json({ success: true, ai: ai || null, logs: tail });
  } catch (err) {
    console.error('Error running gemini-test:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to run gemini test' });
  }
});

module.exports = router;
