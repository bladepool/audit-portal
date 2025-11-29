(async function(){
  // E2E test: persist allow_ai_replies, set gemini key, reload telegram settings,
  // then invoke telegramBot.handleMessage to verify AI reply path using a stubbed Gemini.
  const mongoose = require('mongoose');
  require('dotenv').config();
  const Settings = require('../src/models/Settings');
  const { telegramBot, reloadTelegramSettings } = require('../src/utils/telegram');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';

  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for E2E test');

    // Persist settings
    await Settings.set('allow_ai_replies', true, 'Enable AI replies (E2E test)');
    await Settings.set('gemini_api_key', 'SIMULATED_KEY', 'Simulated key for local E2E');

    console.log('Settings persisted: allow_ai_replies=true, gemini_api_key=SIMULATED_KEY');

    // Reload telegram settings in memory
    await reloadTelegramSettings();
    console.log('Telegram settings reloaded');

    // Monkeypatch generateGeminiText to avoid real network calls
    telegramBot.generateGeminiText = async (prompt, opts) => {
      console.log('[e2e stub] generateGeminiText called with prompt:', String(prompt).slice(0,200).replace(/\n/g,'\\n'));
      return 'E2E simulated AI reply: Short summary of audit requirements: provide contract, website, description, and socials.';
    };

    // Monkeypatch sendMessage to print output instead of calling network
    telegramBot.sendMessage = async (chatId, text, options = {}) => {
      console.log(`[e2e stub] sendMessage -> to=${chatId} text=${String(text).slice(0,300).replace(/\n/g,'\\n')}`);
      return { ok: true };
    };

    // Simulate a user sending a non-command message to trigger AI reply
    const userMsg = { chat: { id: 555555555 }, from: { id: 555555555, username: 'e2e_user' }, text: 'What are the audit requirements?' };

    console.log('\n--- Running E2E simulated message to trigger AI reply ---');
    await telegramBot.handleMessage(userMsg);
    console.log('--- E2E test complete ---\n');
  } catch (err) {
    console.error('E2E test failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
