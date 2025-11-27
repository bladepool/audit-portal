const mongoose = require('mongoose');

const NonceSchema = new mongoose.Schema({
  slug: { type: String, required: true, index: true },
  value: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Nonce', NonceSchema);
