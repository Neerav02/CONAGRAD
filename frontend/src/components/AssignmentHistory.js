import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, axiosInstance } from '../config/api';
import DashboardLayout from './layouts/DashboardLayout';
import { FaHistory, FaCheck, FaClock, FaDownload, FaEye, FaArrowLeft, FaComments } from 'react-icons/fa';
import './AssignmentHistory.css';

const AssignmentHistory = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      // Use axiosInstance for consistency
      const response = await axiosInstance.get('/student/assignments');
      setAssignments(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch assignments');
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl, fileName, assignmentId) => {
    if (!fileUrl || !fileName) {
      setError('File information is missing');
      return;
    }

    try {
      setDownloadingId(assignmentId);
      setDownloadProgress(0);
      setError('');
      
      // Consistent URL handling - try multiple approaches
      let downloadUrl;
      
      if (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('uploads/')) {
        // Direct file access
        downloadUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      } else {
        // Use the download endpoint with filename
        const filename = fileUrl.split('/').pop();
        downloadUrl = `/student/download/${filename}`;
      }
      
      const response = await axiosInstance.get(downloadUrl, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(progress);
        }
      });
      
      // Create and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'download-success';
      successMessage.textContent = 'Download completed successfully!';
      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1000;
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      
      // If the first approach fails, try alternative approaches
      if (error.response?.status === 404) {
        try {
          // Try alternative URL construction
          let alternativeUrl;
          if (fileUrl.includes('/uploads/')) {
            // Try without /uploads/ prefix
            const filename = fileUrl.split('/').pop();
            alternativeUrl = `/student/download/${filename}`;
          } else {
            // Try with /uploads/ prefix
            alternativeUrl = `/uploads/${fileUrl}`;
          }
          
          const response = await axiosInstance.get(alternativeUrl, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setDownloadProgress(progress);
            }
          });
          
          // Same download logic as above
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          const successMessage = document.createElement('div');
          successMessage.className = 'download-success';
          successMessage.textContent = 'Download completed successfully!';
          successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
          `;
          document.body.appendChild(successMessage);
          setTimeout(() => successMessage.remove(), 3000);
          
        } catch (secondError) {
          console.error('Second download attempt failed:', secondError);
          setError('File not found on the server. Please contact support.');
        }
      } else {
        setError('Failed to download file. Please try again.');
      }
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleViewDetails = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-assigned';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading assignments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="assignment-history-container">
        <div className="history-header">
          <div className="history-header-content">
            <h2><FaHistory /> Assignment History</h2>
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                All Assignments
              </button>
              <button 
                className={filter === 'completed' ? 'active' : ''} 
                onClick={() => setFilter('completed')}
              >
                <FaCheck /> Completed
              </button>
              <button 
                className={filter === 'pending' ? 'active' : ''} 
                onClick={() => setFilter('pending')}
              >
                <FaClock /> Pending
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError('')}>Dismiss</button>
            {error.includes('download') && (
              <button onClick={() => handleDownload(selectedAssignment?.fileUrl, selectedAssignment?.fileName, selectedAssignment?._id)}>
                Try Again
              </button>
            )}
          </div>
        )}

        {downloadingId && (
          <div className="download-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <p>{downloadProgress}% Downloaded</p>
          </div>
        )}

        {filteredAssignments.length === 0 ? (
          <div className="no-assignments">
            <p>No {filter !== 'all' ? filter : ''} assignments found.</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {filteredAssignments.map((assignment) => (
              <div key={assignment._id} className="assignment-card">
                <div className="card-header">
                  <h3>{assignment.title}</h3>
                  <div className={`status-badge ${getStatusColor(assignment.status)}`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </div>
                </div>
                <div className="card-content">
                  <p>{assignment.description}</p>
                  <p className="submission-date">
                    Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="card-actions">
                  <button 
                    className="view-button"
                    onClick={() => handleViewDetails(assignment._id)}
                  >
                    <FaEye /> View Details
                  </button>
                  {assignment.bids && assignment.bids.length > 0 && (
                    <button 
                      className="bids-button"
                      onClick={() => navigate(`/assignments/${assignment._id}/bids`)}
                    >
                      <FaComments /> View Bids ({assignment.bids.length})
                    </button>
                  )}
                  <button 
                    className="download-button"
                    onClick={() => handleDownload(assignment.fileUrl, assignment.fileName, assignment._id)}
                    disabled={downloadingId === assignment._id}
                  >
                    <FaDownload /> 
                    {downloadingId === assignment._id ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssignmentHistory;