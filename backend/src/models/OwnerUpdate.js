const mongoose = require('mongoose');

const OwnerUpdateSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  slug: { type: String, required: true },
  signer: { type: String, required: true },
  updates: { type: Object, required: true },
  message: { type: String, required: true },
  signature: { type: String, required: true },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OwnerUpdate', OwnerUpdateSchema);
