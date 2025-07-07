import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssignedAssignment.css'; // Create this CSS file

const AssignedAssignment = () => {
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    checkCurrentAssignment();
    const fetchAssignments = async () => {
      const token = localStorage.getItem('expertToken');
      try {
        const res = await axios.get('/api/expert/assignments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments(res.data);
      } catch (error) {
        console.error('Error fetching expert assignments:', error);
      }
    };
    fetchAssignments();
  }, []);

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
    } finally {
      setLoading(false);
    }
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
      setSubmissionFile(null);
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading current assignment...</div>;
  }

  if (!currentAssignment) {
    return null; // Don't render anything if no current assignment
  }

  return (
    <div className="assigned-assignment-section">
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
              <a
                className="download-btn"
                href={`http://localhost:4000${currentAssignment.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          )}
        </div>
        
        {/* Submission Section */}
        <div className="submission-section">
          <h4>Submit Your Work</h4>
          <input
            type="file"
            onChange={(e) => setSubmissionFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.zip"
          />
          <button
            onClick={handleSubmitAssignment}
            disabled={!submissionFile}
            className="submit-btn"
          >
            Submit Assignment
          </button>
        </div>
      </div>

      {/* List of Assignments */}
      <div className="assignments-list">
        <h2>Your Assignments</h2>
        {assignments.map((assignment) => (
          <div key={assignment._id} className="assignment-card">
            <h3>{assignment.title}</h3>
            <div className="assignment-details">
              <p><i className="bx bx-user"></i> Student: {assignment.studentName}</p>
              <p><i className="bx bx-book"></i> Subject: {assignment.subject}</p>
              <p><i className="bx bx-calendar"></i> Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
              <p><i className="bx bx-text"></i> Description: {assignment.description}</p>
              {assignment.fileUrl && (
                <div className="file-section">
                  <i className="bx bx-file"></i>
                  <span>{assignment.fileName}</span>
                  <a
                    className="download-btn"
                    href={`http://localhost:4000${assignment.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedAssignment;