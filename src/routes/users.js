const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { updateUserValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateUser);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile',
  updateUserValidation,
  handleValidationErrors,
  userController.updateProfile
);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Delete user account
router.delete('/account', userController.deleteAccount);

module.exports = router;
