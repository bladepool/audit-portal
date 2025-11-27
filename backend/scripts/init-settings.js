// Small init script to ensure default settings exist (run once during deployment/migration)
const mongoose = require('mongoose');
const Settings = require('../src/models/Settings');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/audit-portal';

async function ensureDefaults() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for init-settings');

  const defaults = [
    { key: 'allow_ai_replies', value: false, description: 'Enable AI-powered non-command replies from the Telegram bot (default false).' },
    // Add other defaults here if desired
  ];

  for (const s of defaults) {
    const existing = await Settings.findOne({ key: s.key });
    if (!existing) {
      await Settings.set(s.key, s.value, s.description);
      console.log(`Created default setting: ${s.key} = ${s.value}`);
    } else {
      console.log(`Setting exists: ${s.key} (skipping)`);
    }
  }

  await mongoose.disconnect();
  console.log('Init settings complete');
}

ensureDefaults().catch(err => {
  console.error('init-settings failed:', err);
  process.exit(1);
});
