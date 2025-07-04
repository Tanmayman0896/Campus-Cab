const express = require('express');
const router = express.Router();
const voteCtrl = require('../controllers/voteController');
const { auth } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const { validateVote } = require('../middleware/validation');

/**
 * Vote Routes - Join rides or decline requests
 * 
 * What you can do:
 * - Vote to join someone's ride (with optional message)
 * - See who wants to join your rides
 * - Manage your votes
 */

// Everyone needs to be logged in
router.use(auth);
/**
 * POST /votes/:requestId - Vote on a ride
 * Say yes or no to joining someone's ride
 * You can add a message like "I'll be at the main gate!"
 */
router.post('/:requestId',
  validateVote,
  handleErrors,
  voteCtrl.vote
);

/**
 * DELETE /votes/:requestId - Remove your vote
 * Change your mind about a ride
 */
router.delete('/:requestId', voteCtrl.deleteVote);

/**
 * GET /votes/request/:requestId - See who wants to join your ride
 * View all votes on your ride request (with their messages)
 */
router.get('/request/:requestId', voteCtrl.getRequestVotes);

/**
 * GET /votes/my-votes - Your votes
 * See all rides you've voted on
 */
router.get('/my-votes', voteCtrl.getUserVotes);

module.exports = router;
