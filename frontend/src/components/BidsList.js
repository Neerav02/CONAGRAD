import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../config/api';
import { FaUser, FaDollarSign, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import './BidsList.css';

// Define API_ENDPOINTS if not imported from elsewhere
const API_ENDPOINTS = {
    ACCEPT_BID: (assignmentId, bidId) => `/student/assignments/${assignmentId}/accept-bid/${bidId}`
};

const BidsList = ({ assignmentId, onBidAccepted, initialBids = [] }) => {
    const [bids, setBids] = useState(initialBids);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // Added missing success state
    const [expandedBids, setExpandedBids] = useState(new Set());
    const [processingBids, setProcessingBids] = useState(new Set());
    
    const navigate = useNavigate(); // Added missing navigate hook

    useEffect(() => {
        if (initialBids.length === 0) {
            fetchBids();
        } else {
            setBids(initialBids);
        }
    }, [assignmentId, initialBids]);

    const fetchBids = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axiosInstance.get(`/student/assignments/${assignmentId}/bids`);
            setBids(response.data || []);
            
        } catch (error) {
            console.error('Error fetching bids:', error);
            if (error.response?.status === 404) {
                setError('Assignment not found or you do not have permission to view its bids.');
            } else {
                setError('Failed to load bids. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleBidDetails = (bidId) => {
        const newExpanded = new Set(expandedBids);
        if (newExpanded.has(bidId)) {
            newExpanded.delete(bidId);
        } else {
            newExpanded.add(bidId);
        }
        setExpandedBids(newExpanded);
    };

    const handleAcceptBid = async (bidId) => {
        setProcessingBids((prev) => new Set([...prev, bidId]));
        setError(''); // Clear any previous errors
        setSuccess(''); // Clear any previous success messages
        
        try {
            const response = await axiosInstance.post(
                API_ENDPOINTS.ACCEPT_BID(assignmentId, bidId)
            );
            
            setSuccess(`Bid accepted successfully! The expert has been notified.`);
            
            // Update local state to reflect the change
            const acceptedBid = bids.find(bid => bid._id === bidId);
            if (acceptedBid && acceptedBid.expertId) {
                // Store expert details in localStorage for persistence
                localStorage.setItem(`assignment_${assignmentId}_expert`, JSON.stringify({
                    id: acceptedBid.expertId._id,
                    name: acceptedBid.expertId.name || acceptedBid.expertId.username,
                    email: acceptedBid.expertId.email
                }));
            }
            
            // Notify parent component
            if (onBidAccepted) {
                onBidAccepted(response.data.assignment);
            }
            
            // Redirect to assignment details page after short delay
            setTimeout(() => {
                navigate(`/assignment/${assignmentId}`);
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to accept bid. Please try again.');
        } finally {
            setProcessingBids((prev) => {
                const newSet = new Set(prev);
                newSet.delete(bidId);
                return newSet;
            });
        }
    };

    const handleRejectBid = async (bidId) => {
        if (!window.confirm('Are you sure you want to reject this bid? This action cannot be undone.')) {
            return;
        }

        try {
            setProcessingBids(prev => new Set(prev).add(bidId));
            
            await axiosInstance.post(`/student/assignments/${assignmentId}/reject-bid/${bidId}`);
            
            // Remove the rejected bid from the list
            setBids(prevBids => prevBids.filter(bid => bid._id !== bidId));
            
            // Remove from expanded if it was expanded
            setExpandedBids(prev => {
                const newSet = new Set(prev);
                newSet.delete(bidId);
                return newSet;
            });
            
        } catch (error) {
            console.error('Error rejecting bid:', error);
            alert(error.response?.data?.error || 'Failed to reject bid. Please try again.');
        } finally {
            setProcessingBids(prev => {
                const newSet = new Set(prev);
                newSet.delete(bidId);
                return newSet;
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="bids-container">
                <h3>Assignment Bids</h3>
                <div className="bids-loading">
                    <div className="spinner"></div>
                    <p>Loading bids...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bids-container">
            <h3>Assignment Bids ({bids.length})</h3>
            
            {error && (
                <div className="bids-error">
                    <span>{error}</span>
                    <button onClick={fetchBids}>Retry</button>
                </div>
            )}
            
            {success && (
                <div className="bids-success">
                    <span>{success}</span>
                </div>
            )}
            
            {bids.length === 0 ? (
                <div className="no-bids">
                    <p>No bids have been submitted for this assignment yet.</p>
                    <p>Experts will be able to view and bid on your assignment once it's posted.</p>
                </div>
            ) : (
                <div className="bids-list">
                    {bids.map((bid) => {
                        const isExpanded = expandedBids.has(bid._id);
                        const isProcessing = processingBids.has(bid._id);
                        
                        return (
                            <div key={bid._id} className="bid-card">
                                {isProcessing && (
                                    <div className="processing-overlay">
                                        <div className="spinner"></div>
                                        <p>Processing...</p>
                                    </div>
                                )}
                                
                                <div className="bid-header">
                                    <div className="expert-info">
                                        <FaUser />
                                        <span>
                                            {bid.expertId?.name || bid.expertId?.username || 'Expert'}
                                        </span>
                                    </div>
                                    <div className="bid-amount">
                                        <FaDollarSign />
                                        <span>{formatCurrency(bid.amount)}</span>
                                    </div>
                                </div>

                                <div className="bid-preview">
                                    <p>
                                        {bid.proposal?.length > 150 
                                            ? `${bid.proposal.substring(0, 150)}...`
                                            : bid.proposal
                                        }
                                    </p>
                                    
                                    {bid.proposal?.length > 150 && (
                                        <button 
                                            className="view-details-btn"
                                            onClick={() => toggleBidDetails(bid._id)}
                                        >
                                            <FaEye /> {isExpanded ? 'Hide Details' : 'View Full Details'}
                                        </button>
                                    )}
                                </div>

                                {isExpanded && bid.proposal?.length > 150 && (
                                    <div className="bid-details">
                                        <p>{bid.proposal}</p>
                                    </div>
                                )}

                                {bid.timeline && (
                                    <div className="bid-timeline">
                                        <strong>Estimated Timeline:</strong> {bid.timeline}
                                    </div>
                                )}

                                <div className="bid-timestamp">
                                    Submitted on {formatDate(bid.submittedAt || bid.createdAt)}
                                </div>

                                <div className="bid-actions">
                                    <button
                                        className="accept-btn"
                                        onClick={() => handleAcceptBid(bid._id)}
                                        disabled={isProcessing}
                                    >
                                        <FaCheck /> Accept Bid
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleRejectBid(bid._id)}
                                        disabled={isProcessing}
                                    >
                                        <FaTimes /> Reject Bid
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BidsList;