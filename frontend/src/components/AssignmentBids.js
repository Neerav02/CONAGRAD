import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance, API_ENDPOINTS } from '../config/api';
import DashboardLayout from './layouts/DashboardLayout';
import BidsList from './BidsList';
import { FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import './AssignmentBids.css';

// At the top of your file, add this import:
import axios from 'axios';

const AssignmentBids = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (id) {
            fetchAssignment();
        } else {
            setError('Invalid assignment ID');
            setLoading(false);
        }
    }, [id]);

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('Fetching assignment with ID:', id);
            
            // Use axiosInstance with the relative path
            const response = await axiosInstance.get(`/student/assignments/${id}`);
            
            console.log('Assignment data received:', response.data);
            setAssignment(response.data);
            
        } catch (error) {
            console.error('Error fetching assignment:', error);
            
            // Better error handling based on status codes
            if (error.response?.status === 404) {
                setError('Assignment not found. It may have been deleted or you may not have permission to view it.');
            } else if (error.response?.status === 403) {
                setError('You do not have permission to view this assignment.');
            } else if (error.response?.status === 401) {
                setError('Your session has expired. Please log in again.');
                // Redirect to login after a delay
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else if (error.response?.status >= 500) {
                setError('Server error occurred. Please try again later.');
            } else {
                setError('Failed to load assignment details. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBidAccepted = (updatedAssignment) => {
        setAssignment(updatedAssignment);
        setSuccess('Bid accepted successfully! The expert has been assigned to your assignment.');
        
        // Clear success message and redirect after 3 seconds
        setTimeout(() => {
            setSuccess('');
            navigate('/assignments');
        }, 3000);
    };

    const handleRetry = () => {
        setError('');
        fetchAssignment();
    };

    // Loading state
    if (loading) {
        return (
            <DashboardLayout>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading assignment details...</p>
                </div>
            </DashboardLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <DashboardLayout>
                <div className="error-container">
                    <p>{error}</p>
                    <div>
                        <button onClick={handleRetry} style={{ marginRight: '10px' }}>
                            Retry
                        </button>
                        <button onClick={() => navigate('/assignments')}>
                            Back to Assignments
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Assignment not found state
    if (!assignment) {
        return (
            <DashboardLayout>
                <div className="error-container">
                    <p>Assignment not found.</p>
                    <button onClick={() => navigate('/assignments')}>
                        Back to Assignments
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="assignment-bids-container">
                <div className="bids-header">
                    <button 
                        className="back-button" 
                        onClick={() => navigate('/assignments')}
                        type="button"
                    >
                        <FaArrowLeft /> Back to Assignments
                    </button>
                    <h2>Bids for Assignment</h2>
                </div>

                {success && (
                    <div className="success-message">
                        <p>{success}</p>
                    </div>
                )}

                <div className="assignment-summary">
                    <div className="summary-header">
                        <FaFileAlt className="file-icon" />
                        <h3>{assignment.title}</h3>
                    </div>
                    
                    {assignment.description && (
                        <p className="assignment-description">{assignment.description}</p>
                    )}
                    
                    <div className="assignment-meta">
                        <span>
                            Status: <strong style={{ 
                                color: assignment.status === 'pending' ? '#ffc107' : 
                                       assignment.status === 'assigned' ? '#28a745' : '#6c757d' 
                            }}>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </strong>
                        </span>
                        <span>
                            Submitted: <strong>
                                {new Date(assignment.submittedDate).toLocaleDateString()}
                            </strong>
                        </span>
                        {assignment.dueDate && (
                            <span>
                                Due: <strong>
                                    {new Date(assignment.dueDate).toLocaleDateString()}
                                </strong>
                            </span>
                        )}
                        {assignment.bids && (
                            <span>
                                Bids: <strong>{assignment.bids.length}</strong>
                            </span>
                        )}
                    </div>
                </div>

                {assignment.status === 'pending' ? (
                    <BidsList 
                        assignmentId={assignment._id} 
                        onBidAccepted={handleBidAccepted}
                        initialBids={assignment.bids || []}
                    />
                ) : (
                    <div className="bids-unavailable">
                        <p>
                            This assignment is no longer accepting bids as it has been {assignment.status}.
                            {assignment.acceptedBidId && assignment.acceptedBidId.expertId && (
                                <>
                                    <span> An expert has been assigned to work on this assignment.</span>
                                    <div className="accepted-expert-details">
                                        <h4>Assigned Expert:</h4>
                                        <p><strong>Name:</strong> {assignment.acceptedBidId.expertId.name || assignment.acceptedBidId.expertId.username}</p>
                                        <p><strong>Bid Amount:</strong> ${assignment.acceptedBidId.amount}</p>
                                        {/* You can add more expert details here if they are populated */}
                                        {/* <p><strong>Expert Email:</strong> {assignment.acceptedBidId.expertId.email}</p> */}
                                    </div>
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AssignmentBids;