const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const { validateUser, validateFilter } = require('../middleware/validation');
router.use(auth);

 //GET /users/profile - View your profile
 
router.get('/profile', userCtrl.getProfile);


 //PUT /users/profile - Update your profile

router.put('/profile',
  validateUser,
  handleErrors,
  userCtrl.updateProfile
);


 //DELETE /users/account - Delete your account
 
router.delete('/account', userCtrl.deleteUser);

 // GET /users/stats - Your ride statistics

router.get('/stats', userCtrl.getUserStats);

module.exports = router;
