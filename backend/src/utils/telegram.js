// ...existing code...
const axios = require('axios');
const Settings = require('../models/Settings');

// Enable debug replies when TELEGRAM_DEBUG=true
const TELEGRAM_DEBUG = process.env.TELEGRAM_DEBUG === 'true';

/**
 * Telegram Bot Integration for Audit Requests
 * Uses Telegram Bot API to create audit request chats
 * Docs: https://core.telegram.org/bots/api
 * 
 * Settings can be configured via:
 * 1. Admin Settings UI (preferred - stored in database)
 * 2. Environment variables (.env file - fallback)
 */

class TelegramBot {
  constructor() {
    // Settings will be loaded from database or .env
    this.botToken = null;
    this.botUsername = null;
    this.adminUserId = null;
    this.baseUrl = null;
    this.settingsLoaded = false;
  }

  /**
   * Load Telegram settings from database (preferred) or environment variables (fallback)
   */
  async loadSettings() {
    if (this.settingsLoaded) {
      return; // Already loaded
    }

    try {
      // Try to load from database first
      this.botToken = await Settings.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN;
      this.botUsername = await Settings.get('telegram_bot_username') || process.env.TELEGRAM_BOT_USERNAME || 'CFGNINJA_Bot';
      this.adminUserId = await Settings.get('telegram_admin_user_id') || process.env.TELEGRAM_ADMIN_USER_ID;
      
      if (this.botToken) {
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
      }
      
      this.settingsLoaded = true;
      
      if (!this.botToken) {
        console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured - audit requests disabled');
      }
      if (!this.adminUserId) {
        console.warn('⚠️ TELEGRAM_ADMIN_USER_ID not configured - cannot send admin notifications');
      }
      
      console.log('Telegram Settings loaded:', {
        botToken: this.botToken ? '✓ Configured' : '✗ Not configured',
        botUsername: this.botUsername || 'Not set',
        adminUserId: this.adminUserId ? '✓ Configured' : '✗ Not configured'
      });
    } catch (error) {
      console.error('Error loading Telegram settings from database, using .env fallback:', error.message);
      // Fallback to environment variables
      this.botToken = process.env.TELEGRAM_BOT_TOKEN;
      this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'CFGNINJA_Bot';
      this.adminUserId = process.env.TELEGRAM_ADMIN_USER_ID;
      
      if (this.botToken) {
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
      }
      
      this.settingsLoaded = true;
    }
  }

