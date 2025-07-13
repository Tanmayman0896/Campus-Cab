const express = require('express');
const router = express.Router();
const voteCtrl = require('../controllers/voteController');

// No middleware - direct access
//POST /votes/:requestId - Vote on a ride

router.post('/:requestId', voteCtrl.vote);
 // DELETE /votes/:requestId - Remove your vote
 
router.delete('/:requestId', voteCtrl.deleteVote);

 //GET /votes/request/:requestId - See who wants to join your ride
 
router.get('/request/:requestId', voteCtrl.getRequestVotes);


 //GET /votes/my-votes - Your votes
router.get('/my-votes', voteCtrl.getUserVotes);

module.exports = router;
