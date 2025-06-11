import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaArrowLeft, FaUser, FaFile, FaClock, FaStar } from 'react-icons/fa';
import { axiosInstance, API_ENDPOINTS } from '../config/api';
import ReviewForm from './ReviewForm';
import './AssignmentDetails.css';

const AssignmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [expertDetails, setExpertDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [submission, setSubmission] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');

    const fetchAssignmentDetails = useCallback(async () => {
        try {
            const assignmentRes = await axiosInstance.get(`/student/assignments/${id}`);
            setAssignment(assignmentRes.data);
        } catch (error) {
            setError('Failed to fetch assignment details');
            console.error('Error fetching assignment details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const checkReviewStatus = useCallback(async () => {
        if (assignment?.status === 'completed' && assignment?.expertId) {
            try {
                const response = await axiosInstance.get(
                    API_ENDPOINTS.GET_ASSIGNMENT_REVIEWS(id)
                );
                const reviews = response.data;
                setHasReviewed(reviews.length > 0);
            } catch (error) {
                console.error('Error checking review status:', error);
            }
        }
    }, [id, assignment]);

    const fetchSubmission = async () => {
        try {
            const response = await axiosInstance.get(`/student/assignments/${id}/submission`);
            setSubmission(response.data);
        } catch (error) {
            console.error('Failed to load submission:', error);
        }
    };

    useEffect(() => {
        fetchAssignmentDetails();
        fetchSubmission();
    }, [fetchAssignmentDetails]);

    useEffect(() => {
        if (assignment) {
            checkReviewStatus();
        }
    }, [assignment, checkReviewStatus]);

    useEffect(() => {
        if (assignment && assignment.status === 'approved' && !assignment.reviewed) {
            setShowReviewForm(true);
        }
    }, [assignment]);

    const handleDownloadExpertDocument = async () => {
        if (!submission || !submission.fileUrl || !submission.fileName) {
            setError('Submission file information is missing for download.');
            return;
        }
        try {
            setDownloading(true);
            const response = await axiosInstance.get(submission.fileUrl, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', submission.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setError(null);
        } catch (error) {
            setError('Failed to download expert document. Please try again.');
            console.error('Error downloading expert document:', error);
        } finally {
            setDownloading(false);
        }
    };

    const handleReviewSubmitted = () => {
        setHasReviewed(true);
        setShowReviewForm(false);
    };
    
    const handleStarClick = (star) => setRating(star);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError('');
        setReviewSuccess('');
        if (rating < 1 || rating > 5) {
            setReviewError('Please select a rating between 1 and 5 stars.');
            return;
        }
        try {
            await axiosInstance.post(API_ENDPOINTS.SUBMIT_REVIEW, {
                assignmentId: assignment._id,
                expertId: assignment.acceptedBidId ? assignment.acceptedBidId.expertId : assignment.expertId,
                rating,
                review: reviewText,
            });
            setReviewSuccess('Thank you for your feedback!');
            setShowReviewForm(false);
        } catch (error) {
            setReviewError(error.response?.data?.error || 'Failed to submit review.');
        }
    };

    const handleApprove = async () => {
        await axiosInstance.post(`/student/assignments/${id}/approve`);
        fetchAssignmentDetails();
        fetchSubmission();
    };

    const handleRequestRevision = async () => {
        await axiosInstance.post(`/student/assignments/${id}/request-revision`);
        fetchAssignmentDetails();
        fetchSubmission();
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!assignment) return <div className="error">Assignment not found</div>;

    return (
        <div className="assignment-details">
            <div className="header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Back
                </button>
                <h1>{assignment.title}</h1>
            </div>

            <div className="content">
                <div className="assignment-info">
                    <h2>Assignment Details</h2>
                    <p>{assignment.description}</p>
                    <p><strong>Status:</strong> {assignment.status}</p>
                    <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                </div>

                {/* Display Accepted Bid and Expert Details */}
                {assignment.status !== 'pending' && assignment.acceptedBidId && assignment.acceptedBidId.expertId && (
                    <div className="accepted-bid-details">
                        <h3>Assigned Expert Details</h3>
                        <p><strong>Expert:</strong> {assignment.acceptedBidId.expertId.name || assignment.acceptedBidId.expertId.username}</p>
                        <p><strong>Accepted Bid Amount:</strong> ${assignment.acceptedBidId.amount}</p>
                        {/* You might want to add more expert details here, like email, ratings, etc. */}
                    </div>
                )}

                {/* Expert Submission Review Section */}
                {(assignment.status === 'submitted' || assignment.status === 'to be reviewed') && submission && (
                    <div className="submission-review-section">
                        <h3>Review Submitted Work</h3>

                        {reviewError && (
                            <div className="review-error">
                                <span>{reviewError}</span>
                            </div>
                        )}

                        {reviewSuccess && (
                            <div className="review-success">
                                <span>{reviewSuccess}</span>
                            </div>
                        )}

                        <div className="submitted-document-preview">
                            <h4>Submitted File:</h4>
                            {submission.fileUrl ? (
                                <iframe 
                                    src={submission.fileUrl} 
                                    width="100%" 
                                    height="400px" 
                                    title="Expert Submission Preview"
                                    style={{ border: 'none', borderRadius: '8px' }}
                                ></iframe>
                            ) : (
                                <p>No file preview available.</p>
                            )}
                            {submission.fileName && (
                                <p>File: <strong>{submission.fileName}</strong> ({Math.round(submission.fileSize / 1024)} KB)</p>
                            )}
                            <button
                                className={`download-button ${downloading ? 'downloading' : ''}`}
                                onClick={handleDownloadExpertDocument}
                                disabled={downloading}
                            >
                                <FaDownload /> {downloading ? 'Downloading...' : 'Download Submitted File'}
                            </button>
                        </div>
                        
                        <div className="expert-notes">
                            <h4>Expert's Notes:</h4>
                            <p>{submission.note || 'No notes provided by the expert.'}</p>
                        </div>

                        <div className="review-actions">
                            <button className="approve-button" onClick={handleApprove}>Approve Submission</button>
                            <button className="request-revision-button" onClick={handleRequestRevision}>Request Revision</button>
                        </div>
                    </div>
                )}

                {assignment.status === 'completed' && expertDetails && (
                    <div className="expert-info">
                        <h2>Expert Information</h2>
                        <div className="expert-profile">
                            <FaUser className="expert-icon" />
                            <div>
                                <p><strong>Name:</strong> {expertDetails.expertDetails.name}</p>
                                <p><strong>Email:</strong> {expertDetails.expertDetails.email}</p>
                                <p><strong>Expertise:</strong> {expertDetails.expertDetails.expertise}</p>
                            </div>
                        </div>

                        <div className="expert-message">
                            <h3>Expert's Message</h3>
                            <p>{expertDetails.message}</p>
                        </div>

                        {expertDetails.document && (
                            <div className="expert-document">
                                <h3>Expert's Document</h3>
                                <div className="document-info">
                                    <FaFile className="file-icon" />
                                    <div>
                                        <p>{expertDetails.document.fileName}</p>
                                        <p>{Math.round(expertDetails.document.fileSize / 1024)} KB</p>
                                    </div>
                                    <button
                                        className={`download-button ${downloading ? 'downloading' : ''}`}
                                        onClick={handleDownloadExpertDocument}
                                        disabled={downloading}
                                    >
                                        <FaDownload />
                                        {downloading ? 'Downloading...' : 'Download'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="completion-info">
                            <FaClock className="clock-icon" />
                            <p>
                                <strong>Completed on:</strong>{' '}
                                {new Date(expertDetails.completionDate).toLocaleString()}
                            </p>
                        </div>
                        
                        {/* Review Section */}
                        <div className="review-section">
                            {!hasReviewed ? (
                                !showReviewForm ? (
                                    <button 
                                        className="review-btn" 
                                        onClick={() => setShowReviewForm(true)}
                                    >
                                        <FaStar /> Rate This Assignment
                                    </button>
                                ) : (
                                    <div className="review-form-section">
                                        <h3>Rate Your Expert</h3>
                                        <form onSubmit={handleReviewSubmit}>
                                            <div className="star-rating">
                                                {[1,2,3,4,5].map(star => (
                                                    <span
                                                        key={star}
                                                        className={star <= rating ? 'star filled' : 'star'}
                                                        onClick={() => handleStarClick(star)}
                                                        style={{ cursor: 'pointer', fontSize: '2rem', color: star <= rating ? '#FFD700' : '#ccc' }}
                                                    >&#9733;</span>
                                                ))}
                                            </div>
                                            <textarea
                                                value={reviewText}
                                                onChange={e => setReviewText(e.target.value)}
                                                placeholder="Leave feedback (optional)"
                                                rows={3}
                                                style={{ width: '100%', marginTop: '1rem' }}
                                            />
                                            {reviewError && <div className="error-message">{reviewError}</div>}
                                            {reviewSuccess && <div className="success-message">{reviewSuccess}</div>}
                                            <button type="submit" style={{ marginTop: '1rem' }}>Submit Review</button>
                                        </form>
                                    </div>
                                )
                            ) : (
                                <div className="review-submitted">
                                    <p>Thank you for your feedback!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentDetails;