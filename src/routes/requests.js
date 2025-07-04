const express = require('express');
const router = express.Router();
const reqCtrl = require('../controllers/requestController');
const { auth } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const { validateReq, validateSearch } = require('../middleware/validation');

/**
 * Ride Request Routes
 * 
 * What you can do:
 * - Post a ride request
 * - Find rides going your way
 * - Manage your own requests
 * - View request details and who wants to join
 */

// Everyone needs to be logged in
router.use(auth);
router.post('/', 
  validateReq,
  handleErrors,
  reqCtrl.createRequest
);
router.put('/:id',
  validateReq,
  handleErrors,
  reqCtrl.updateRequest
);
router.delete('/:id', reqCtrl.deleteRequest);
/**
 * GET /requests/search - Find rides
 * Look for rides that match your route and time
 */
router.get('/search',
  validateSearch,
  handleErrors,
  reqCtrl.searchRequests
);

/**
 * GET /requests/all - Browse all rides
 * See all available ride requests
 */
router.get('/all', reqCtrl.getAllRequests);

/**
 * GET /requests/my-requests - Your requests
 * See all your posted ride requests
 */
router.get('/my-requests', reqCtrl.getUserRequests);

/**
 * GET /requests/:id - View request details
 * See full details and who wants to join
 */
router.get('/:id', reqCtrl.getRequestById);

module.exports = router;
