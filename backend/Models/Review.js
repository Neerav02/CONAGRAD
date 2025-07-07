// backend/Models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
