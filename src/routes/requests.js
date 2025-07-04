const express = require('express');
const router = express.Router();
const reqCtrl = require('../controllers/requestController');
const { auth } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const { validateReq, validateSearch } = require('../middleware/validation');

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
 */
router.get('/search',
  validateSearch,
  handleErrors,
  reqCtrl.searchRequests
);

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
