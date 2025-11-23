const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    let admin = await User.findOne({ email: 'admin@cfg.ninja' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating new admin...');
      admin = new User({
        email: 'admin@cfg.ninja',
        password: 'admin123',
        name: 'Blade Ninja',
        role: 'admin',
        securityQuestions: [
          { question: 'What city were you born in?', answer: 'Tokyo' },
          { question: 'What is your favorite color?', answer: 'Blue' },
          { question: 'What is your mother\'s maiden name?', answer: 'Nakamoto' }
        ]
      });
      await admin.save();
      console.log('✅ New admin user created');
    } else {
      console.log('ℹ️ Admin user found. Resetting password...');
      admin.password = 'admin123';
      admin.securityQuestions = [
        { question: 'What city were you born in?', answer: 'Tokyo' },
        { question: 'What is your favorite color?', answer: 'Blue' },
        { question: 'What is your mother\'s maiden name?', answer: 'Nakamoto' }
      ];
      await admin.save();
      console.log('✅ Password reset to: admin123');
    }

    console.log('\n📧 Email: admin@cfg.ninja');
    console.log('🔑 Password: admin123');
    console.log('\n🔐 Security Questions:');
    console.log('   1. What city were you born in? → Tokyo');
    console.log('   2. What is your favorite color? → Blue');
    console.log('   3. What is your mother\'s maiden name? → Nakamoto');
    console.log('\n⚠️ Change these after first login!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
