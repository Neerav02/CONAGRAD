import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserCircle, FaEnvelope, FaPhone, FaUniversity, FaGraduationCap, FaBriefcase, FaAward } from 'react-icons/fa';
import './ExpertProfile.css';
import ExpertNavbar from "../../components/ExpertNavbar/ExpertNavbar.js";

const ExpertProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [userData, setUserData] = useState({
    username: localStorage.getItem('expertUsername') || 'Expert Username',
    name: localStorage.getItem('expertName') || 'Expert Name',
    email: localStorage.getItem('expertEmail') || 'Expert Email',
    phone: localStorage.getItem('expertPhone') || 'Not Added',
    education: localStorage.getItem('expertEducation') || 'Not Added',       // Changed from 'xxxx'
    expertise: JSON.parse(localStorage.getItem('expertExpertise')) || ['General'],
    bio: localStorage.getItem('expertBio') || 'No bio yet',
    experience: localStorage.getItem('expertExperience') || ''
  });
  const [editedData, setEditedData] = useState({ ...userData });
  const [newExpertise, setNewExpertise] = useState('');
  const [predefinedExpertise] = useState([
    'Biology',
    'Chemistry',
    'Mathematics',
    'Computer Science',
    'Development',
    'Physics',
    'Engineering',
    'Medicine',
    'Law',
    'Business',
    'Arts',
    'Humanities',
    'Social Sciences',
    'Other'
  ]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const savedName = localStorage.getItem('name');
    const savedEmail = localStorage.getItem('email');
    
    if (savedName && savedEmail) {
      setUserData(prev => ({
        ...prev,
        name: savedName,
        email: savedEmail
      }));
      setEditedData(prev => ({
        ...prev,
        name: savedName,
        email: savedEmail
      }));
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // TODO: Add API call here to send editedData to your backend
      // Example: const response = await fetch('/api/expert/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editedData)
      // });
      // const result = await response.json();
      // Handle API response (e.g., check for errors)

      // Update local state and localStorage after successful API call (or for localStorage only)
      setUserData(editedData);
      localStorage.setItem('expertName', editedData.name);
      localStorage.setItem('expertBio', editedData.bio);
      localStorage.setItem('expertExpertise', JSON.stringify(editedData.expertise));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim() !== '') {
      if (predefinedExpertise.includes(newExpertise.trim())) {
        setEditedData(prev => ({
          ...prev,
          expertise: [...prev.expertise, newExpertise.trim()]
        }));
      } else {
        setEditedData(prev => ({
          ...prev,
          expertise: [...prev.expertise, `Custom: ${newExpertise.trim()}`]
        }));
      }
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (index) => {
    setEditedData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="expert-profile-container">
      <ExpertNavbar/>
      <div className="expert-profile-content">
        <div className="profile-header-row">
          <h2>Profile</h2>
          {isEditing ? (
            <button className="save-btn" onClick={handleSave}>Save Changes</button>
          ) : (
            <button className="edit-btn" onClick={handleEdit}>Edit Profile</button>
          )}
        </div>
        <div className="profile-section">
          <div className="profile-section col1">
            <img src={`${process.env.PUBLIC_URL}/default-profile.jpg`} alt="Profile" className="profile-image" />
            <h3 className="profile-name">{userData.username}</h3>
            <p className="rating">Rating: 4.5/5</p>
            <p className="assignment-count">Assignments Completed: 100</p>
          </div>
          <div className="profile-section col2">
            <h3 className='personal-info'>Personal Information</h3>
            <div className='info-item name'>
              <p className='info-item-heading'>Name: </p>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editedData.name}
                  onChange={handleInputChange}
                  className="info-item-value"
                />
              ) : (
                <p className='info-item-value'>{userData.name}</p>
              )}
            </div>
            <div className='info-item email'>
              <p className='info-item-heading'>Email: </p>
              <p className='info-item-value'>{userData.email}</p>
            </div>
            <div className='info-item bio'>
              <p className='info-item-heading'>Bio: </p>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editedData.bio}
                  onChange={handleInputChange}
                  className="info-item-value"
                />
              ) : (
                <p className='info-item-value'>{userData.bio}</p>
              )}
            </div>
            <div className='info-item expertise'>
              <p className='info-item-heading'>Areas of Expertise: </p>
              <div className='expertise-tags'>
                {(isEditing ? editedData.expertise : userData.expertise).map((topic, index) => (
                  <span key={index} className="expertise-tag">
                    {topic}
                    {isEditing && (
                      <button
                        className="remove-expertise-btn"
                        onClick={() => handleRemoveExpertise(index)}
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="add-expertise">
                  <select
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    className="new-expertise-select"
                  >
                    <option value="">Select an expertise</option>
                    {predefinedExpertise.map((expertise) => (
                      <option key={expertise} value={expertise}>
                        {expertise}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Or type a custom expertise"
                    className="new-expertise-input"
                  />
                  <button className="add-expertise-btn" onClick={handleAddExpertise}>
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfile;