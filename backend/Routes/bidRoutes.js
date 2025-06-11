// backend/routes/bidRoutes.js
const express = require('express');
const router = express.Router();
const Bid = require('../Models/Bids');

// POST /api/bids — Submit a bid
router.post('/', async (req, res) => {
  try {
    const { assignment, expert, bidAmount, deliveryTime, note } = req.body;

    const newBid = new Bid({
      assignment,
      expert,
      bidAmount,
      deliveryTime,
      note,
    });

    await newBid.save();
    res.status(201).json(newBid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bids/:assignmentId — View bids for assignment
router.get('/:assignmentId', async (req, res) => {
  try {
    const bids = await Bid.find({ assignment: req.params.assignmentId })
      .populate('expert', 'name rating')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
