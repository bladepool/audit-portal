const mongoose = require('mongoose');

const AdEventSchema = new mongoose.Schema({
  ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Advertisement', required: true, index: true },
  type: { type: String, enum: ['view', 'click'], required: true, index: true },
  ip: { type: String },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('AdEvent', AdEventSchema);
