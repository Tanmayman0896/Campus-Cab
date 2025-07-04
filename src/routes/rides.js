const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Everyone needs to be logged in
router.use(auth);

/**
 * GET /rides - See all available rides
 * Browse rides offered by others
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Rides retrieved successfully',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get rides',
      error: error.message
    });
  }
});

/**
 * GET /rides/:id - View ride details
 * See full details of a specific ride
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: 'Ride retrieved successfully',
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get ride',
      error: error.message
    });
  }
});

/**
 * POST /rides - Offer a ride
 * Post a ride you're offering to others
 */
router.post('/', auth, async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create ride',
      error: error.message
    });
  }
});

/**
 * PUT /rides/:id - Update your ride
 * Change details of your ride offer
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: 'Ride updated successfully',
      data: { id, ...req.body }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update ride',
      error: error.message
    });
  }
});

/**
 * DELETE /rides/:id - Cancel your ride
 * Remove your ride offer
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: 'Ride cancelled successfully',
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ride',
      error: error.message
    });
  }
});

module.exports = router;
