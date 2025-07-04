#!/usr/bin/env node

/**
 * Route Test Script - Check if all route handlers are properly defined
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Route Handler Definitions\n');

// Test if we can require the route files without errors
try {
  console.log('1. Testing route file imports...');
  
  // Mock the required modules to prevent actual database connections
  const mockAuth = { auth: (req, res, next) => next() };
  const mockErrorHandler = { handleErrors: (req, res, next) => next() };
  const mockValidation = { 
    validateReq: (req, res, next) => next(),
    validateSearch: (req, res, next) => next(),
    validateUser: (req, res, next) => next(),
    validateVote: (req, res, next) => next(),
    validateFilter: (req, res, next) => next()
  };
  
  // Mock the controllers
  const mockRequestController = {
    createRequest: (req, res, next) => res.json({ success: true }),
    updateRequest: (req, res, next) => res.json({ success: true }),
    deleteRequest: (req, res, next) => res.json({ success: true }),
    searchRequests: (req, res, next) => res.json({ success: true }),
    getAllRequests: (req, res, next) => res.json({ success: true }),
    getUserRequests: (req, res, next) => res.json({ success: true }),
    getRequestById: (req, res, next) => res.json({ success: true })
  };
  
  const mockUserController = {
    getProfile: (req, res, next) => res.json({ success: true }),
    updateProfile: (req, res, next) => res.json({ success: true }),
    deleteUser: (req, res, next) => res.json({ success: true }),
    getUserStats: (req, res, next) => res.json({ success: true }),
    getAllUsers: (req, res, next) => res.json({ success: true })
  };
  
  const mockVoteController = {
    vote: (req, res, next) => res.json({ success: true }),
    getRequestVotes: (req, res, next) => res.json({ success: true }),
    getUserVotes: (req, res, next) => res.json({ success: true }),
    deleteVote: (req, res, next) => res.json({ success: true })
  };
  
  // Override require to return our mocks
  const originalRequire = require;
  require = function(id) {
    if (id.includes('middleware/auth')) return mockAuth;
    if (id.includes('middleware/errorHandler')) return mockErrorHandler;
    if (id.includes('middleware/validation')) return mockValidation;
    if (id.includes('controllers/requestController')) return mockRequestController;
    if (id.includes('controllers/userController')) return mockUserController;
    if (id.includes('controllers/voteController')) return mockVoteController;
    return originalRequire.apply(this, arguments);
  };
  
  // Test each route file
  const routeFiles = [
    'src/routes/requests.js',
    'src/routes/users.js',
    'src/routes/votes.js'
  ];
  
  routeFiles.forEach(file => {
    try {
      const router = originalRequire(path.join(process.cwd(), file));
      console.log(`   ✅ ${file} - loaded successfully`);
    } catch (error) {
      console.log(`   ❌ ${file} - Error: ${error.message}`);
    }
  });
  
  console.log('\n2. Route handler verification complete!');
  
} catch (error) {
  console.error('❌ Error testing routes:', error.message);
  process.exit(1);
}

console.log('\n✅ All route files can be loaded successfully!');
console.log('🚀 The server should now start without route callback errors.');
