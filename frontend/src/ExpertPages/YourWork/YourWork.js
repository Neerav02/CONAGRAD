import React, { useState } from 'react'
import './YourWork.css'
import ExpertNavbar from '../../components/ExpertNavbar/ExpertNavbar'
import { Calendar, CheckCircle, Clock, File, FileText, FileTextIcon, Send, SendIcon, Upload, User, X } from 'lucide-react'

const YourWork = () => {
    const [workDescription, setWorkDescription] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // Sample assignment data - replace with actual data
    const assignmentFile = {
        fileName: "Assignment_Instructions.pdf",
        fileUrl: "/uploads/assignment_instructions.pdf"
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            file: file
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const files = Array.from(event.dataTransfer.files);
        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            file: file
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (fileId) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Here you would typically send the data to your backend
        console.log('Submitting work:', {
            description: workDescription,
            files: uploadedFiles
        });
        setIsSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setWorkDescription('');
            setUploadedFiles([]);
        }, 3000);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className='your-work-container'>
            <ExpertNavbar />
            <div className='your-work-content'>
                <div className='your-work-header'>
                    <h2>Your Work</h2>
                </div>
                <div className='your-work-body'>
                    {/* Assignment Info */}
                    <div className='assignment-info'>
                        <div className='assignment-header'>
                            <div className='assignment-title'>
                                <div className='assignment-icon'>
                                    <FileText className='icon' />
                                </div>
                                <div className='title'>
                                    <h2>Assignment_name</h2>
                                    <div className='student-name'>
                                        <User className='user-icon' />
                                        <span>Student_name</span>
                                    </div>
                                </div>
                            </div>
                            <div className='assignment-status'>Status</div>
                        </div>
                        {/* Details */}
                        <div className='details-grid'>
                            <div className="detail-card due-date-card">
                                <div className="detail-header">
                                    <Calendar className="detail-icon" />
                                    <h4>Due Date</h4>
                                </div>
                                <div className="detail-content">
                                    March 15, 2024 at 11:59 PM
                                    <div className="time-remaining">
                                        <Clock className="clock-icon" />
                                        <span>5 days left</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Description */}
                        <div className='description'>
                            <h3><FileTextIcon size={20} />Description</h3>
                            <div className='description-text'>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                Sed non risus. Suspendisse lectus tortor, dignissim sit amet,
                                adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.
                                Mauris iaculis porttitor diam.
                            </div>
                        </div>
                        {/* File Section */}
                        <div className="file-section">
                            <File className="file-icon-section" />
                            <span className="file-name-dark">{assignmentFile.fileName}</span>
                            <button
                                className="download-btn"
                                onClick={() => window.open(`http://localhost:4000${assignmentFile.fileUrl}`, '_blank')}
                            >
                                View
                            </button>
                        </div>
                    </div>
                    {/* Submission-section */}
                    <div className='submission-section'>
                        <div className='submission-header'>
                            <div className='submission-icon'>
                                <Send className='icon' />
                            </div>
                            <h3>Submit Your Work</h3>
                        </div>
                        {isSubmitted ? (
                            <div className='success-message'>
                                <CheckCircle className='success-icon' />
                                Work submitted successfully!
                            </div>
                        ) : (
                            <form className='submission-form' onSubmit={handleSubmit}>
                                <div className='form-group'>
                                    <label className='work-form-label'>Notes</label>
                                    <textarea
                                        className="workform-textarea"
                                        placeholder="Describe your work or any notes you have for the student."
                                        value={workDescription}
                                        onChange={(e) => setWorkDescription(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className='form-group'>
                                    <label className="work-form-label">Upload Files</label>
                                    <div
                                        className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('file-input').click()}
                                    >
                                        <Upload className="upload-icon" />
                                        <div className="upload-text">
                                            Click to upload or drag and drop files here
                                        </div>
                                        <div className="upload-hint">
                                            Supported formats: .zip, .js, .jsx, .html, .css, .pdf, .md
                                        </div>
                                        <input
                                            id="file-input"
                                            type="file"
                                            className="file-input"
                                            multiple
                                            accept=".zip,.js,.jsx,.html,.css,.pdf,.md,.txt,.json"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                    {uploadedFiles.length > 0 && (
                                        <div className="uploaded-files">
                                            {uploadedFiles.map((file) => (
                                                <div key={file.id} className="uploaded-file">
                                                    <div className="file-info">
                                                        <File className="file-icon" />
                                                        <span>{file.name}</span>
                                                        <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                                            ({formatFileSize(file.size)})
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="remove-file"
                                                        onClick={() => removeFile(file.id)}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={!workDescription.trim()}
                                >
                                    <SendIcon className="submit-icon" />Submit Work
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default YourWork