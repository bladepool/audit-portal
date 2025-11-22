const express = require('express');
const router = express.Router();
const { TrustBlockAPI } = require('../services/trustBlockService');

// Initialize TrustBlock API
const trustBlockAPI = new TrustBlockAPI(process.env.TRUSTBLOCK_API_KEY || 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M');

/**
 * POST /api/admin/trustblock/publish/:slug
 * Publish a single project to TrustBlock
 */
router.post('/publish/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = req.app.locals.db;
    
    // Find the project
    const project = await db.collection('projects').findOne({ slug });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (!project.published) {
      return res.status(400).json({ error: 'Project is not published' });
    }
    
    // Format and publish to TrustBlock
    console.log(`Publishing ${project.name} to TrustBlock...`);
    const result = await trustBlockAPI.publishReport(
      trustBlockAPI.formatProjectForTrustBlock(project)
    );
    
    // Save TrustBlock URL to database
    if (result.report_url) {
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            trustblock_url: result.report_url,
            trustblock_published_at: new Date(),
            trustblock_id: result.id
          } 
        }
      );
    }
    
    res.json({ 
      success: true, 
      message: `Published ${project.name} to TrustBlock`,
      data: result 
    });
    
  } catch (error) {
    console.error('TrustBlock publish error:', error);
    res.status(500).json({ 
      error: 'Failed to publish to TrustBlock', 
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/trustblock/publish-batch
 * Publish multiple projects to TrustBlock
 */
router.post('/publish-batch', async (req, res) => {
  try {
    const { slugs } = req.body;
    
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return res.status(400).json({ error: 'slugs array is required' });
    }
    
    const db = req.app.locals.db;
    
    // Find all projects
    const projects = await db.collection('projects').find({ 
      slug: { $in: slugs },
      published: true
    }).toArray();
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'No published projects found' });
    }
    
    // Batch publish
    console.log(`Publishing ${projects.length} projects to TrustBlock...`);
    const results = await trustBlockAPI.batchPublish(projects);
    
    // Update database with results
    for (const result of results) {
      if (result.success && result.data.report_url) {
        const project = projects.find(p => p.name === result.project);
        if (project) {
          await db.collection('projects').updateOne(
            { _id: project._id },
            { 
              $set: { 
                trustblock_url: result.data.report_url,
                trustblock_published_at: new Date(),
                trustblock_id: result.data.id
              } 
            }
          );
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({ 
      success: true,
      message: `Published ${successCount} projects, ${failureCount} failed`,
      results 
    });
    
  } catch (error) {
    console.error('TrustBlock batch publish error:', error);
    res.status(500).json({ 
      error: 'Failed to batch publish to TrustBlock', 
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/trustblock/publish-all
 * Publish all unpublished projects to TrustBlock
 */
router.post('/publish-all', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Find all published projects without TrustBlock URL
    const projects = await db.collection('projects').find({ 
      published: true,
      trustblock_url: { $exists: false }
    }).toArray();
    
    if (projects.length === 0) {
      return res.json({ 
        success: true,
        message: 'All projects already published to TrustBlock' 
      });
    }
    
    console.log(`Publishing ${projects.length} projects to TrustBlock...`);
    const results = await trustBlockAPI.batchPublish(projects);
    
    // Update database with results
    for (const result of results) {
      if (result.success && result.data.report_url) {
        const project = projects.find(p => p.name === result.project);
        if (project) {
          await db.collection('projects').updateOne(
            { _id: project._id },
            { 
              $set: { 
                trustblock_url: result.data.report_url,
                trustblock_published_at: new Date(),
                trustblock_id: result.data.id
              } 
            }
          );
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({ 
      success: true,
      message: `Published ${successCount} projects, ${failureCount} failed`,
      total: projects.length,
      results 
    });
    
  } catch (error) {
    console.error('TrustBlock publish all error:', error);
    res.status(500).json({ 
      error: 'Failed to publish all to TrustBlock', 
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/trustblock/status
 * Get TrustBlock publishing status
 */
router.get('/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const totalPublished = await db.collection('projects').countDocuments({ published: true });
    const withTrustBlock = await db.collection('projects').countDocuments({ 
      published: true,
      trustblock_url: { $exists: true }
    });
    const withoutTrustBlock = totalPublished - withTrustBlock;
    
    res.json({
      success: true,
      total_published: totalPublished,
      on_trustblock: withTrustBlock,
      not_on_trustblock: withoutTrustBlock,
      percentage: ((withTrustBlock / totalPublished) * 100).toFixed(1) + '%'
    });
    
  } catch (error) {
    console.error('TrustBlock status error:', error);
    res.status(500).json({ 
      error: 'Failed to get TrustBlock status', 
      details: error.message 
    });
  }
});

module.exports = router;
