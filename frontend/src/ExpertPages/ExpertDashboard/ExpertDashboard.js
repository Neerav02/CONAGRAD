import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../ExpertDashboard/ExpertDashboard.css";
import ExpertNavbar from "../../components/ExpertNavbar/ExpertNavbar.js";
import AssignedAssignment from "../../components/Expert/AssignedAssignment/AssignedAssignment.js";

const ExpertDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [viewedAssignment, setViewedAssignment] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidError, setBidError] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('expertToken');
    if (!token) {
      navigate('/expert-login');
      return;
    }
    fetchAssignments();
    checkCurrentAssignment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('expertToken');
      if (!token) {
        navigate('/expert-login');
        return;
      }
      const response = await axios.get('http://localhost:4000/available-assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignments(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentAssignment = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      if (!token) return;

      const response = await axios.get('http://localhost:4000/expert/current-assignment', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentAssignment(response.data);
    } catch (error) {
      console.error('Error checking current assignment:', error);
    }
  };

  const handleAcceptAssignment = async (assignmentId) => {
    try {
      if (currentAssignment) {
        setError('You already have an active assignment. Please complete it first.');
        return;
      }

      const token = localStorage.getItem('expertToken');
      const response = await axios.post(
        `http://localhost:4000/accept-assignment/${assignmentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentAssignment(response.data.assignment);
      fetchAssignments();
    } catch (err) {
      setError('Failed to accept assignment');
    }
  };

  const handleViewAssignment = (assignment) => {
    setViewedAssignment(assignment);
  };

  const getUniqueSubjects = () => {
    const subjects = assignments.map(assignment => assignment.subject || 'Not specified');
    return ['all', ...new Set(subjects)];
  };

  const handleSubmitAssignment = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      const formData = new FormData();
      formData.append('file', submissionFile);
      formData.append('assignmentId', currentAssignment._id);
  
      await axios.post('http://localhost:4000/submit-assignment', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setCurrentAssignment(null);
      fetchAssignments();
      setActiveTab('history');
    } catch (error) {
      setError('Failed to submit assignment');
    }
  };

  const handleSubmitBid = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      setBidError(null); // Clear previous bid error
      const response = await axios.post(
        `http://localhost:4000/submit-bid/${viewedAssignment._id}`,
        {
          amount: bidAmount,
          message: bidMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowBidForm(false);
        setBidAmount('');
        setBidMessage('');
        setViewedAssignment(null);
      }
    } catch (err) {
      setBidError('Failed to submit bid');
    }
  };

  return (
    <div className="dashboard-container">
      <ExpertNavbar />
      <AssignedAssignment/>
      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <h2>Available Assignments</h2>
          <div className="filter-section">
            <select 
              value={subjectFilter} 
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="subject-filter"
            >
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* {currentAssignment && (
          <div className="current-assignment-section">
            <div className="dashboard-header">
              <h2>Current Assignment</h2>
              <span className="status-badge status-assigned">In Progress</span>
            </div>
            <div className="current-assignment-card">
              <h3>{currentAssignment.title}</h3>
              <div className="assignment-details">
                <p><i className="bx bx-user"></i> Student: {currentAssignment.studentName}</p>
                <p><i className="bx bx-book"></i> Subject: {currentAssignment.subject}</p>
                <p><i className="bx bx-calendar"></i> Due: {new Date(currentAssignment.dueDate).toLocaleDateString()}</p>
                <p><i className="bx bx-text"></i> Description: {currentAssignment.description}</p>
                {currentAssignment.fileUrl && (
                  <div className="file-section">
                    <i className="bx bx-file"></i>
                    <span>{currentAssignment.fileName}</span>
                    <button
                      className="download-btn"
                      onClick={() => window.open(`http://localhost:4000${currentAssignment.fileUrl}`, '_blank')}
                    >
                      Download
                    </button> 
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}

{viewedAssignment && (
        <div className="assignment-modal">
          <div className="assignment-modal-content">
            <button className="close-btn" onClick={() => {
              setViewedAssignment(null);
              setShowBidForm(false);
              setBidAmount('');
              setBidMessage('');
              setBidError(null);
            }}>×</button>
            <h2>{viewedAssignment.title}</h2>
            <div className="assignment-details">
              <p><i className="bx bx-user"></i> Student: {viewedAssignment.studentName || 'Anonymous'}</p>
              <p><i className="bx bx-book"></i> Subject: {viewedAssignment.subject || 'Not specified'}</p>
              <p><i className="bx bx-calendar"></i> Due: {viewedAssignment.dueDate ? new Date(viewedAssignment.dueDate).toLocaleDateString() : 'No deadline'}</p>
              <p><i className="bx bx-text"></i> Description: {viewedAssignment.description}</p>
              {viewedAssignment.fileUrl && (
                <div className="file-section">
                  <i className="bx bx-file"></i>
                  <span className="file-name-dark">{viewedAssignment.fileName}</span>
                  <button
                    className="download-btn"
                    onClick={() => window.open(`http://localhost:4000${viewedAssignment.fileUrl}`, '_blank')}
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="modal-actions">
              {!showBidForm ? (
                <button 
                  className="bid-btn"
                  onClick={() => setShowBidForm(true)}
                >
                  Place Bid
                </button>
              ) : (
                <div className="bid-form">
                  <div className="bid-input-group">
                    <label>Bid Amount ($)</label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter your bid amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="bid-input-group">
                    <label>Message to Student</label>
                    <textarea
                      value={bidMessage}
                      onChange={(e) => setBidMessage(e.target.value)}
                      placeholder="Enter a message for the student"
                      rows="4"
                    />
                  </div>
                  {bidError && (
                    <div className="bid-error-message">{bidError}</div>
                  )}
                  <div className="bid-form-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setShowBidForm(false);
                        setBidAmount('');
                        setBidMessage('');
                        setBidError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="submit-bid-btn"
                      onClick={handleSubmitBid}
                      disabled={!bidAmount || !bidMessage}
                    >
                      Send Bid
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={fetchAssignments} className="retry-btn">
              <i className="bx bx-refresh"></i> Retry
            </button>
          </div>
        ) : assignments.length === 0 ? (
          <div className="no-assignments">
            <i className="bx bx-calendar-x"></i>
            <p>No assignments available at the moment</p>
          </div>
        ) : (
          <>
            <div className="assignments-grid">
              {assignments
                .filter(assignment => 
                  subjectFilter === 'all' || 
                  (assignment.subject || 'Not specified') === subjectFilter
                )
                .map((assignment) => (
                  <div key={assignment._id} className="assignment-card">
                    <h3>{assignment.title}</h3>
                    <div className="assignment-details">
                      <p><i className="bx bx-user"></i> Student: {assignment.studentName || 'Anonymous'}</p>
                      <p><i className="bx bx-book"></i> Subject: {assignment.subject || 'Not specified'}</p>
                      <p><i className="bx bx-calendar"></i> Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}</p>
                    </div>
                    <button
                      className="view-btn"
                      onClick={() => handleViewAssignment(assignment)}
                    >
                      View Assignment
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default ExpertDashboard;