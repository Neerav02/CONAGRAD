// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const Review = require('../Models/Review');
const Expert = require('../Models/Expert');
const Assignment = require('../Models/Assignment');
const authMiddleware = require('../middleware/auth');

// POST /api/reviews - Submit a review
router.post('/', async (req, res) => {
  try {
    const { assignment, student, expert, rating, comment } = req.body;

    // Validate input
    if (!assignment || !student || !expert || !rating) {
      return res.status(400).json({ error: 'Assignment ID, student ID, expert ID, and rating are required' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ assignment, student });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this assignment' });
    }

    const review = new Review({
      assignment,
      student,
      expert,
      rating,
      comment
    });

    await review.save();

    // Update expert's average rating
    const expertReviews = await Review.find({ expert });
    const totalRating = expertReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / expertReviews.length;

    await Expert.findByIdAndUpdate(expert, { rating: averageRating.toFixed(1) });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/assignment/:id - Get reviews for an assignment
router.get('/assignment/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ assignment: req.params.id })
      .populate('student', 'name username')
      .populate('expert', 'name username')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/expert/:id - Get reviews for an expert
router.get('/expert/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ expert: req.params.id })
      .populate('student', 'name username')
      .populate('assignment', 'title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
