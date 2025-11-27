const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const OwnerUpdate = require('../models/OwnerUpdate');
const Advertisement = require('../models/Advertisement');
const AdEvent = require('../models/AdEvent');

// GET /api/admin/usage
// Returns aggregated usage metrics: page views, votes, owner updates, ad views/clicks and estimated revenue
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchTime = {};
    if (startDate || endDate) {
      matchTime.createdAt = {};
      if (startDate) matchTime.createdAt.$gte = new Date(startDate);
      if (endDate) matchTime.createdAt.$lte = new Date(endDate);
    }

    // Total page views across projects
    const pageViewsAgg = await Project.aggregate([
      { $match: {} },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$page_view", 0] } } } }
    ]);
    const totalPageViews = (pageViewsAgg[0] && pageViewsAgg[0].total) || 0;

    // Votes (secure/insecure)
    const votesAgg = await Project.aggregate([
      { $group: { _id: null, secure: { $sum: { $ifNull: ["$secure_votes", 0] } }, insecure: { $sum: { $ifNull: ["$insecure_votes", 0] } } } }
    ]);
    const totalSecure = (votesAgg[0] && votesAgg[0].secure) || 0;
    const totalInsecure = (votesAgg[0] && votesAgg[0].insecure) || 0;

    // Owner updates count (optionally time-bounded)
    const ownerUpdateFilter = {};
    if (matchTime.createdAt) ownerUpdateFilter.createdAt = matchTime.createdAt;
    const ownerUpdatesCount = await OwnerUpdate.countDocuments(ownerUpdateFilter);

    // Ad events aggregation
    const adEventsMatch = {};
    if (matchTime.createdAt) adEventsMatch.createdAt = matchTime.createdAt;

    // Aggregate per-ad views and clicks
    const adAgg = await AdEvent.aggregate([
      { $match: adEventsMatch },
      { $group: { _id: { ad: '$ad', type: '$type' }, count: { $sum: 1 } } }
    ]);

    // Map counts per ad
    const perAdCounts = {};
    adAgg.forEach(row => {
      const adId = String(row._id.ad);
      perAdCounts[adId] = perAdCounts[adId] || { views: 0, clicks: 0 };
      if (row._id.type === 'view') perAdCounts[adId].views = row.count;
      if (row._id.type === 'click') perAdCounts[adId].clicks = row.count;
    });

    // Fetch ad details to compute estimated revenue
    const ads = await Advertisement.find({});
    let totalEstimatedRevenue = 0;
    let totalEstimatedCost = 0; // if you have cost fields, add here
    const adsReport = ads.map(ad => {
      const adId = String(ad._id);
      const counts = perAdCounts[adId] || { views: 0, clicks: 0 };
      const revenueFromImps = (ad.cpm || 0) * (counts.views / 1000);
      const revenueFromClicks = (ad.cpc || 0) * counts.clicks;
      const estimated = revenueFromImps + revenueFromClicks;
      totalEstimatedRevenue += estimated;
      return {
        adId,
        ad_url: ad.ad_url,
        views: counts.views,
        clicks: counts.clicks,
        cpm: ad.cpm || 0,
        cpc: ad.cpc || 0,
        estimatedRevenue: Number(estimated.toFixed(4))
      };
    });

    res.json({
      pageViews: totalPageViews,
      votes: { secure: totalSecure, insecure: totalInsecure },
      ownerUpdates: ownerUpdatesCount,
      ads: adsReport,
      totals: {
        adViews: Object.values(perAdCounts).reduce((s, v) => s + v.views, 0),
        adClicks: Object.values(perAdCounts).reduce((s, v) => s + v.clicks, 0),
        estimatedRevenue: Number(totalEstimatedRevenue.toFixed(4))
      }
    });
  } catch (err) {
    console.error('Usage report error:', err);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
});

module.exports = router;
