import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS, axiosInstance } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes } from 'react-icons/fa';
import './StudentUpload.css';
import DashboardLayout from './layouts/DashboardLayout';  
import { toast } from 'react-hot-toast';

const StudentUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('No file selected');
  const [assignment, setAssignment] = useState(null);
  const [budget, setBudget] = useState('');
  const [success, setSuccess] = useState('');

  // List of available subjects
  const availableSubjects = [
    'Mathematics', 
    'Physics', 
    'Chemistry', 
    'Biology', 
    'Computer Science',
    'English',
    'History',
    'Geography',
    'Economics',
    'Business Studies',
    'Psychology',
    'Sociology',
    'Political Science',
    'Philosophy',
    'Engineering',
    'Medicine',
    'Law',
    'Arts'
  ];

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        setError('Only PDF, DOC, and DOCX files are allowed');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(''); // Clear any previous errors
    }
  };

  const toggleSubjectDropdown = () => {
    setShowSubjectDropdown(!showSubjectDropdown);
  };

  const handleSubjectSelect = (subject) => {
    if (!selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
    setShowSubjectDropdown(false); // Close dropdown after selection
  };

  const handleRemoveSubject = (subject) => {
    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate budget
    if (parseFloat(budget) < 12) {
      setError('Budget must be at least $12.');
      return;
    }

    // Validate file size (100 MB = 100 * 1024 * 1024 bytes)
    if (file && file.size < 100 * 1024 * 1024) {
      setError('File size must be at least 100 MB.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }
    
    if (!dueDate) {
      setError('Please select a due date');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subject', selectedSubjects.join(', '));
      formData.append('dueDate', dueDate);
      formData.append('budget', budget);

      console.log('Uploading to:', API_ENDPOINTS.UPLOAD_ASSIGNMENT);
      console.log('Form data:', {
        title: title.trim(),
        description: description.trim(),
        subject: selectedSubjects.join(', '),
        dueDate,
        fileName: file.name,
        budget
      });

      // Make sure we're using the correct endpoint
      const response = await axiosInstance.post(
        '/student/upload-assignment', // Use relative path, axiosInstance handles base URL
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout for file uploads
        }
      );

      if (response.data) {
        console.log('Upload successful:', response.data);
        setAssignment(response.data.assignment);
        setSuccess('Assignment uploaded successfully!');
        setTitle('');
        setDescription('');
        setFile(null);
        setBudget('');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Better error handling
      if (error.code === 'ECONNABORTED') {
        setError('Upload timeout. Please try again with a smaller file.');
      } else if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            `Server error: ${error.response.status}`;
        setError(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Something else happened
        setError('Failed to upload assignment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const acceptBid = async (bidId) => {
    try {
      const res = await axiosInstance.post('/api/assignments/accept-bid', {
        assignmentId: assignment._id,
        bidId,
      });
      setAssignment(res.data.assignment);
      toast.success('Bid accepted! Expert assigned.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept bid');
    }
  };

  const approveAssignment = async () => {
    await axiosInstance.post('/api/assignments/approve', { assignmentId: assignment._id });
    // update UI, show success
  };

  const requestRevision = async () => {
    const note = prompt('What needs to be changed?');
    await axiosInstance.post('/api/assignments/request-revision', { assignmentId: assignment._id, note });
    // update UI, show success
  };

  return (
    <DashboardLayout>
      <div className="student-upload-container">
        <div className="upload-card">
          <h2>Upload Assignment</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>1. Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter assignment title"
                maxLength={100}
              />
            </div>
            
            <div className="form-group">
              <label>2. Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Enter assignment description"
                rows="4"
                maxLength={500}
              />
            </div>
            
            <div className="form-group">
              <label>3. Subject *</label>
              <div className="subject-selector">
                <div className="selected-subjects">
                  {selectedSubjects.map(subject => (
                    <div key={subject} className="subject-tag">
                      {subject}
                      <button 
                        type="button" 
                        className="remove-subject" 
                        onClick={() => handleRemoveSubject(subject)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    className="subject-input"
                    placeholder={selectedSubjects.length ? "" : "Select subjects"}
                    onClick={toggleSubjectDropdown}
                    readOnly
                  />
                </div>
                {showSubjectDropdown && (
                  <div className="subject-dropdown">
                    {availableSubjects
                      .filter(subject => !selectedSubjects.includes(subject))
                      .map(subject => (
                        <div 
                          key={subject} 
                          className="subject-option"
                          onClick={() => handleSubjectSelect(subject)}
                        >
                          {subject}
                          <span className="add-subject"><FaPlus /></span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label>4. Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
              />
            </div>
            
            <div className="form-group">
              <label>5. Budget ($):</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                min={12}
              />
            </div>
            
            <div className="form-group file-upload">
              <label>6. Select File * (PDF, DOC, DOCX - Max 10MB)</label>
              <div className="file-input-container">
                <div className="file-name">{fileName}</div>
                <label className="file-input-label">
                  Browse
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    required
                    className="file-input"
                  />
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <motion.button
                type="submit"
                className="submit-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </motion.button>
              <motion.button
                type="button"
                className="cancel-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </motion.button>
            </div>
          </form>
          {assignment && assignment.status === 'submitted' && (
            <div className="submission-review">
              <h3>Submitted Work</h3>
              <a href={assignment.submission.fileUrl} target="_blank" rel="noopener noreferrer">
                View Submission
              </a>
              <p>Note: {assignment.submission.note}</p>
              <button onClick={approveAssignment}>Approve</button>
              <button onClick={requestRevision}>Request Revision</button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentUpload;