const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { fetchTokenSecurity, getChainId } = require('../services/goplusService');

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

// Submit vote for project (public)
router.post('/:slug/vote', async (req, res) => {
  try {
    const { wallet_address, vote_type } = req.body;
    
    if (!wallet_address || !vote_type) {
      return res.status(400).json({ error: 'Wallet address and vote type are required' });
    }
    
    if (!['secure', 'insecure'].includes(vote_type)) {
      return res.status(400).json({ error: 'Vote type must be "secure" or "insecure"' });
    }
    
    const project = await Project.findOne({ 
      slug: req.params.slug,
      published: true 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // TODO: Add vote tracking in separate collection to prevent duplicate votes
    // For now, just increment the vote counts
    
    if (vote_type === 'secure') {
      project.secure_votes = (project.secure_votes || 0) + 1;
    } else {
      project.insecure_votes = (project.insecure_votes || 0) + 1;
    }
    
    project.total_votes = (project.secure_votes || 0) + (project.insecure_votes || 0);
    
    await project.save();
    
    res.json({
      success: true,
      message: 'Vote submitted successfully',
      votes: {
        secure: project.secure_votes || 0,
        insecure: project.insecure_votes || 0,
        total: project.total_votes
      }
    });
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
    const existingProject = await Project.findById(req.params.id);
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if project is being flagged as live
    const wasNotLive = !existingProject.live;
    const isNowLive = req.body.live === true;
    
    // If project is being set to live, fetch security data from GoPlus
    if (wasNotLive && isNowLive) {
      console.log(`Project ${existingProject.name} is being flagged as LIVE. Fetching GoPlus security data...`);
      
      const contractAddress = req.body.contract_info?.contract_address || 
                             req.body.address || 
                             existingProject.contract_info?.contract_address || 
                             existingProject.address;
      
      if (contractAddress) {
        const platform = req.body.platform || existingProject.platform;
        const chainId = getChainId(platform);
        
        console.log(`Fetching security data for contract: ${contractAddress} on chain: ${chainId}`);
        
        const securityResult = await fetchTokenSecurity(chainId, contractAddress);
        
        if (securityResult.success) {
          console.log('GoPlus security data fetched successfully');
          
          // Merge the fetched overview data with existing overview
          req.body.overview = {
            ...existingProject.overview?.toObject(),
            ...req.body.overview,
            ...securityResult.overview
          };
          
          console.log('Updated overview with GoPlus data:', req.body.overview);
        } else {
          console.warn('Failed to fetch GoPlus data:', securityResult.error);
          // Continue with update even if GoPlus fetch fails
        }
      } else {
        console.warn('No contract address found for GoPlus lookup');
      }
    }
    
    // Perform the update
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
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

// Fetch GoPlus security data manually (admin only)
router.post('/:id/fetch-goplus', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const contractAddress = project.contract_info?.contract_address || project.address;
    
    if (!contractAddress) {
      return res.status(400).json({ error: 'No contract address found for this project' });
    }
    
    const platform = project.platform || 'Binance Smart Chain';
    const chainId = getChainId(platform);
    
    console.log(`Manually fetching GoPlus data for ${project.name}`);
    console.log(`Platform: ${platform}`);
    console.log(`Contract: ${contractAddress}, Chain ID: ${chainId}`);
    
    const securityResult = await fetchTokenSecurity(chainId, contractAddress);
    
    if (securityResult.success) {
      // Update project with fetched data
      project.overview = {
        ...project.overview?.toObject(),
        ...securityResult.overview
      };
      
      await project.save();
      
      res.json({
        success: true,
        message: 'GoPlus security data fetched and updated successfully',
        overview: project.overview,
        rawData: securityResult.rawData
      });
    } else {
      res.status(500).json({
        success: false,
        error: securityResult.error
      });
    }
  } catch (error) {
    console.error('Error fetching GoPlus data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
