import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExpertNavbar from "../../components/ExpertNavbar/ExpertNavbar.js";
import './ExpertHistory.css';

const ExpertHistory = () => {
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedAssignments();
  }, []);

  const fetchCompletedAssignments = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      const response = await axios.get('http://localhost:4000/expert/completed-assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletedAssignments(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch completed assignments');
      setLoading(false);
    }
  };

  return (
    <div className="history-container">
      <ExpertNavbar />
      <div className="history-content">
        <h2>History</h2>
        
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={fetchCompletedAssignments} className="retry-btn">
              Retry
            </button>
          </div>
        ) : completedAssignments.length === 0 ? (
          <div className="no-history">
            No completed assignments yet
          </div>
        ) : (
          <div className="history-grid">
            {completedAssignments.map((assignment) => (
              <div key={assignment._id} className="history-card">
                <div className="card-header">
                  <h3>{assignment.title}</h3>
                  <span className="completion-date">
                    Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="assignment-details">
                  <p><i className="bx bx-user"></i> Student: {assignment.studentName}</p>
                  <p><i className="bx bx-book"></i> Subject: {assignment.subject}</p>
                  <p><i className="bx bx-calendar"></i> Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  <p><i className="bx bx-check-circle"></i> Status: Completed</p>
                  <p><i className="bx bx-text"></i> Description: {assignment.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertHistory;