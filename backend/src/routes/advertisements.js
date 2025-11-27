const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const auth = require('../middleware/auth');
const AdEvent = require('../models/AdEvent');
const AdminChange = require('../models/AdminChange');

// Get all advertisements (public - for getting random published ads)
router.get('/', async (req, res) => {
  try {
    const { published } = req.query;
    const query = published === 'true' ? { published: true } : {};
    
    const ads = await Advertisement.find(query).sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random published advertisement (public endpoint for project pages)
router.get('/random', async (req, res) => {
  try {
    const count = await Advertisement.countDocuments({ published: true });
    
    if (count === 0) {
      return res.json(null);
    }
    
    const random = Math.floor(Math.random() * count);
    const ad = await Advertisement.findOne({ published: true }).skip(random);
    
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single advertisement
router.get('/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create advertisement (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Sanitize CPM/CPC
    const sanitizeNumeric = (val, max) => {
      if (val === undefined || val === null || val === '') return 0;
      const n = Number(val);
      if (Number.isNaN(n)) return 0;
      return Math.max(0, Math.min(n, max));
    };
    const payload = { ...req.body };
    payload.cpm = sanitizeNumeric(req.body.cpm, 1000);
    payload.cpc = sanitizeNumeric(req.body.cpc, 100);
    const ad = new Advertisement(payload);
    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update advertisement (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Sanitize CPM/CPC before update
    const sanitizeNumeric = (val, max) => {
      if (val === undefined || val === null || val === '') return undefined;
      const n = Number(val);
      if (Number.isNaN(n)) return undefined;
      return Math.max(0, Math.min(n, max));
    };
    const update = { ...req.body };
    const sanitizedCpm = sanitizeNumeric(req.body.cpm, 1000);
    const sanitizedCpc = sanitizeNumeric(req.body.cpc, 100);
    if (sanitizedCpm !== undefined) update.cpm = sanitizedCpm;
    if (sanitizedCpc !== undefined) update.cpc = sanitizedCpc;

    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    
    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    // Log admin change if cpm or cpc were part of the update
    try {
      const user = req.user || null;
      const changes = {};
      if (sanitizedCpm !== undefined) changes.cpm = sanitizedCpm;
      if (sanitizedCpc !== undefined) changes.cpc = sanitizedCpc;
      if (Object.keys(changes).length > 0) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
        const log = new AdminChange({
          entity: 'Advertisement',
          entityId: ad._id,
          userId: user?._id,
          userEmail: user?.email,
          changes,
          ip
        });
        await log.save();
      }
    } catch (logErr) {
      console.error('Failed to log admin change:', logErr);
    }

    res.json(ad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete advertisement (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate advertisement (admin only)
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await Advertisement.findById(req.params.id);
    
    if (!original) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    const duplicate = new Advertisement({
      ad_image: original.ad_image,
      ad_url: original.ad_url,
      published: false, // Always create duplicates as draft
    });
    
    await duplicate.save();
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record an ad event (public): { type: 'view'|'click', meta?: {} }
router.post('/:id/event', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

    const { type, meta } = req.body;
    if (!['view', 'click'].includes(type)) return res.status(400).json({ error: 'Invalid event type' });

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    const ev = new AdEvent({ ad: ad._id, type, ip, meta });
    await ev.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Ad event error:', err);
    res.status(500).json({ error: 'Failed to record ad event' });
  }
});

// Admin CSV export for advertisements (admin only)
router.get('/admin/export/csv', auth, async (req, res) => {
  try {
    const ads = await Advertisement.find({}).sort({ createdAt: -1 }).lean();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="advertisements_export_${new Date().toISOString().slice(0,10)}.csv"`);

    // Header
    res.write('id,ad_image,ad_url,createdAt,updatedAt,published,cpm,cpc\n');
    ads.forEach(a => {
      const row = [
        a._id,
        `"${String(a.ad_image || '').replace(/"/g, '""')}"`,
        `"${String(a.ad_url || '').replace(/"/g, '""')}"`,
        a.createdAt ? new Date(a.createdAt).toISOString() : '',
        a.updatedAt ? new Date(a.updatedAt).toISOString() : '',
        a.published ? 'true' : 'false',
        (typeof a.cpm === 'number') ? a.cpm : 0,
        (typeof a.cpc === 'number') ? a.cpc : 0
      ];
      res.write(row.join(',') + '\n');
    });
    res.end();
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router;

