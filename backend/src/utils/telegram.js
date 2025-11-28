const axios = require('axios');
const Settings = require('../models/Settings');

const TELEGRAM_DEBUG = process.env.TELEGRAM_DEBUG === 'true';

class TelegramBot {
  constructor() {
    this.botToken = null;
    this.botUsername = null;
    this.adminUserId = null;
    this.baseUrl = null;
    this.settingsLoaded = false;
    this.userStates = {};
  }

  async loadSettings() {
    if (this.settingsLoaded) return;
    try {
      this.botToken = (await Settings.get('telegram_bot_token')) || process.env.TELEGRAM_BOT_TOKEN;
      this.botUsername = (await Settings.get('telegram_bot_username')) || process.env.TELEGRAM_BOT_USERNAME || 'CFGNINJA_Bot';
      this.adminUserId = (await Settings.get('telegram_admin_user_id')) || process.env.TELEGRAM_ADMIN_USER_ID;
      if (this.botToken) this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    } catch (err) {
      this.botToken = process.env.TELEGRAM_BOT_TOKEN;
      this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'CFGNINJA_Bot';
      this.adminUserId = process.env.TELEGRAM_ADMIN_USER_ID;
      if (this.botToken) this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
    this.settingsLoaded = true;
  }

  async reloadSettings() {
    this.settingsLoaded = false;
    await this.loadSettings();
  }

  async generateGeminiText(prompt, opts = {}) {
    await this.loadSettings();
    try {
      const apiKey = (await Settings.get('gemini_api_key')) || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return prompt;
      const model = opts.model || 'models/text-bison-001';
      const url = `https://gemini.googleapis.com/v1/${model}:generateText?key=${apiKey}`;
      const body = { prompt: { text: prompt }, temperature: opts.temperature || 0.2, maxOutputTokens: opts.maxTokens || 512 };
      const res = await axios.post(url, body, { timeout: 15000 });
      const data = res.data || {};
      const candidate = data?.candidates?.[0]?.content || data?.output_text || data?.output?.[0]?.content || data?.response || null;
      if (candidate && typeof candidate === 'string') return candidate;
      if (typeof data === 'string') return data;
      return prompt;
    } catch (err) {
      if (TELEGRAM_DEBUG) console.error('Gemini API error:', err?.response?.data || err?.message || err);
      return prompt;
    }
  }

  async sendMessage(chatId, text, options = {}) {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    try {
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: !!options.disablePreview,
        reply_markup: options.replyMarkup,
      };
      const res = await axios.post(`${this.baseUrl}/sendMessage`, payload);
      return res.data;
    } catch (err) {
      console.error('Telegram sendMessage error:', err?.response?.data || err?.message || err);
      throw err;
    }
  }

  async createStartLink(payload) {
    await this.loadSettings();
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `https://t.me/${this.botUsername}?start=${encoded}`;
  }

  async createAuditRequest(data) {
    await this.loadSettings();
    if (!this.adminUserId) throw new Error('Telegram admin user ID not configured');
    const message = `\n🔒 <b>New Audit Request</b>\n\n📋 <b>Project:</b> ${data.projectName || 'Unknown'}\n• Contract: ${data.contractAddress || 'N/A'}\n• Website: ${data.website || 'N/A'}\n\n📝 <b>Description:</b> ${data.description || 'N/A'}\n\nRequester: ${data.userTelegramId || 'Anonymous'}`;
    await this.sendMessage(this.adminUserId, message, { parseMode: 'HTML' });
    if (data.userTelegramId) {
      await this.sendMessage(data.userTelegramId, `✅ Your audit request for ${data.projectName || 'a project'} has been submitted.`, { parseMode: 'HTML' });
    }
    return { success: true };
  }

  async handleWebhook(update) {
    if (update.message) return this.handleMessage(update.message);
    if (update.callback_query) return this.handleCallbackQuery(update.callback_query);
  }

  async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text || '';
    const command = text.split(' ')[0].split('@')[0];
    const allowAIReplies = (await Settings.get('allow_ai_replies')) || (process.env.ALLOW_AI_REPLIES === 'true');

    try { console.log('[Telegram] message', { from: message.from?.username || message.from?.id, chatId, text, command }); } catch (e) {}

    if (command === '/start') {
      await this.sendMessage(chatId, `Hello! To request an audit, type /request or /contact.`, { parseMode: 'HTML' });
      return;
    }

    if (command === '/request') {
      await this.sendMessage(chatId, `To request an audit, please provide Contract, Website, Socials, Logo. When ready, type /contact.`, { parseMode: 'HTML' });
      return;
    }

    if (text && !text.startsWith('/') && allowAIReplies) {
      try {
        const prompt = `You are CFG Ninja's assistant. Reply concisely to: "${text}"`;
        const ai = await this.generateGeminiText(prompt, { temperature: 0.2, maxTokens: 200 });
        if (ai && ai.length > 5) {
          const reply = ai.trim() + "\n\nI'm CFG Ninja AI Bot, my name is Ninjalyze, an AI agent for CFG Ninja Audits.";
          await this.sendMessage(chatId, reply, { parseMode: 'HTML' });
          return;
        }
      } catch (e) {
        if (TELEGRAM_DEBUG) console.error('AI reply failed', e?.message || e);
      }
    }

    // default fallback
    await this.sendMessage(chatId, 'Hi - I can help with audits. Type /request to start or /help for commands.');
  }

  async handleAuditRequestStart(chatId, payload) {
    const message = `\n📋 <b>Audit Request</b>\n\nProject: ${payload?.projectName || 'New Project'}\n\nLet's get started! Please provide:\n1. Contract address\n2. Blockchain network\n3. Project website\n4. Brief description\n\nYou can also visit our portal for a complete form:\n${process.env.NEXT_PUBLIC_BASE_URL}/request-audit`;
    await this.sendMessage(chatId, message, { parseMode: 'HTML' });
  }

  async handleCallbackQuery(query) {
    try {
      await axios.post(`${this.baseUrl}/answerCallbackQuery`, { callback_query_id: query.id });
    } catch (e) { /* ignore */ }
  }
}

const telegramBot = new TelegramBot();

module.exports = {
  TelegramBot,
  telegramBot,
  createAuditRequest: (data) => telegramBot.createAuditRequest(data),
  createStartLink: (payload) => telegramBot.createStartLink(payload),
  reloadTelegramSettings: () => telegramBot.reloadSettings(),
};
