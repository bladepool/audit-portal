const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Get all published projects (public)
router.get('/', async (req, res) => {
  try {
    const { sort = 'recent' } = req.query;
    let sortQuery = { createdAt: -1 };
    
    if (sort === 'votes') {
      sortQuery = { total_votes: -1 };
    } else if (sort === 'views') {
      sortQuery = { page_view: -1 };
    }
    
    const projects = await Project.find({ published: true })
      .sort(sortQuery)
      .select('-__v');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const project = await Project.findOne({ 
      slug: req.params.slug,
      published: true 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Increment page view
    project.page_view += 1;
    await project.save();
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all projects including unpublished (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project by ID (admin only)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new project (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    
    res.status(201).json(project);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update project (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish/Unpublish project (admin only)
router.patch('/:id/publish', auth, async (req, res) => {
  try {
    const { published } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { published },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate unique slug
router.post('/generate-slug', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Generate base slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check if slug exists
    let counter = 0;
    let finalSlug = slug;
    
    while (await Project.findOne({ slug: finalSlug })) {
      counter++;
      finalSlug = `${slug}-${counter}`;
    }
    
    res.json({ slug: finalSlug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
