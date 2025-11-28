(async function(){
  // Simulated test for telegram flows without contacting external APIs
  const { telegramBot } = require('../src/utils/telegram');
  const Settings = require('../src/models/Settings');

  // Monkeypatch network methods to avoid external calls
  telegramBot.sendMessage = async (chatId, text, options = {}) => {
    console.log(`[sendMessage] to=${chatId} parseMode=${options?.parseMode || 'HTML'} text=${String(text).slice(0,200).replace(/\n/g,'\\n')}`);
    return { ok: true };
  };

  telegramBot.createAuditGroup = async (projectName, userTelegramId) => {
    console.log(`[createAuditGroup] simulate create for project=${projectName} user=${userTelegramId}`);
    return { chatId: 999999999, inviteLink: 'https://t.me/joinchat/simulated' };
  };

  telegramBot.generateGeminiText = async (prompt, opts) => {
    console.log('[generateGeminiText] prompt:', String(prompt).slice(0,200).replace(/\n/g,'\\n'));
    return `Hello — welcome to the audit discussion for your project. (Simulated AI intro)`;
  };

  // Prevent loadSettings DB access in tests
  telegramBot.settingsLoaded = true;
  telegramBot.adminUserId = 111111111; // simulated admin chat id

  // Stub Settings.get for allow_ai_replies so we can test AI reply behavior without DB
  const originalSettingsGet = Settings.get;
  Settings.get = async (key) => {
    if (key === 'allow_ai_replies') return true;
    if (key === 'gemini_api_key') return 'SIMULATED_KEY';
    if (key === 'allow_bot_create_group') return true;
    return originalSettingsGet ? await originalSettingsGet.call(Settings, key) : null;
  };

  console.log('\n--- Running simulated createAuditRequest (1) ---');
  await telegramBot.createAuditRequest({ projectName: 'SimProject', contractAddress: '0xDEADBEEF', website: 'https://example.com', description: 'Test project', userTelegramId: 222222222 });

  // Grab the pending audit id
  const pendingIds = Object.keys(telegramBot.pendingAudits || {});
  console.log('pending audit ids after create:', pendingIds);
  const id1 = pendingIds[0];

  console.log('\n--- Simulating Accept callback ---');
  const acceptQuery = { data: `accept_audit_${id1}`, id: 'cb_accept_1', from: { id: telegramBot.adminUserId }, message: { chat: { id: telegramBot.adminUserId } } };
  await telegramBot.handleCallbackQuery(acceptQuery);

  console.log('\n--- Create another audit request (2) ---');
  await telegramBot.createAuditRequest({ projectName: 'SimProject2', contractAddress: '0xBEEF', website: 'https://ex2.com', description: 'Second test', userTelegramId: 333333333 });
  const ids2 = Object.keys(telegramBot.pendingAudits || {});
  console.log('pending audit ids now:', ids2);
  const id2 = ids2.find(x => x !== id1) || ids2[0];

  console.log('\n--- Simulating Decline callback ---');
  const declineQuery = { data: `decline_audit_${id2}`, id: 'cb_decline_1', from: { id: telegramBot.adminUserId }, message: { chat: { id: telegramBot.adminUserId } } };
  await telegramBot.handleCallbackQuery(declineQuery);

  console.log('\n--- Simulating non-command message to test AI reply ---');
  // Simulate a non-command message from user to trigger AI reply branch
  const userMsg = { chat: { id: 444444444 }, from: { id: 444444444, username: 'simuser' }, text: 'Hello, can you give me a quick summary of audit requirements?' };
  await telegramBot.handleMessage(userMsg);

  // Restore Settings.get to avoid side effects
  Settings.get = originalSettingsGet;

  console.log('\n--- Simulation complete ---\n');
})();
