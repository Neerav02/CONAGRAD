import React, { useState, useEffect } from 'react';
import { axiosInstance, API_ENDPOINTS } from '../config/api';
import { FaStar, FaUser, FaCalendarAlt } from 'react-icons/fa';
import './ExpertReviews.css';

const ExpertReviews = ({ expertId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_ENDPOINTS.GET_EXPERT_REVIEWS(expertId));
        setReviews(response.data);
      } catch (error) {
        setError('Failed to load reviews');
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [expertId]);

  if (loading) return <div className="loading">Loading reviews...</div>;
  if (error) return <div className="error">{error}</div>;
  if (reviews.length === 0) return <div className="no-reviews">No reviews yet</div>;

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="expert-reviews">
      <div className="reviews-summary">
        <div className="average-rating">
          <span className="rating-value">{averageRating.toFixed(1)}</span>
          <div className="stars">
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                className="star"
                color={index < Math.round(averageRating) ? "#ffc107" : "#e4e5e9"}
              />
            ))}
          </div>
          <span className="review-count">{reviews.length} reviews</span>
        </div>
      </div>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <FaUser className="user-icon" />
                <span className="reviewer-name">{review.student.name || review.student.username}</span>
              </div>
              <div className="review-date">
                <FaCalendarAlt className="calendar-icon" />
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="review-rating">
              {[...Array(5)].map((_, index) => (
                <FaStar
                  key={index}
                  className="star"
                  color={index < review.rating ? "#ffc107" : "#e4e5e9"}
                  size={16}
                />
              ))}
            </div>
            {review.comment && <p className="review-comment">{review.comment}</p>}
            <div className="review-assignment">
              <strong>Assignment:</strong> {review.assignment.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpertReviews;