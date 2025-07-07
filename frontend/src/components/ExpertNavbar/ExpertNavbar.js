import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ExpertNavbar.css'; // Create this CSS file

const ExpertNavbar = () => {
  const navigate = useNavigate();
  const [expertName, setExpertName] = useState(localStorage.getItem('expertName') || 'Expert');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('expertToken');
      try {
        const res = await axios.get('/api/expert/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpertName(res.data.name);
      } catch (error) {
        console.error('Error fetching expert profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('expertToken');
    localStorage.removeItem('expertUsername');
    localStorage.removeItem('expertName');
    localStorage.removeItem('expertEmail');
    localStorage.removeItem('expertId');
    navigate('/expert-login');
  };

  return (
    <nav className="expert-navbar">
      <div className="navbar-brand">
        <h2>CONAGRAD Expert</h2>
      </div>
      <div className="navbar-menu">
        <ul className="navbar-nav">
          <li className="nav-item">
            <button onClick={() => navigate('/expert-dashboard')} className="nav-link">
              Dashboard
            </button>
          </li>
          <li className="nav-item">
            <button onClick={() => navigate('/your-work')} className="nav-link">
              Your Work
            </button>
          </li>
          <li className="nav-item">
            <button onClick={() => navigate('/expert-profile')} className="nav-link">
              Profile
            </button>
          </li>
        </ul>
      </div>
      <div className="navbar-user">
        <span className="user-name">Welcome, {expertName}</span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default ExpertNavbar;