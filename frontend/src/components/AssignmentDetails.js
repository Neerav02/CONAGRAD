import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaArrowLeft, FaUser, FaFile, FaStar } from 'react-icons/fa';
import { axiosInstance, API_ENDPOINTS } from '../config/api';
import ReviewForm from './ReviewForm';
import BidsList from './BidsList';
import './AssignmentDetails.css';

const AssignmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [expertDetails, setExpertDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [setShowReviewForm] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [submission, setSubmission] = useState(null);

    const fetchAssignmentDetails = useCallback(async () => {
        try {
            const assignmentRes = await axiosInstance.get(`/student/assignments/${id}`);
            setAssignment(assignmentRes.data);
            // Use populated expertId for expert details
            setExpertDetails(assignmentRes.data.expertId || null);
            // Fix: Use first submission object if array, else parse string, else use as object
            let submissionData = assignmentRes.data.submission;
            if (typeof submissionData === 'string') {
                try {
                    submissionData = JSON.parse(submissionData);
                } catch (e) {
                    submissionData = null;
                }
            }
            if (Array.isArray(submissionData) && submissionData.length > 0) {
                setSubmission(submissionData[0]);
            } else {
                setSubmission(submissionData || null);
            }
            console.log('Fetched Assignment:', assignmentRes.data);
            console.log('Fetched Submission:', assignmentRes.data.submission);
            console.log('Fetched Expert Details:', assignmentRes.data.expertId);
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

    useEffect(() => {
        fetchAssignmentDetails();
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
    
    const handleApprove = async () => {
        await axiosInstance.post(`/student/assignments/${id}/approve`);
        fetchAssignmentDetails();
    };

    const handleRequestRevision = async () => {
        await axiosInstance.post(`/student/assignments/${id}/request-revision`);
        fetchAssignmentDetails();
    };

    // Callback for when a bid is accepted in BidsList
    const handleBidAcceptedInList = () => {
        fetchAssignmentDetails(); // Always refetch after bid acceptance
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!assignment) return <div className="error">Assignment not found</div>;

    return (
        <div className="assignment-details-page">
            <div className="header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Back
                </button>
                <h1>{assignment.title}</h1>
            </div>

            <div className="assignment-content-wrapper">
                <div className="assignment-details-column">
                    <h2>Your Assignment</h2>
                    <div className="assignment-info-card">
                        <p><strong>Title:</strong> {assignment.title} <span className="status-badge">{assignment.status.toUpperCase()}</span></p>
                    <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        <p><strong>Budget:</strong> ${assignment.budget}</p>
                        <p><strong>Description:</strong> {assignment.description}</p>

                        {assignment.fileName && assignment.fileUrl && (
                            <div className="assignment-file">
                                <p>File: <strong>{assignment.fileName}</strong></p>
                                <a
                                    className="view-file-button"
                                    href={`http://localhost:4000${assignment.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FaFile /> View File
                                </a>
                            </div>
                        )}
                </div>
                </div>
                
                <div className="assignment-bids-column">
                    {/* Bids List: Only show if assignment is pending and no bid is accepted */}
                    {assignment.status === 'pending' && !assignment.acceptedBidId && (
                        <BidsList assignmentId={id} onBidAccepted={handleBidAcceptedInList} />
                    )}

                    {/* Right Panel: Dynamic content based on assignment status */}
                    {assignment.status !== 'pending' && (
                        <div className="expert-work-panel">
                            <h3>Work & Expert Details</h3>

                            {expertDetails && (
                                <div className="assigned-expert-info">
                                    <p><strong>Expert:</strong> {expertDetails.name || expertDetails.username}</p>
                                    {assignment.acceptedBidId && (
                                        <p><strong>Accepted Bid:</strong> ${assignment.acceptedBidId.amount}</p>
                                    )}
                                    <button 
                                        className="view-profile-button"
                                        onClick={() => navigate(`/profile/${expertDetails._id}`)}
                                    >
                                        <FaUser /> View Expert Profile
                                    </button>
                                </div>
                            )}
                            
                            {/* No Work Submitted Yet */}
                            {(assignment.status === 'in progress' && !submission) && (
                                <div className="no-work-submitted">
                                    <p>No work submitted yet by the expert.</p>
                                </div>
                            )}

                            {/* Expert Submission Review Section (when work is submitted) */}
                            {(assignment.status === 'submitted' || assignment.status === 'to be reviewed' || assignment.status === 'approved' || assignment.status === 'completed') && submission && (
                                <div className="submitted-work-details">
                                    <h4>Submitted File:</h4>
                                    {submission.fileUrl && submission.fileType === 'application/pdf' ? (
                                        <iframe 
                                            src={`http://localhost:4000${submission.fileUrl}`}
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
                                    <div className="expert-notes">
                                        <h4>Expert's Notes:</h4>
                                        <p>{submission.note || 'No notes provided by the expert.'}</p>
                                    </div>

                                    {(assignment.status === 'submitted' || assignment.status === 'to be reviewed') && (
                                        <div className="review-actions">
                                            <button className="approve-button" onClick={handleApprove}>Approve</button>
                                            <button className="request-revision-button" onClick={handleRequestRevision}>Request Revision</button>
                                        </div>
                                    )}

                                    {assignment.status === 'approved' && !hasReviewed && (
                                    <ReviewForm 
                                            assignmentId={assignment._id}
                                            expertId={expertDetails?._id || assignment.expertId} // Fallback to assignment.expertId if expertDetails somehow not available
                                        onReviewSubmitted={handleReviewSubmitted} 
                                    />
                                    )}
                                    {hasReviewed && assignment.status === 'approved' && (
                                        <div className="review-submitted-message">
                                            <p><FaStar /> You have successfully reviewed this assignment.</p>
                                        </div>
                                    )}
                                    {assignment.status === 'completed' && (
                                        <div className="review-submitted-message">
                                            <p><FaStar /> This assignment has been completed and reviewed.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    </div>
            </div>
        </div>
    );
};

export default AssignmentDetails;