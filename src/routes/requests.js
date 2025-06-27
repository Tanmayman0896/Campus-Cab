const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateUser } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { createRequestValidation, searchRequestsValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateUser);

// Create new request
router.post('/', 
  createRequestValidation,
  handleValidationErrors,
  requestController.createRequest
);

// Search requests
router.get('/search',
  searchRequestsValidation,
  handleValidationErrors,
  requestController.searchRequests
);

// Get all requests (common request page)
router.get('/all', requestController.getAllRequests);

// Get user's own requests
router.get('/my-requests', requestController.getUserRequests);

// Get single request by ID
router.get('/:id', requestController.getRequestById);

// Update user's own request
router.put('/:id',
  createRequestValidation,
  handleValidationErrors,
  requestController.updateRequest
);

// Delete/cancel user's own request
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
