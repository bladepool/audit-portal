const axios = require('axios');

/**
 * Telegram Bot Integration for Audit Requests
 * Uses Telegram Bot API to create audit request chats
 * Docs: https://core.telegram.org/bots/api
 */

class TelegramBot {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.adminUserId = process.env.TELEGRAM_ADMIN_USER_ID; // Your Telegram user ID
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not configured');
    }
    if (!this.adminUserId) {
      console.warn('TELEGRAM_ADMIN_USER_ID not configured');
    }
  }

  /**
   * Send a message to a user or chat
   */
  async sendMessage(chatId, text, options = {}) {
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
  createStartLink(payload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot_username';
    return `https://t.me/${botUsername}?start=${encodedPayload}`;
  }

  /**
   * Create an audit request message
   */
  async createAuditRequest(requestData) {
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

    // Handle /start command with deep link payload
    if (text && text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          return this.handleAuditRequestStart(chatId, payload);
        } catch (error) {
          console.error('Invalid start payload:', error);
        }
      }

      // Regular start command
      await this.sendMessage(chatId, `
🔒 <b>Welcome to CFG Ninja Audit Bot!</b>

I can help you request smart contract audits.

<b>Commands:</b>
• /request - Request a new audit
• /status - Check audit status
• /help - Get help

Start by sending /request to begin an audit request.
      `.trim(), { parseMode: 'HTML' });
    }

    // Handle /request command
    if (text === '/request') {
      await this.sendMessage(chatId, `
📋 <b>Audit Request Form</b>

Please visit our portal to submit an audit request:
${process.env.NEXT_PUBLIC_BASE_URL}/request-audit

Or click the button below:
      `.trim(), {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [[
            { text: '🌐 Request Audit', url: `${process.env.NEXT_PUBLIC_BASE_URL}/request-audit` },
          ]],
        },
      });
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
};
