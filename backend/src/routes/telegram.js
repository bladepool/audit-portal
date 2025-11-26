const express = require('express');
const router = express.Router();
const { telegramBot } = require('../utils/telegram');

// GET /api/telegram/status
router.get('/status', async (req, res) => {
  try {
    await telegramBot.loadSettings();
    const info = await telegramBot.getMe();
    let webhook = null;
    try {
      webhook = await telegramBot.getWebhookInfo();
    } catch (e) {
      // ignore
    }
    res.json({ success: true, bot: info, webhook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/telegram/start - enable webhook (body: { url })
router.post('/start', async (req, res) => {
  try {
    const url = req.body?.url || process.env.TELEGRAM_WEBHOOK_URL;
    if (!url) return res.status(400).json({ success: false, error: 'No webhook URL provided' });
    const result = await telegramBot.enableWebhook(url);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to start telegram webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/telegram/stop - disable webhook
router.post('/stop', async (req, res) => {
  try {
    const result = await telegramBot.disableWebhook();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to stop telegram webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
