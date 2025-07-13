const express = require('express');
const router = express.Router();
const reqCtrl = require('../controllers/requestController');

// No middleware - direct access
router.post('/', reqCtrl.createRequest);
router.put('/:id', reqCtrl.updateRequest);
router.delete('/:id', reqCtrl.deleteRequest);
/**
 * GET /requests/search - Find rides
 */
router.get('/search', reqCtrl.searchRequests);

/**
 * GET /requests/all - Browse all rides
 */
router.get('/all', reqCtrl.getAllRequests);

/**
 * GET /requests/my-requests - Your requests
 */
router.get('/my-requests', reqCtrl.getUserRequests);

/**
 * GET /requests/:id - View request details
 */
router.get('/:id', reqCtrl.getRequestById);

module.exports = router;
