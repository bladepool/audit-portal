/**
 * Simplified admin PDF routes for production
 * Only provides fallback endpoint when PDF generation isn't available
 */

const express = require('express');
const router = express.Router();

// PDF generation not available in production - provide fallback
router.post('/generate-pdf', (req, res) => {
  res.status(503).json({
    success: false,
    error: 'PDF generation service not available',
    message: 'PDF generation requires local environment with pdf.js setup'
  });
});

module.exports = router;
