const mongoose = require('mongoose');

const NonceSchema = new mongoose.Schema({
  slug: { type: String, required: true, index: true },
  address: { type: String, index: true },
  ip: { type: String, index: true },
  value: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

NonceSchema.index({ address: 1, createdAt: 1 });
NonceSchema.index({ ip: 1, createdAt: 1 });

module.exports = mongoose.model('Nonce', NonceSchema);
