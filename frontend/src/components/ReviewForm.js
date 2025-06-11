import React, { useState } from 'react';
import { axiosInstance, API_ENDPOINTS } from '../config/api';
import { FaStar } from 'react-icons/fa';
import './ReviewForm.css';

const ReviewForm = ({ assignmentId, expertId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get student ID from localStorage or context
      const studentId = localStorage.getItem('studentId');

      const response = await axiosInstance.post(API_ENDPOINTS.SUBMIT_REVIEW, {
        assignment: assignmentId,
        student: studentId,
        expert: expertId,
        rating,
        comment
      });

      setSuccess(true);
      setRating(0);
      setComment('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="review-form-container success">
        <h3>Thank you for your feedback!</h3>
        <p>Your review has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h3>Rate Your Experience</h3>
      <form onSubmit={handleSubmit}>
        <div className="rating-container">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <label key={index}>
                <input
                  type="radio"
                  name="rating"
                  value={ratingValue}
                  onClick={() => setRating(ratingValue)}
                />
                <FaStar
                  className="star"
                  color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                  size={30}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                />
              </label>
            );
          })}
        </div>
        <div className="form-group">
          <label htmlFor="comment">Comments (optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this expert..."
            rows={4}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;