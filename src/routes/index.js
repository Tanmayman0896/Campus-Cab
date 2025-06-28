const express = require('express');
const router = express.Router();

// Import route modules
const requestRoutes = require('./requests');
const voteRoutes = require('./votes');
const userRoutes = require('./users');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1'
  });
});

// Mount routes
router.use('/requests', requestRoutes);
router.use('/votes', voteRoutes);
router.use('/users', userRoutes);

// 404 handler for API routes
router.use((req, res) => {  // Removed '*' to handle all unmatched API routes
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports=router;