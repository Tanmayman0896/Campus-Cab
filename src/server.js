// File: src/server.js

// Load environment variables first thing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Project configurations and services
const { initializeFirebase } = require('./config/firebase');
const cleanupService = require('./services/cleanupService');
const { errorHandler } = require('./middleware/errorHandler');

// Import route modules
const requestRoutes = require('./routes/requests');
const voteRoutes = require('./routes/votes');
const userRoutes = require('./routes/users');

class RideShareServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.apiVersion = process.env.API_VERSION || 'v1';
    this.apiBasePath = `/api/${this.apiVersion}`;
    
    // Set up everything step by step
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Basic security headers
    this.app.use(helmet());
    
    // Configure CORS for React Native app
    const corsOptions = {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:19006'],
      credentials: true
    };
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: {
        success: false,
        message: 'Too many requests. Please slow down.'
      }
    });
    this.app.use('/api', limiter);

    // Request logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('dev'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timeout
    this.app.use((req, res, next) => {
      req.setTimeout(30000);
      next();
    });
  }

  setupRoutes() {
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Student Rideshare API is running!',
        version: this.apiVersion,
        timestamp: new Date().toISOString()
      });
    });

    // API base endpoint for discovery
    this.app.get(this.apiBasePath, (req, res) => {
      res.json({
        success: true,
        message: `Student Rideshare API ${this.apiVersion}`,
        endpoints: [
          `${this.apiBasePath}/health`,
          `${this.apiBasePath}/requests`,
          `${this.apiBasePath}/votes`,
          `${this.apiBasePath}/users`
        ]
      });
    });

    // API health check
    this.app.get(`${this.apiBasePath}/health`, (req, res) => {
      res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: this.apiVersion
      });
    });

    // API routes
    this.app.use(`${this.apiBasePath}/requests`, requestRoutes);
    this.app.use(`${this.apiBasePath}/votes`, voteRoutes);
    this.app.use(`${this.apiBasePath}/users`, userRoutes);

    // Development-only admin routes
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
        message: 'Route not found'
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown handlers
    process.on('SIGTERM', this.shutdownGracefully.bind(this));
    process.on('SIGINT', this.shutdownGracefully.bind(this));
    
    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdownGracefully();
    });
  }

  async startServer() {
    try {
      // Initialize Firebase
      await initializeFirebase();
      
      // Start cleanup service
      cleanupService.start();
      
      // Start the server
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Rideshare server running on port ${this.port}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${this.port}${this.apiBasePath}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🛠️ Developer tools:`);
          console.log(`   - GET /admin/cleanup - Run manual cleanup`);
          console.log(`   - GET /admin/stats - View system statistics`);
        }
      });
      
    } catch (error) {
      console.error('🔥 Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdownGracefully() {
    console.log('\n🛑 Shutting down server gracefully...');
    
    // Close HTTP server
    if (this.server) {
      this.server.close(() => {
        console.log('🌐 HTTP server closed');
      });
    }
    
    // Stop cleanup service
    cleanupService.stop();
    
    // Close database connections
    const prisma = require('./config/database');
    await prisma.$disconnect();
    console.log('💾 Database connection closed');
    
    process.exit(0);
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new RideShareServer();
  server.startServer();
}

module.exports= RideShareServer;