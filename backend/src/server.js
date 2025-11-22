const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv not available (using Railway environment variables)');
}

// Load routes with error handling
let authRoutes, projectRoutes, blockchainRoutes, advertisementRoutes, trustBlockRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  process.exit(1);
}

try {
  projectRoutes = require('./routes/projects');
  console.log('✅ Project routes loaded');
} catch (error) {
  console.error('❌ Failed to load project routes:', error.message);
  process.exit(1);
}

try {
  blockchainRoutes = require('./routes/blockchains');
  console.log('✅ Blockchain routes loaded');
} catch (error) {
  console.error('❌ Failed to load blockchain routes:', error.message);
  process.exit(1);
}

try {
  advertisementRoutes = require('./routes/advertisements');
  console.log('✅ Advertisement routes loaded');
} catch (error) {
  console.error('❌ Failed to load advertisement routes:', error.message);
  process.exit(1);
}

try {
  trustBlockRoutes = require('./routes/trustblock');
  console.log('✅ TrustBlock routes loaded');
} catch (error) {
  console.error('❌ Failed to load trustblock routes:', error.message);
  process.exit(1);
}

// Admin PDF routes - only available when PDF generation path exists
let adminPdfRoutes = null;
const fs = require('fs');
const PDF_PATH = process.env.PDF_GENERATION_PATH || 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';

// Only try to load if the PDF generation directory exists (local only)
if (fs.existsSync(PDF_PATH)) {
  try {
    adminPdfRoutes = require('./routes/adminPdfRoutes');
    console.log('✅ Admin PDF routes loaded successfully');
  } catch (error) {
    console.warn('⚠️ Admin PDF routes not available:', error.message);
  }
} else {
  console.log('ℹ️  Admin PDF routes disabled (PDF generation path not found - this is normal for Railway deployment)');
}

// Market cap routes disabled - using manual field in admin portal instead
let marketCapRoutes = null;
console.log('ℹ️  Market cap routes disabled (use manual field in admin portal)');

const app = express();

// Middleware - Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://audit-portal-gamma.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with Mongoose
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Mongoose)'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Also connect native MongoDB driver for trustblock routes
const mongoClient = new MongoClient(process.env.MONGODB_URI);
mongoClient.connect()
  .then(() => {
    console.log('✅ Connected to MongoDB (Native Driver)');
    app.locals.db = mongoClient.db();
  })
  .catch((err) => console.error('❌ Native MongoDB connection error:', err));

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

// Market cap endpoint - static fallback (update via admin portal)
app.get('/api/marketcap/secured', (req, res) => {
  res.json({
    totalSecured: 2500000000,
    formatted: '$2.5B',
    fallback: true,
    message: 'Market cap manually updated via admin portal'
  });
});

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

// Verify MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.error('❌ FATAL: MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in Railway dashboard or .env file');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB: ${process.env.MONGODB_URI.replace(/:[^@]+@/, ':****@')}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;
