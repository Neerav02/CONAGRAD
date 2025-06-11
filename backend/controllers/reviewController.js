exports.submitReview = async (req, res) => {
  const { assignmentId, expertId, rating, review } = req.body;
  if (!assignmentId || !expertId || !rating) {
    return res.status(400).json({ error: 'assignmentId, expertId, and rating are required.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }
  try {
    const newReview = new Review({
      assignmentId,
      expertId,
      rating,
      review: review || '',
      createdAt: new Date(),
    });
    await newReview.save();
    // Optionally, mark assignment as reviewed
    await Assignment.findByIdAndUpdate(assignmentId, { reviewed: true });
    res.json({ message: 'Review submitted successfully.' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
}; 