const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const blockchainRoutes = require('./routes/blockchains');
const advertisementRoutes = require('./routes/advertisements');
const trustBlockRoutes = require('./routes/trustblock');

// Admin PDF routes - only available in local development
let adminPdfRoutes = null;
if (process.env.NODE_ENV !== 'production') {
  try {
    adminPdfRoutes = require('./routes/adminPdfRoutes');
    console.log('✅ Admin PDF routes loaded successfully');
  } catch (error) {
    console.warn('⚠️ Admin PDF routes not available:', error.message);
  }
} else {
  console.log('ℹ️  Admin PDF routes disabled in production (use local environment for PDF generation)');
}

let marketCapRoutes = null;
try {
  marketCapRoutes = require('./routes/marketcap');
  console.log('✅ Market cap routes loaded successfully');
} catch (error) {
  console.warn('⚠️ Market cap routes not available:', error.message);
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/blockchains', blockchainRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/admin/trustblock', trustBlockRoutes);

// Only register admin PDF routes if available
if (adminPdfRoutes) {
  app.use('/api/admin', adminPdfRoutes);
} else {
  // Provide fallback endpoint
  app.post('/api/admin/generate-pdf', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'PDF generation service not available',
      message: 'PDF generation requires local environment setup'
    });
  });
}

// Only register marketcap routes if available
if (marketCapRoutes) {
  app.use('/api/marketcap', marketCapRoutes);
} else {
  // Provide fallback endpoint
  app.get('/api/marketcap/secured', (req, res) => {
    res.json({
      totalSecured: 2500000000,
      formatted: '$2.5B',
      fallback: true,
      message: 'Market cap service temporarily unavailable'
    });
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
