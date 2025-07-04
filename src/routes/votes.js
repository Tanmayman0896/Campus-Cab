const express = require('express');
const router = express.Router();
const voteCtrl = require('../controllers/voteController');
const { auth } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const { validateVote } = require('../middleware/validation');
// Everyone needs to be logged in
router.use(auth);
//POST /votes/:requestId - Vote on a ride

router.post('/:requestId',
  validateVote,
  handleErrors,
  voteCtrl.vote
);


 // DELETE /votes/:requestId - Remove your vote
 
router.delete('/:requestId', voteCtrl.deleteVote);

 //GET /votes/request/:requestId - See who wants to join your ride
 
router.get('/request/:requestId', voteCtrl.getRequestVotes);


 //GET /votes/my-votes - Your votes
router.get('/my-votes', voteCtrl.getUserVotes);

module.exports = router;
