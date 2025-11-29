const express = require('express');
const router = express.Router();
const { createAuditRequest, createStartLink } = require('../utils/telegram');

/**
 * POST /api/audit-request
 * Submit a new audit request via Telegram
 */
router.post('/', async (req, res) => {
  try {
    const {
      projectName,
      symbol,
      contractAddress,
      blockchain,
      website,
      telegram,
      twitter,
      email,
      description,
      userTelegramId,
      userTelegramUsername,
    } = req.body;

    // Validate required fields
    if (!projectName || !blockchain) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['projectName', 'blockchain'],
      });
    }

    console.log('Processing audit request:', { projectName, blockchain });

    // Send request via Telegram
    const result = await createAuditRequest({
      projectName,
      symbol,
      contractAddress,
      blockchain,
      website,
      telegram,
      twitter,
      email,
      description,
      userTelegramId,
    });

    res.json({
      success: true,
      message: 'Audit request submitted successfully',
      data: {
        projectName,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Audit request error:', error);
    res.status(500).json({
      error: 'Failed to submit audit request',
      details: error.message,
    });
  }
});

/**
 * GET /api/audit-request/telegram-link
 * Generate a Telegram deep link for audit request
 */
router.get('/telegram-link', (req, res) => {
  try {
    const { projectName, symbol, blockchain } = req.query;

    const payload = {
      action: 'audit_request',
      projectName,
      symbol,
      blockchain,
      timestamp: Date.now(),
    };

    const telegramLink = createStartLink(payload);

    res.json({
      success: true,
      telegramLink,
      payload,
    });
  } catch (error) {
    console.error('Telegram link generation error:', error);
    res.status(500).json({
      error: 'Failed to generate Telegram link',
      details: error.message,
    });
  }
});

/**
 * POST /api/audit-request/webhook
 * Webhook endpoint for Telegram bot updates
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    // Validate incoming webhook secret token if configured
    const enableSecure = process.env.ENABLE_SECURE_WEBHOOK_TOKEN !== 'false';
    if (enableSecure) {
      const incoming = req.headers['x-telegram-bot-api-secret-token'] || req.headers['X-Telegram-Bot-Api-Secret-Token'];
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET || null;
      if (secret && (!incoming || incoming !== secret)) {
        console.warn('Rejected webhook: invalid secret token');
        return res.status(403).json({ error: 'Forbidden: invalid webhook token' });
      }
    }

    console.log('Received Telegram webhook:', JSON.stringify(update, null, 2));

    const { telegramBot } = require('../utils/telegram');
    await telegramBot.handleWebhook(update);

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/audit-request/bot-info
 * Get Telegram bot information
 */
router.get('/bot-info', async (req, res) => {
  try {
    const { telegramBot } = require('../utils/telegram');
    const botInfo = await telegramBot.getMe();
    
    res.json({
      success: true,
      bot: botInfo,
    });
  } catch (error) {
    console.error('Bot info error:', error);
    res.status(500).json({
      error: 'Failed to get bot info',
      details: error.message,
    });
  }
});

module.exports = router;
