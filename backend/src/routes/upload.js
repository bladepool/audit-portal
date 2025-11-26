const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { uploadToIPFS, validateFile } = require('../utils/ipfs');
const Project = require('../models/Project');
const Advertisement = require('../models/Advertisement');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

/**
 * POST /api/upload/logo/project/:id
 * Upload logo for a project to IPFS
 */
router.post('/logo/project/:id', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const projectId = req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`Processing logo upload for project: ${project.name}`);

    // Optimize image with sharp
    let processedBuffer;
    try {
      processedBuffer = await sharp(req.file.buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ quality: 90 })
        .toBuffer();

      console.log(`Original size: ${req.file.size} bytes, Optimized size: ${processedBuffer.length} bytes`);
    } catch (error) {
      console.error('Image processing error:', error);
      return res.status(400).json({ error: 'Failed to process image' });
    }

    // Validate file
    try {
      validateFile(processedBuffer, 10);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Upload to IPFS
    let uploadResult;
    try {
      const filename = `${project.slug}-logo.png`;
      uploadResult = await uploadToIPFS(processedBuffer, filename);
      console.log('IPFS upload successful:', uploadResult);
    } catch (error) {
      console.error('IPFS upload error:', error);
      return res.status(500).json({ 
        error: 'Failed to upload to IPFS', 
        details: error.message 
      });
    }

    // Update project with IPFS URL
    project.logo = uploadResult.url;
    project.ipfs_logo_hash = uploadResult.ipfsHash;
    project.logo_provider = uploadResult.provider;
    await project.save();

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      project: {
        id: project._id,
        name: project.name,
        logo: project.logo,
        ipfsHash: uploadResult.ipfsHash,
        provider: uploadResult.provider,
        gatewayUrl: uploadResult.gatewayUrl,
      },
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

/**
 * POST /api/upload/logo/advertisement/:id
 * Upload logo for an advertisement to IPFS
 */
router.post('/logo/advertisement/:id', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const adId = req.params.id;
    const advertisement = await Advertisement.findById(adId);

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    console.log(`Processing logo upload for advertisement: ${advertisement.title}`);

    // Optimize image with sharp
    let processedBuffer;
    try {
      processedBuffer = await sharp(req.file.buffer)
        .resize(800, 400, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      console.log(`Original size: ${req.file.size} bytes, Optimized size: ${processedBuffer.length} bytes`);
    } catch (error) {
      console.error('Image processing error:', error);
      return res.status(400).json({ error: 'Failed to process image' });
    }

    // Validate file
    try {
      validateFile(processedBuffer, 10);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Upload to IPFS
    let uploadResult;
    try {
      const filename = `ad-${advertisement._id}-${Date.now()}.jpg`;
      uploadResult = await uploadToIPFS(processedBuffer, filename);
      console.log('IPFS upload successful:', uploadResult);
    } catch (error) {
      console.error('IPFS upload error:', error);
      return res.status(500).json({ 
        error: 'Failed to upload to IPFS', 
        details: error.message 
      });
    }

    // Update advertisement with IPFS URL
    advertisement.imageUrl = uploadResult.url;
    advertisement.ipfs_image_hash = uploadResult.ipfsHash;
    advertisement.image_provider = uploadResult.provider;
    await advertisement.save();

    res.json({
      success: true,
      message: 'Advertisement image uploaded successfully',
      advertisement: {
        id: advertisement._id,
        title: advertisement.title,
        imageUrl: advertisement.imageUrl,
        ipfsHash: uploadResult.ipfsHash,
        provider: uploadResult.provider,
        gatewayUrl: uploadResult.gatewayUrl,
      },
    });
  } catch (error) {
    console.error('Advertisement image upload error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

/**
 * POST /api/upload/bulk-logos
 * Upload multiple logos at once
 */
router.post('/bulk-logos', upload.array('logos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Get project ID from filename or metadata
        const projectSlug = file.originalname.split('.')[0];
        const project = await Project.findOne({ slug: projectSlug });

        if (!project) {
          errors.push({ filename: file.originalname, error: 'Project not found' });
          continue;
        }

        // Process and upload
        const processedBuffer = await sharp(file.buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ quality: 90 })
          .toBuffer();

        const uploadResult = await uploadToIPFS(processedBuffer, file.originalname);

        // Update project
        project.logo = uploadResult.url;
        project.ipfs_logo_hash = uploadResult.ipfsHash;
        await project.save();

        results.push({
          filename: file.originalname,
          projectId: project._id,
          projectName: project.name,
          ipfsHash: uploadResult.ipfsHash,
          url: uploadResult.url,
        });
      } catch (error) {
        errors.push({ filename: file.originalname, error: error.message });
      }
    }

    res.json({
      success: true,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * GET /api/upload/ipfs/:hash
 * Get gateway URLs for an IPFS hash
 */
router.get('/ipfs/:hash', (req, res) => {
  const { hash } = req.params;
  const { getGatewayUrls } = require('../utils/ipfs');
  
  const gateways = getGatewayUrls(hash);
  
  res.json({
    ipfsHash: hash,
    gateways,
  });
});

module.exports = router;