  /**
   * Send a message to a user or chat
   */
  async sendMessage(chatId, text, options = {}) {
    await this.loadSettings();
    
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disablePreview || false,
        reply_markup: options.replyMarkup,
        ...options,
      });

      return response.data;
    } catch (error) {
      console.error('Telegram sendMessage error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a deep link for starting a chat with the bot
   * User clicks this link -> Opens Telegram -> Starts chat with bot
   */
  async createStartLink(payload) {
    await this.loadSettings();
    
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `https://t.me/${this.botUsername}?start=${encodedPayload}`;
  }

  /**
   * Create an audit request message
   */
  async createAuditRequest(requestData) {
    await this.loadSettings();
    
    if (!this.adminUserId) {
      throw new Error('Telegram admin user ID not configured');
    }
    
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
    } = requestData;

    // Format message
    const message = `
🔒 <b>New Audit Request</b>

📋 <b>Project Details:</b>
• Name: ${projectName}
• Symbol: ${symbol}
• Blockchain: ${blockchain}
${contractAddress ? `• Contract: <code>${contractAddress}</code>` : ''}

🌐 <b>Links:</b>
${website ? `• Website: ${website}` : ''}
${telegram ? `• Telegram: ${telegram}` : ''}
${twitter ? `• Twitter: ${twitter}` : ''}
${email ? `• Email: ${email}` : ''}

📝 <b>Description:</b>
${description || 'No description provided'}

👤 <b>Requester:</b> ${userTelegramId ? `@user${userTelegramId}` : 'Anonymous'}

⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    try {
      // Send to admin
      await this.sendMessage(this.adminUserId, message, {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [[
            { text: '✅ Accept', callback_data: `accept_audit_${Date.now()}` },
            { text: '❌ Decline', callback_data: `decline_audit_${Date.now()}` },
          ]],
        },
      });

      // Send confirmation to user if they have Telegram ID
      if (userTelegramId) {
        const confirmMessage = `
✅ <b>Audit Request Submitted</b>

Thank you for requesting an audit for <b>${projectName}</b>!

We've received your request and will review it shortly. You'll be contacted soon via Telegram.

<i>Request submitted at ${new Date().toLocaleString()}</i>
        `.trim();

        await this.sendMessage(userTelegramId, confirmMessage, { parseMode: 'HTML' });
      }

      return { success: true, message: 'Audit request sent successfully' };
    } catch (error) {
      console.error('Failed to send audit request:', error);
      throw new Error('Failed to send Telegram message');
    }
  }

  /**
   * Create a group chat with the user and admin
   * Note: This requires the bot to have permission to create groups
   */
  async createAuditGroup(projectName, userTelegramId) {
    try {
      // Create group
      const groupResponse = await axios.post(`${this.baseUrl}/createGroup`, {
        title: `Audit: ${projectName}`,
        user_ids: [this.adminUserId, userTelegramId],
      });

      const chatId = groupResponse.data.result.id;

      // Send welcome message
      const welcomeMessage = `
🔒 <b>Audit Discussion Group</b>

This group has been created for the audit of <b>${projectName}</b>.

📋 <b>Next Steps:</b>
1. Share contract details
2. Discuss scope and timeline
3. Review audit report

Feel free to ask any questions!
      `.trim();

      await this.sendMessage(chatId, welcomeMessage, { parseMode: 'HTML' });

      return {
        success: true,
        chatId,
        inviteLink: groupResponse.data.result.invite_link,
      };
    } catch (error) {
      console.error('Failed to create group:', error.response?.data || error.message);
      throw new Error('Failed to create Telegram group');
    }
  }

  /**
   * Get bot information
   */
  async getMe() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      console.error('Failed to get bot info:', error);
      throw error;
    }
  }

  /**
   * Set webhook for receiving updates (for production)
   */
  async setWebhook(url) {
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url,
        allowed_updates: ['message', 'callback_query'],
      });
      return response.data;
    } catch (error) {
      console.error('Failed to set webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook info from Telegram
   */
  async getWebhookInfo() {
    await this.loadSettings();
    try {
      const response = await axios.get(`${this.baseUrl}/getWebhookInfo`);
      return response.data.result;
    } catch (error) {
      console.error('Failed to get webhook info:', error?.response?.data || error.message || error);
      throw error;
    }
  }

  /**
   * Enable webhook (set webhook URL)
   */
  async enableWebhook(url) {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    const target = url || process.env.TELEGRAM_WEBHOOK_URL;
    if (!target) throw new Error('No webhook URL provided');
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url: target,
        allowed_updates: ['message', 'callback_query'],
      });
      return response.data;
    } catch (error) {
      console.error('Failed to enable webhook:', error?.response?.data || error.message || error);
      throw error;
    }
  }

  /**
   * Disable webhook (delete webhook)
   */
  async disableWebhook() {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    try {
      const response = await axios.post(`${this.baseUrl}/deleteWebhook`);
      return response.data;
    } catch (error) {
      console.error('Failed to disable webhook:', error?.response?.data || error.message || error);
      throw error;
    }
  }

  /**
   * Handle incoming webhook updates
   */
  handleWebhook(update) {
    if (update.message) {
      return this.handleMessage(update.message);
    }
    if (update.callback_query) {
      return this.handleCallbackQuery(update.callback_query);
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;

    // Normalize command (handle commands with @botusername and payloads)
    const command = text ? text.split(' ')[0].split('@')[0] : '';

    // Debug logging for incoming messages and parsed command
    try {
      console.log('[Telegram] Incoming message:', {
        from: message.from?.username || message.from?.id,
        chatId,
        text,
        parsedCommand: command,
      });
    } catch (e) {
      // swallow logging errors
    }

    // Handle /start command with deep link payload
    if (command === '/start') {
      const parts = text ? text.split(' ') : [];
      let payload = {};
      if (parts.length > 1) {
        try {
          payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        } catch (error) {
          console.error('Invalid start payload:', error);
        }
      }

      // Custom welcome and info collection
      await this.sendMessage(chatId, `
Hello! Thank you for reaching out. I appreciate your interest. I will be with you shortly to discuss your request. Before we proceed, please provide the following information:

1. Contract
2. Website
3. Socials
4. Logo

Once I have these details, I will confirm the next steps. Please note that our delivery timeframe for the service is 12 to 24 hours. Thank you for your patience, and I look forward to assisting you further.

Every audit includes the following:
1. Pinksale Audit Badge.
2. Github PDF.
3. https://audit.cfg.ninja dedicated page.
4. Trustblock Audit page.
5. SafeAnalyzer Audit Badge.

You can reply with each item one by one, or send them all together. When ready, type /contact to create a group with the auditor.
      `.trim(), { parseMode: 'HTML' });

      // Start info collection state
      if (!this.userStates) this.userStates = {};
      this.userStates[chatId] = { step: 1, info: {}, started: Date.now() };
      return;
    }

    // Handle /request command
    if (command === '/request') {
      await this.sendMessage(chatId, `
To request an audit, please provide the following information (one at a time or all together):
1. Contract
2. Website
3. Socials
4. Logo

When ready, type /contact to create a group with the auditor.
      `.trim(), { parseMode: 'HTML' });
      if (!this.userStates) this.userStates = {};
      this.userStates[chatId] = { step: 1, info: {}, started: Date.now() };
      return;
    }

    // Handle /help command
    if (command === '/help') {
      await this.sendMessage(chatId, `
ℹ️ <b>Help - CFG Ninja Audit Bot</b>

This bot helps you request smart contract audits and get updates.

<b>Commands:</b>
• /request - Request a new audit
• /status - Check audit status
• /help - Show this help message

For more details or to submit a request, visit our portal:
${process.env.NEXT_PUBLIC_BASE_URL}/request-audit
      `.trim(), { parseMode: 'HTML' });
    }

    // Handle /status command
    if (command === '/status') {
      await this.sendMessage(chatId, `
🔎 <b>Audit Status</b>

To check the status of your audit, please visit your dashboard on our portal:
${process.env.NEXT_PUBLIC_BASE_URL}/dashboard

If you have submitted an audit request, you will be contacted by our team soon.
      `.trim(), { parseMode: 'HTML' });
      return;
    }


    // Handle /contact command to create group and post info
    if (command === '/contact') {
      if (!this.userStates || !this.userStates[chatId] || !this.userStates[chatId].info) {
        await this.sendMessage(chatId, 'Please provide your contract, website, socials, and logo first.');
        return;
      }
      const info = this.userStates[chatId].info;
      // Format info summary
      let summary = '<b>Audit Request Details</b>\n';
      if (info.contract) summary += `\n<b>Contract:</b> ${info.contract}`;
      if (info.website) summary += `\n<b>Website:</b> ${info.website}`;
      if (info.socials) summary += `\n<b>Socials:</b> ${info.socials}`;
      if (info.logo) summary += `\n<b>Logo:</b> ${info.logo}`;
      summary += '\n\nWelcome! The auditor will be with you shortly.';

      await this.sendMessage(chatId, [
        'Telegram does not allow bots to create groups directly.',
        'To start a group chat with the auditor:',
        '1. Create a new Telegram group.',
        '2. Add both @bladepool and this bot (@' + this.botUsername + ') as members.',
        '3. Copy and paste the following message as your introduction:',
        '',
        summary.replace(/\\n/g, '\n'),
        '',
        'Once the group is created, the auditor will join you shortly!'
      ].join('\n'));
      // Optionally clear state
      delete this.userStates[chatId];
      return;
    }

    // Info collection: if user is in info collection state and message is not a command
    if (this.userStates && this.userStates[chatId] && text && !text.startsWith('/')) {
      const state = this.userStates[chatId];
      // Try to parse info from message
      // Heuristic: look for keywords or ask in order
      const lower = text.toLowerCase();
      if (!state.info.contract && (lower.includes('0x') || lower.includes('contract'))) {
        state.info.contract = text;
        await this.sendMessage(chatId, '✅ Contract received. Please provide Website.');
        return;
      }
      if (!state.info.website && (lower.includes('http') || lower.includes('www') || lower.includes('.'))) {
        state.info.website = text;
        await this.sendMessage(chatId, '✅ Website received. Please provide Socials.');
        return;
      }
      if (!state.info.socials && (lower.includes('t.me') || lower.includes('twitter') || lower.includes('discord') || lower.includes('@'))) {
        state.info.socials = text;
        await this.sendMessage(chatId, '✅ Socials received. Please provide Logo (URL or file).');
        return;
      }
      if (!state.info.logo && (lower.includes('http') && (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.svg')))) {
        state.info.logo = text;
        await this.sendMessage(chatId, '✅ Logo received. When ready, type /contact to create a group with the auditor.');
        return;
      }
      // Fallback: store as "other" or ask for missing
      if (!state.info.contract) {
        state.info.contract = text;
        await this.sendMessage(chatId, '✅ Contract received. Please provide Website.');
        return;
      } else if (!state.info.website) {
        state.info.website = text;
        await this.sendMessage(chatId, '✅ Website received. Please provide Socials.');
        return;
      } else if (!state.info.socials) {
        state.info.socials = text;
        await this.sendMessage(chatId, '✅ Socials received. Please provide Logo (URL or file).');
        return;
      } else if (!state.info.logo) {
        state.info.logo = text;
        await this.sendMessage(chatId, '✅ Logo received. When ready, type /contact to create a group with the auditor.');
        return;
      }
      // If all info collected, remind user to type /contact
      await this.sendMessage(chatId, 'All info received! Type /contact to create a group with the auditor.');
      return;
    }

    // Unknown command handling (only reply for messages that look like commands)
    if (text && text.startsWith('/')) {
      console.log('[Telegram] Unknown command received:', { command, text, chatId });
      if (TELEGRAM_DEBUG) {
        try {
          await this.sendMessage(chatId, `I didn't recognize the command <code>${command}</code>. Try /help.`, { parseMode: 'HTML' });
        } catch (e) {
          console.error('Failed to send unknown-command reply:', e?.message || e);
        }
      }
      return;
    }
  }

  /**
   * Handle audit request initiated from bot
   */
  async handleAuditRequestStart(chatId, payload) {
    await this.sendMessage(chatId, `
📋 <b>Audit Request</b>

Project: ${payload.projectName || 'New Project'}

Let's get started! Please provide:
1. Contract address
2. Blockchain network
3. Project website
4. Brief description

You can also visit our portal for a complete form:
${process.env.NEXT_PUBLIC_BASE_URL}/request-audit
    `.trim(), { parseMode: 'HTML' });
  }

  /**
   * Handle callback queries (button clicks)
   */
  async handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('accept_audit_')) {
      await this.sendMessage(chatId, '✅ Audit request accepted! Creating discussion group...');
      // Handle accept logic
    } else if (data.startsWith('decline_audit_')) {
      await this.sendMessage(chatId, '❌ Audit request declined.');
      // Handle decline logic
    }

    // Answer callback query to remove loading state
    await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
      callback_query_id: query.id,
    });
  }
}

// Export singleton instance
const telegramBot = new TelegramBot();

module.exports = {
  TelegramBot,
  telegramBot,
  createAuditRequest: (data) => telegramBot.createAuditRequest(data),
  createStartLink: (payload) => telegramBot.createStartLink(payload),
  reloadTelegramSettings: () => telegramBot.reloadSettings(),
};
