const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const auth = require('../middleware/auth');

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
    const ad = new Advertisement(req.body);
    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update advertisement (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found' });
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

module.exports = router;
