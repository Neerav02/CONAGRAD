import React from 'react';
import { Calendar, Clock, FileText, User, Eye } from 'lucide-react';
import './AssignedAssignment.css';
import { useNavigate } from 'react-router-dom'; // 🔹 Import useNavigate

const AssignedAssignment = () => {
  const navigate = useNavigate(); // 🔹 Initialize navigate

  const handleViewClick = () => {
    navigate('/your-work'); // 🔹 Redirect to /your-work
  };

  return (
    <div className='assigned-container'>
      <div className='assigned-header'>
        <h1>Assigned Assignment</h1>  
      </div>
      
      <div className='assigned-assignment-card'>
        {/* Assignment Header with View Button */}
        <div className="assignment-header">
          <div className="assignment-title-section">
            <div className="assignment-icon">
              <FileText className="icon" />
            </div>
            <div className="title-info">
              <h3>Assignment_name</h3>
              <div className="student-info">
                <User className="user-icon" />
                <span>Student_username</span>
              </div>
            </div>
          </div>
          
          {/* Header Actions - View Button and Status Badge */}
          <div className="header-actions">
            <button className='view-button' onClick={handleViewClick}>
              <Eye className="button-icon" />
              <span>View</span>
            </button>
            <span className="status-pending">Pending</span>
          </div>
        </div>

        {/* Assignment Details */}
        <div className='assign-details'>
          <div className="detail-item description-item">
            <div className="detail-content">
              <FileText className="detail-icon" />
              <div>
                <h4>Description</h4>
                <p>Complete the assigned tasks and submit your work before the deadline.</p>
              </div>
            </div>
          </div>

          <div className="detail-item due-date-item">
            <div className="detail-content">
              <Calendar className="detail-icon" />
              <div>
                <h4>Due Date</h4>
                <p>March 15, 2024</p>
              </div>
            </div>
            <div className="time-remaining">
              <Clock className="clock-icon" />
              <span>5 days left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedAssignment;
