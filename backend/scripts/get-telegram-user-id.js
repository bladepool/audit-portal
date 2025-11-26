/**
 * Get Telegram User ID from Username
 * Run: node scripts/get-telegram-user-id.js <username>
 * 
 * This script attempts to get the numeric user ID for a Telegram username.
 * Note: Telegram API doesn't provide a direct way to get user ID from username.
 * 
 * Alternative methods:
 * 1. Have the user send /start to your bot
 * 2. Use @userinfobot on Telegram
 * 3. Check bot webhook updates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../src/models/Settings');
const axios = require('axios');

async function getTelegramUserId(username) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
    await mongoose.connect(mongoUri);

    // Load bot token
    const botToken = await Settings.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('❌ Bot token not configured');
      console.log('\nPlease configure bot token:');
      console.log('1. Run: node scripts/init-telegram-settings.js');
      console.log('2. Or set TELEGRAM_BOT_TOKEN in .env');
      process.exit(1);
    }

    console.log('🤖 Telegram User ID Lookup\n');
    console.log(`Username: @${username}\n`);
    
    // Method 1: Check recent updates (if user has interacted with bot)
    console.log('Checking recent bot updates...');
    try {
      const response = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`);
      const updates = response.data.result;
      
      if (updates.length === 0) {
        console.log('❌ No recent updates found\n');
      } else {
        console.log(`✓ Found ${updates.length} recent updates\n`);
        
        // Search for username in updates
        const userUpdate = updates.find(update => {
          const user = update.message?.from || update.callback_query?.from;
          return user && user.username && user.username.toLowerCase() === username.toLowerCase();
        });
        
        if (userUpdate) {
          const user = userUpdate.message?.from || userUpdate.callback_query?.from;
          console.log('✓ User found in bot updates!');
          console.log(`\nUser ID: ${user.id}`);
          console.log(`Username: @${user.username}`);
          console.log(`First Name: ${user.first_name}`);
          if (user.last_name) console.log(`Last Name: ${user.last_name}`);
          
          // Update admin user ID in database
          console.log('\n📝 Updating admin user ID in database...');
          await Settings.set('telegram_admin_user_id', user.id.toString(), 'Telegram numeric user ID for admin notifications');
          console.log('✓ Admin user ID updated successfully');
          
          await mongoose.connection.close();
          return;
        } else {
          console.log(`❌ Username @${username} not found in recent updates\n`);
        }
      }
    } catch (error) {
      console.error('Error fetching updates:', error.message);
    }
    
    // Method 2: Instructions for getting user ID
    console.log('📱 How to get your Telegram User ID:\n');
    console.log('Method 1 - Use @userinfobot:');
    console.log('  1. Open Telegram');
    console.log('  2. Search for @userinfobot');
    console.log('  3. Send /start');
    console.log('  4. Bot will reply with your User ID\n');
    
    console.log('Method 2 - Use your bot:');
    const botUsername = await Settings.get('telegram_bot_username') || 'CFGNINJA_Bot';
    console.log(`  1. Open Telegram and start chat: https://t.me/${botUsername}`);
    console.log('  2. Send /start command');
    console.log('  3. Check your backend logs for user ID');
    console.log('  4. Or run this script again after sending /start\n');
    
    console.log('Method 3 - Use IDBot:');
    console.log('  1. Search for @myidbot on Telegram');
    console.log('  2. Send /getid');
    console.log('  3. Bot will reply with your User ID\n');
    
    console.log('Once you have your numeric User ID:');
    console.log('  • Update it in Admin Settings UI');
    console.log('  • Or update database directly:');
    console.log(`  • node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Settings = require('./src/models/Settings'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal').then(async () => { await Settings.set('telegram_admin_user_id', 'YOUR_USER_ID', 'Admin user ID'); console.log('Updated'); await mongoose.connection.close(); });"`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get username from command line
const username = process.argv[2];

if (!username) {
  console.log('Usage: node scripts/get-telegram-user-id.js <username>');
  console.log('Example: node scripts/get-telegram-user-id.js bladepool');
  process.exit(1);
}

// Remove @ if provided
const cleanUsername = username.replace('@', '');
getTelegramUserId(cleanUsername);
