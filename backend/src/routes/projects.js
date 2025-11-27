const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { fetchTokenSecurity, getChainId } = require('../services/goplusService');

// Get all published projects (public) with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { 
      sort = 'recent',
      search = '',
      platform = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      page = 1,
      limit = 20
    } = req.query;
    
    // Build sort query
    let sortQuery = { createdAt: -1 };
    if (sort === 'votes') {
      sortQuery = { total_votes: -1 };
    } else if (sort === 'views') {
      sortQuery = { page_view: -1 };
    } else if (sort === 'name') {
      sortQuery = { name: 1 };
    } else if (sort === 'score') {
      sortQuery = { audit_score: -1 };
    }
    
    // Build filter query
    let filterQuery = { published: true };
    
    // Search across name, symbol, platform
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { symbol: { $regex: search, $options: 'i' } },
        { platform: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by platform
    if (platform) {
      filterQuery.platform = platform;
    }
    
    // Filter by status
    if (status) {
      filterQuery.status = status;
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      filterQuery.createdAt = {};
      if (dateFrom) {
        filterQuery.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filterQuery.createdAt.$lte = new Date(dateTo);
      }
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute queries
    const [projects, total] = await Promise.all([
      Project.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      Project.countDocuments(filterQuery)
    ]);
    
    res.json({
      projects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get portfolio stats (includes all projects for total count)
router.get('/stats/portfolio', async (req, res) => {
  try {
    // Get all projects (including unpublished) for total count
    const allProjects = await Project.find({});
    const publishedProjects = allProjects.filter(p => p.published);
    
    // Calculate findings by severity across all published projects
    let criticalFound = 0;
    let highFound = 0;
    let mediumFound = 0;
    let lowFound = 0;
    let infoFound = 0;
    
    publishedProjects.forEach(project => {
      criticalFound += project.critical?.found || 0;
      highFound += project.major?.found || 0;
      mediumFound += project.medium?.found || 0;
      lowFound += project.minor?.found || 0;
      infoFound += project.informational?.found || 0;
    });
    
    res.json({
      totalProjects: allProjects.length,
      publishedProjects: publishedProjects.length,
      findings: {
        critical: criticalFound,
        high: highFound,
        medium: mediumFound,
        low: lowFound,
        informational: infoFound,
        total: criticalFound + highFound + mediumFound + lowFound + infoFound
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let project;
    
    // Check if it's a MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      // Try to find by ID first
      project = await Project.findById(slug);
    } else {
      // Find by slug
      project = await Project.findOne({ 
        slug: slug,
        published: true 
      });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Increment page view only for slug-based lookups (public pages)
    if (!/^[0-9a-fA-F]{24}$/.test(slug)) {
      project.page_view += 1;
      await project.save();
    }
    
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

/**
 * Owner-signed update (public) - allows contract owner to update limited fields
 * Expected body: { updates: { description, logo, socials, launchpad }, message: string, signature: string }
 */
router.post('/:slug/owner-update', async (req, res) => {
  try {
    const { updates, message, signature } = req.body;
    const slug = req.params.slug;

    if (!updates || !message || !signature) {
      return res.status(400).json({ error: 'Missing updates, message, or signature' });
    }

    // Verify signature
    const { ethers } = require('ethers');
    let signer;
    try {
      signer = ethers.verifyMessage(message, signature).toLowerCase();
    } catch (err) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Find project (allow published or id)
    let project;
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      project = await Project.findById(slug);
    } else {
      project = await Project.findOne({ slug });
    }

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const ownerAddr = (project.contract_info?.contract_owner || project.contract_info?.contract_deployer || '').toLowerCase();
    if (!ownerAddr) return res.status(400).json({ error: 'No owner configured for project' });

    if (signer !== ownerAddr && signer !== (project.contract_info?.contract_deployer || '').toLowerCase()) {
      return res.status(403).json({ error: 'Signature does not match project owner' });
    }

    // Whitelist allowed fields
    const allowed = ['description', 'logo', 'socials', 'launchpad'];
    const patched = {};
    for (const key of Object.keys(updates)) {
      if (!allowed.includes(key)) continue;
      patched[key] = updates[key];
      project[key] = updates[key];
    }

    await project.save();

    res.json({ success: true, message: 'Project updated by owner', project });
  } catch (error) {
    console.error('Owner update error:', error);
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

/**
 * POST /api/projects/:id/scan-distribution
 * Scan token holder distribution using blockchain explorer API
 */
router.post('/:id/scan-distribution', auth, async (req, res) => {
  try {
    const tokenHolderService = require('../services/tokenHolderService');
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const contractAddress = project.contract_info?.contract_address || project.address;
    
    if (!contractAddress) {
      return res.status(400).json({ error: 'No contract address found for this project' });
    }
    
    const platform = project.platform || 'BNBCHAIN';
    const supply = project.supply || '0';
    
    console.log(`Scanning token distribution for ${project.name}`);
    console.log(`Platform: ${platform}, Contract: ${contractAddress}`);
    
    // Scan token holders
    const distributionData = await tokenHolderService.scanTokenHolders(
      contractAddress,
      platform,
      supply
    );
    
    // Update project with distribution data
    project.tokenDistribution = {
      enabled: true,
      distributions: distributionData.distributions,
      totalDistributed: distributionData.totalDistributed,
      remainingSupply: distributionData.remainingSupply,
      lastScanned: distributionData.lastScanned,
      scanSource: distributionData.scanSource,
      // Preserve existing liquidity lock data
      isLiquidityLock: project.tokenDistribution?.isLiquidityLock || false,
      liquidityLockLink: project.tokenDistribution?.liquidityLockLink || '',
      lockAmount: project.tokenDistribution?.lockAmount || '',
      lockLocation: project.tokenDistribution?.lockLocation || 'Pinksale',
      unlockAmount: project.tokenDistribution?.unlockAmount || ''
    };
    
    await project.save();
    
    res.json({
      success: true,
      message: 'Token distribution scanned successfully',
      data: project.tokenDistribution
    });
    
  } catch (error) {
    console.error('Error scanning token distribution:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
