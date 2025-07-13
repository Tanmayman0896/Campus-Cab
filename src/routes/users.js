const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

// No middleware - direct access

 //GET /users/profile - View your profile
 
router.get('/profile', userCtrl.getProfile);


 //PUT /users/profile - Update your profile

router.put('/profile', userCtrl.updateProfile);


 //DELETE /users/account - Delete your account
 
router.delete('/account', userCtrl.deleteUser);

 // GET /users/stats - Your ride statistics

router.get('/stats', userCtrl.getUserStats);

module.exports = router;
