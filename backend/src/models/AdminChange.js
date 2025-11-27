const mongoose = require('mongoose');

const AdminChangeSchema = new mongoose.Schema({
  entity: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  changes: { type: Object, required: true },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminChange', AdminChangeSchema);
