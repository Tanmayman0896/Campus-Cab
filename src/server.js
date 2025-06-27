// Load environment variables first thing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// My project's configurations and services
const { initializeFirebase } = require('./config/firebase');
const cleanupService = require('./services/cleanupService');
const { errorHandler } = require('./middleware/errorHandler');

// All my API routes
const apiRoutes = require('./routes');

class RideShareServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    // Set up everything step by step
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Basic security stuff - always good to have
    this.app.use(helmet());
    
    // Allow cross-origin requests for our React Native app
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:19006'], // Local development
      credentials: true
    }));

    // Rate limiting to prevent spam
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window
      message: {
        success: false,
        message: 'Too many requests. Please slow down.'
      }
    });
    this.app.use('/api', limiter);

    // Log requests in development for debugging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Parse JSON and URL-encoded data
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Set request timeout - don't want requests hanging forever
    this.app.use((req, res, next) => {
      req.setTimeout(30000); // 30 seconds should be enough
      next();
    });
  }

  setupRoutes() {
    // Simple health check endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Student Rideshare API is running!',
        version: process.env.API_VERSION || 'v1',
        timestamp: new Date().toISOString()
      });
    });

    // Main API routes
    this.app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRoutes);

    // Development-only admin routes for testing
    if (process.env.NODE_ENV === 'development') {
      this.app.get('/admin/cleanup', async (req, res) => {
        try {
          const result = await cleanupService.manualCleanup();
          res.json({
            success: true,
            message: 'Cleanup completed successfully',
            data: result
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Cleanup failed',
            error: error.message
          });
        }
      });

      this.app.get('/admin/stats', async (req, res) => {
        try {
          const stats = await cleanupService.getCleanupStats();
          res.json({
            success: true,
            data: stats
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Could not fetch stats',
            error: error.message
          });
        }
      });
    }

    // Catch all unmatched routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'This route doesn\'t exist.'
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler);

    // Handle graceful shutdown
    process.on('SIGTERM', this.shutdownGracefully.bind(this));
    process.on('SIGINT', this.shutdownGracefully.bind(this));
    
    // Log unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
    });

    // Log uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdownGracefully();
    });
  }

  async startServer() {
    try {
      // Initialize Firebase first
      await initializeFirebase();
      
      // Start the cleanup service for expired requests
      cleanupService.start();
      
      // Start the server
      this.server = this.app.listen(this.port, () => {
        console.log(`Rideshare server is live on port ${this.port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`API URL: http://localhost:${this.port}/api/${process.env.API_VERSION || 'v1'}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Developer tools available:`);
          console.log(`   - GET /admin/cleanup - Run manual cleanup`);
          console.log(`   - GET /admin/stats - View system statistics`);
        }
      });
      
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdownGracefully() {
    console.log('Shutting down server gracefully...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('HTTP server closed');
      });
    }
    
    // Stop the cleanup service
    cleanupService.stop();
    
    // Close database connections
    const prisma = require('./config/database');
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    process.exit(0);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  const server = new RideShareServer();
  server.startServer();
}

module.exports = RideShareServer;
