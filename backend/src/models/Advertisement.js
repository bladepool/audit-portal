const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  ad_image: {
    type: String,
    required: true,
  },
  ad_url: {
    type: String,
    required: true,
  },
  published: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
