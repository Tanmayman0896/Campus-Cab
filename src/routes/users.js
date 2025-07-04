const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const { validateUser, validateFilter } = require('../middleware/validation');

/**
 * User Routes - Manage your profile and account
 * 
 * What you can do:
 * - View and update your profile
 * - See your ride statistics
 * - Delete your account
 */

// Everyone needs to be logged in
router.use(auth);

/**
 * GET /users/profile - View your profile
 * See your account details
 */
router.get('/profile', userCtrl.getProfile);

/**
 * PUT /users/profile - Update your profile
 * Change your name, phone, course, etc.
 */
router.put('/profile',
  validateUser,
  handleErrors,
  userCtrl.updateProfile
);

/**
 * DELETE /users/account - Delete your account
 * Permanently remove your account and data
 */
router.delete('/account', userCtrl.deleteUser);

/**
 * GET /users/stats - Your ride statistics
 * See how many rides you've posted and joined
 */
router.get('/stats', userCtrl.getUserStats);

module.exports = router;
