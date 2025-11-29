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

// GET /api/debug/ai-status
// Returns quick status about AI key presence, allow_ai_replies setting, and recent Gemini logs
router.get('/ai-status', async (req, res) => {
  try {
    const adminTokenEnv = process.env.ADMIN_TOKEN || null;
    let adminTokenSetting = null;
    try { adminTokenSetting = await Settings.get('admin_token'); } catch (e) { /* ignore */ }
    const expected = adminTokenEnv || adminTokenSetting || null;

    const provided = req.headers['x-admin-token'] || req.query.token || '';
    if (expected && provided !== expected) {
      return res.status(403).json({ success: false, error: 'Forbidden: invalid admin token' });
    }

    const hasEnvKey = !!process.env.GEMINI_API_KEY;
    let settingsKeyPresent = false;
    try {
      const sk = await Settings.get('gemini_api_key');
      settingsKeyPresent = !!sk;
    } catch (e) {
      // ignore DB read errors
    }

    let allowAiReplies = false;
    try {
      const s = await Settings.get('allow_ai_replies');
      if (typeof s === 'string') allowAiReplies = s === 'true';
      else if (typeof s === 'boolean') allowAiReplies = s;
      else allowAiReplies = process.env.ALLOW_AI_REPLIES === 'true';
    } catch (e) {
      allowAiReplies = process.env.ALLOW_AI_REPLIES === 'true';
    }

    const logPath = process.env.TELEGRAM_DEBUG_LOG_PATH || path.join(__dirname, '..', '..', 'logs', 'telegram-debug.log');
    let tail = [];
    try {
      if (fs.existsSync(logPath)) {
        const data = await fs.promises.readFile(logPath, 'utf8');
        tail = data.split(/\r?\n/).filter(Boolean).slice(-200);
      }
    } catch (e) { /* ignore */ }

    const botInfo = {
      username: telegramBot.botUsername || null,
      connected: !!telegramBot.botToken,
    };

    res.json({
      success: true,
      ai: {
        hasEnvKey,
        settingsKeyPresent,
        allowAiReplies,
      },
      bot: botInfo,
      logs: tail,
    });
  } catch (err) {
    console.error('Error /api/debug/ai-status:', err?.message || err);
    res.status(500).json({ success: false, error: 'Failed to compute AI status' });
  }
});

