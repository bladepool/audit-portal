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
  // Estimated pricing (optional) used for revenue calculations
  cpm: { type: Number, default: 0 }, // cost per 1000 impressions in USD
  cpc: { type: Number, default: 0 }, // cost per click in USD
  published: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
