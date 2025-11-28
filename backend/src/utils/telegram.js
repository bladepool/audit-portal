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
    this.pendingAudits = {}; // map callback id -> audit data
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

  async getMe() {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    try {
      const res = await axios.get(`${this.baseUrl}/getMe`);
      return res.data.result;
    } catch (err) {
      throw new Error(err?.response?.data?.description || err?.message || 'Failed to get bot info');
    }
  }

  async getWebhookInfo() {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    try {
      const res = await axios.get(`${this.baseUrl}/getWebhookInfo`);
      return res.data.result;
    } catch (err) {
      throw new Error(err?.response?.data?.description || err?.message || 'Failed to get webhook info');
    }
  }

  async createAuditRequest(data) {
    await this.loadSettings();
    if (!this.adminUserId) throw new Error('Telegram admin user ID not configured');
    const id = `audit_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    // keep pending audit info so callback handlers can reference it
    this.pendingAudits[id] = { ...data, id };

    const message = `\n🔒 <b>New Audit Request</b>\n\n📋 <b>Project:</b> ${data.projectName || 'Unknown'}\n• Contract: ${data.contractAddress || 'N/A'}\n• Website: ${data.website || 'N/A'}\n\n📝 <b>Description:</b> ${data.description || 'N/A'}\n\nRequester: ${data.userTelegramId || 'Anonymous'}`;
    await this.sendMessage(this.adminUserId, message, {
      parseMode: 'HTML',
      replyMarkup: {
        inline_keyboard: [[
          { text: '✅ Accept', callback_data: `accept_audit_${id}` },
          { text: '❌ Decline', callback_data: `decline_audit_${id}` },
        ]]
      }
    });
    if (data.userTelegramId) {
      await this.sendMessage(data.userTelegramId, `✅ Your audit request for ${data.projectName || 'a project'} has been submitted.`, { parseMode: 'HTML' });
    }
    return { success: true };
  }

  async enableWebhook(url) {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    const target = url || process.env.TELEGRAM_WEBHOOK_URL;
    if (!target) throw new Error('No webhook URL provided');
    try {
      const res = await axios.post(`${this.baseUrl}/setWebhook`, { url: target, allowed_updates: ['message', 'callback_query'] });
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.description || err?.message || 'Failed to set webhook');
    }
  }

  async disableWebhook() {
    await this.loadSettings();
    if (!this.botToken) throw new Error('Telegram bot token not configured');
    try {
      const res = await axios.post(`${this.baseUrl}/deleteWebhook`);
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.description || err?.message || 'Failed to delete webhook');
    }
  }

  // Attempt to create a group programmatically. Many bot accounts cannot create groups;
  // this will usually fail — callers should handle null return and fall back to manual instructions.
  async createAuditGroup(projectName, userTelegramId) {
    await this.loadSettings();
    try {
      // Telegram Bot API does not provide a simple createGroup method for bots in many setups.
      // Try an endpoint that may exist on some integrations; otherwise return null.
      const res = await axios.post(`${this.baseUrl}/createGroup`, { title: `Audit: ${projectName}`, user_ids: [this.adminUserId, userTelegramId] });
      if (res?.data?.result) {
        return { chatId: res.data.result.id, inviteLink: res.data.result.invite_link };
      }
    } catch (err) {
      if (TELEGRAM_DEBUG) console.info('createAuditGroup not supported or failed:', err?.message || err);
    }
    return null;
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
      if (!this.userStates[chatId]) this.userStates[chatId] = { step: 1, info: {}, started: Date.now() };
      return;
    }

    // /contact: finalize the collected info and notify admin
    if (command === '/contact') {
      const state = this.userStates[chatId];
      if (!state || !state.info || !state.info.projectName) {
        await this.sendMessage(chatId, 'I don\'t have enough info. Please provide project name, contract address, website and socials, or use /request to start.', { parseMode: 'HTML' });
        return;
      }

      // prepare admin notification and optional group creation
      const info = state.info;
      // Let AI polish the intro message (non-fatal)
      let introText = `<b>Audit Request Details</b>\nProject: ${info.projectName || ''}`;
      try {
        const aiPrompt = `You are a helpful assistant for CFG Ninja audits. Write a short, polite Telegram group introduction message for an auditor and the project owner. Include these details: Project: ${info.projectName || ''} Contract: ${info.contract || ''} Website: ${info.website || ''} Socials: ${info.socials || ''}`;
        const ai = await this.generateGeminiText(aiPrompt, { temperature: 0.2, maxTokens: 200 });
        if (ai && ai.length > 10) {
          introText = ai.trim() + "\n\nI'm CFG Ninja AI Bot, my name is Ninjalyze, an AI agent for CFG Ninja Audits.";
        }
      } catch (e) { /* ignore */ }

      // notify admin and try to create group if allowed
      try {
        await this.createAuditRequest({ projectName: info.projectName, contractAddress: info.contract, website: info.website, telegram: info.socials, description: info.description || '', userTelegramId: chatId });
      } catch (err) {
        if (TELEGRAM_DEBUG) console.error('Failed to create audit request for admin:', err?.message || err);
      }

      const allowCreateFlag = (await Settings.get('allow_bot_create_group')) || (process.env.ALLOW_BOT_CREATE_GROUP === 'true');
      if (allowCreateFlag) {
        try {
          const created = await this.createAuditGroup(info.projectName || 'New Project', chatId);
          if (created && created.chatId) {
            await this.sendMessage(chatId, `✅ I've created a discussion group for your audit: ${created.inviteLink || ''}`);
            try { await this.sendMessage(created.chatId, introText, { parseMode: 'HTML' }); } catch (e) { if (TELEGRAM_DEBUG) console.error('failed send intro to group', e?.message || e); }
            delete this.userStates[chatId];
            return;
          }
        } catch (e) {
          if (TELEGRAM_DEBUG) console.error('createAuditGroup failed', e?.message || e);
        }
      }

      // fallback: instruct user to create group manually and paste intro
      await this.sendMessage(chatId, ['I couldn\'t create the group automatically. Please create a new Telegram group, add both the auditor account and this bot, then paste the following introduction into the group:', '', introText].join('\n'));
      delete this.userStates[chatId];
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
    // Acknowledge the callback to remove the loading spinner in Telegram clients
    try {
      await axios.post(`${this.baseUrl}/answerCallbackQuery`, { callback_query_id: query.id });
    } catch (e) { /* ignore */ }

    const data = query.data || '';
    const adminChatId = query.from?.id || (query.message && query.message.chat && query.message.chat.id);

    // Accept audit
    if (data.startsWith('accept_audit_')) {
      const id = data.replace('accept_audit_', '');
      const audit = this.pendingAudits[id];
      if (!audit) {
        if (adminChatId) await this.sendMessage(adminChatId, '⚠️ Audit not found or already handled.');
        return;
      }

      // Notify admin
      if (adminChatId) await this.sendMessage(adminChatId, `✅ Accepted audit request for <b>${audit.projectName || 'project'}</b>.`, { parseMode: 'HTML' });

      // Try to create group and post intro
      let created = null;
      try {
        created = await this.createAuditGroup(audit.projectName || 'New Project', audit.userTelegramId);
      } catch (e) {
        if (TELEGRAM_DEBUG) console.error('createAuditGroup on accept failed', e?.message || e);
      }

      // Notify requester
      try {
        if (created && created.chatId) {
          await this.sendMessage(audit.userTelegramId, `✅ Your audit for <b>${audit.projectName || 'project'}</b> was accepted. We've created a discussion group: ${created.inviteLink || ''}`, { parseMode: 'HTML' });
        } else {
          await this.sendMessage(audit.userTelegramId, `✅ Your audit for <b>${audit.projectName || 'project'}</b> was accepted by the admin. We'll reach out via Telegram to coordinate next steps.`, { parseMode: 'HTML' });
        }
      } catch (e) {
        if (TELEGRAM_DEBUG) console.error('failed notifying requester on accept', e?.message || e);
      }

      // mark handled
      delete this.pendingAudits[id];
      return;
    }

    // Decline audit
    if (data.startsWith('decline_audit_')) {
      const id = data.replace('decline_audit_', '');
      const audit = this.pendingAudits[id];
      if (!audit) {
        if (adminChatId) await this.sendMessage(adminChatId, '⚠️ Audit not found or already handled.');
        return;
      }

      if (adminChatId) await this.sendMessage(adminChatId, `❌ Declined audit request for <b>${audit.projectName || 'project'}</b>.`, { parseMode: 'HTML' });
      try {
        await this.sendMessage(audit.userTelegramId, `❌ Your audit request for <b>${audit.projectName || 'project'}</b> was declined by the admin. You can resubmit with more details or contact support.`, { parseMode: 'HTML' });
      } catch (e) {
        if (TELEGRAM_DEBUG) console.error('failed notifying requester on decline', e?.message || e);
      }
      delete this.pendingAudits[id];
      return;
    }
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
