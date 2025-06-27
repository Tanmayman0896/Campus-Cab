const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { authenticateUser } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { voteValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateUser);

// Vote on a request
router.post('/:requestId',
  voteValidation,
  handleValidationErrors,
  voteController.voteOnRequest
);

// Get votes for a specific request (request owner only)
router.get('/request/:requestId', voteController.getRequestVotes);

// Get user's own votes
router.get('/my-votes', voteController.getUserVotes);

// Delete user's vote
router.delete('/:requestId', voteController.deleteVote);

module.exports = router;
