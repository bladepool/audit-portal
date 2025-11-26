/**
 * Initialize Telegram Bot Settings in Database
 * Run: node scripts/init-telegram-settings.js
 * 
 * This script creates/updates Telegram bot settings in the MongoDB settings collection.
 * Settings can then be managed via the Admin Settings UI.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../src/models/Settings');

// Telegram Bot Configuration
const TELEGRAM_SETTINGS = {
  telegram_bot_token: {
    value: '5266687259:AAGY-ACehGGzfOd1Wc3Gy1OXSgrjVt-s7RE',
    description: 'Telegram bot token from @BotFather for audit request notifications'
  },
  telegram_bot_username: {
    value: 'CFGNINJA_Bot',
    description: 'Telegram bot username (without @) for deep links'
  },
  telegram_admin_user_id: {
    value: 'bladepool',
    description: 'Telegram username or user ID to receive audit request notifications'
  },
  telegram_webhook_url: {
    value: '', // Leave empty for now, can be set later
    description: 'Webhook URL for Telegram bot updates (optional, for production)'
  }
};

async function initializeTelegramSettings() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    console.log('Initializing Telegram Bot Settings...\n');

    let created = 0;
    let updated = 0;

    for (const [key, data] of Object.entries(TELEGRAM_SETTINGS)) {
      try {
        const existing = await Settings.findOne({ key });
        
        if (existing) {
          // Update existing setting
          existing.value = data.value;
          existing.description = data.description;
          await existing.save();
          console.log(`✓ Updated: ${key}`);
          updated++;
        } else {
          // Create new setting
          await Settings.create({
            key,
            value: data.value,
            description: data.description
          });
          console.log(`✓ Created: ${key}`);
          created++;
        }
      } catch (error) {
        console.error(`✗ Error setting ${key}:`, error.message);
      }
    }

    console.log(`\n✓ Initialization complete!`);
    console.log(`  Created: ${created} settings`);
    console.log(`  Updated: ${updated} settings\n`);

    // Verify settings
    console.log('Telegram Bot Configuration:');
    const botToken = await Settings.get('telegram_bot_token');
    const botUsername = await Settings.get('telegram_bot_username');
    const adminUserId = await Settings.get('telegram_admin_user_id');
    
    console.log(`  ✓ Bot Token: ${botToken ? botToken.substring(0, 20) + '...' : '✗ Not set'}`);
    console.log(`  ✓ Bot Username: @${botUsername || 'Not set'}`);
    console.log(`  ✓ Admin User: @${adminUserId || 'Not set'}`);
    
    console.log('\nBot Deep Link:');
    console.log(`  https://t.me/${botUsername}\n`);
    
    console.log('Next Steps:');
    console.log('  1. Test bot: https://t.me/' + botUsername);
    console.log('  2. Send /start command to activate bot');
    console.log('  3. Get your user ID: Send /start and check console logs');
    console.log('  4. Update admin_user_id in Admin Settings UI with your numeric user ID');
    console.log('  5. Test audit request submission\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error initializing Telegram settings:', error);
    process.exit(1);
  }
}

// Run initialization
initializeTelegramSettings();
