/**
 * Simple script to test Gemini via telegram util.generateGeminiText
 * Usage: node backend/scripts/gemini-live-test.js
 */
(async () => {
  try {
    const { telegramBot } = require('../src/utils/telegram');

    // Don't touch Settings / MongoDB here so local tests don't block when DB is down.
    console.log('Env GEMINI key present:', !!process.env.GEMINI_API_KEY);

    const prompt = `You are CFG Ninja's assistant. In one short paragraph, explain what I should include when requesting a smart contract audit.`;
    console.log('Sending prompt to Gemini...');
    const result = await telegramBot.generateGeminiText(prompt, { temperature: 0.2, maxTokens: 300 });
    console.log('Gemini result:', result || '<no response>');
    process.exit(0);
  } catch (err) {
    console.error('Error running gemini-live-test:', err?.message || err);
    process.exit(2);
  }
})();
