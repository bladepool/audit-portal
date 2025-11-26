const express = require('express');
const router = express.Router();
const { telegramBot } = require('../utils/telegram');

// GET /api/telegram/status
router.get('/status', async (req, res) => {
  try {
    await telegramBot.loadSettings();
    const info = await telegramBot.getMe();
    res.json({ success: true, bot: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
