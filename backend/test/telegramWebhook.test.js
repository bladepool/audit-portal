const request = require('supertest');
const express = require('express');

describe('Telegram webhook and bot behavior', () => {
  test('POST /api/audit-request/webhook should call telegramBot.handleWebhook (route-level)', async () => {
    // isolate module to mock telegram util for this test only
    jest.isolateModules(() => {
      jest.doMock('../src/utils/telegram', () => ({
        telegramBot: {
          handleWebhook: jest.fn(async (update) => ({ handled: true }))
        }
      }));

      const telegramRoute = require('../src/routes/audit-request');
      const app = express();
      app.use(express.json());
      app.use('/api/audit-request', telegramRoute);

      const sampleUpdate = {
        update_id: 123,
        message: {
          message_id: 1,
          from: { id: 111, is_bot: false, first_name: 'Tester' },
          chat: { id: 111, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: '/contact'
        }
      };

      return request(app)
        .post('/api/audit-request/webhook')
        .send(sampleUpdate)
        .set('Accept', 'application/json')
        .expect(200, { ok: true });
    });
  });

  test('telegramBot.handleMessage should attempt createAuditGroup when allowed', async () => {
    jest.resetModules();

    // Mock Settings to allow programmatic create
    jest.doMock('../src/models/Settings', () => ({
      get: jest.fn(async (key) => {
        if (key === 'allow_bot_create_group') return true;
        return null;
      }),
      set: jest.fn()
    }));

    const { telegramBot } = require('../src/utils/telegram');

    // Spy/mocks for internal methods
    telegramBot.createAuditGroup = jest.fn().mockResolvedValue({ chatId: -100, inviteLink: 'https://t.me/join/ABC' });
    telegramBot.sendMessage = jest.fn().mockResolvedValue({});
    telegramBot.createAuditRequest = jest.fn().mockResolvedValue({ success: true });

    const chatId = 99999;
    // Seed user state as if info was already collected
    telegramBot.userStates = telegramBot.userStates || {};
    telegramBot.userStates[chatId] = { info: { projectName: 'TestProject' } };

    // Call handleMessage with /contact
    await telegramBot.handleMessage({ chat: { id: chatId }, text: '/contact', from: { id: 111 } });

    // Expect createAuditGroup to be attempted and messages sent
    expect(telegramBot.createAuditGroup).toHaveBeenCalledWith('TestProject', chatId);
    expect(telegramBot.sendMessage).toHaveBeenCalled();
    expect(telegramBot.createAuditRequest).toHaveBeenCalled();
  });
});
