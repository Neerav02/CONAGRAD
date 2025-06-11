import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../../config/api';
import { FaUser, FaGraduationCap, FaBriefcase, FaStar } from 'react-icons/fa';
import ExpertReviews from '../../ExpertReviews';
import './ExpertProfile.css';

const ExpertProfile = () => {
    const [expertData, setExpertData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchExpertProfile = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get('/expert/profile');
                setExpertData(response.data);
            } catch (error) {
                setError('Failed to load profile data');
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpertProfile();
    }, []);

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!expertData) return <div className="error">Profile not found</div>;

    return (
        <div className="expert-profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {previewImage ? (
                        <img src={previewImage} alt="Profile" />
                    ) : (
                        <div className="avatar-placeholder">
                            <FaUser />
                        </div>
                    )}
                </div>
                <div className="profile-info">
                    <h1>{expertData.name}</h1>
                    <p className="username">@{expertData.username}</p>
                    <p className="email">{expertData.email}</p>
                    <p className="rating">Rating: {expertData.rating || '4.5'}/5</p>
                </div>
            </div>

            <div className="profile-sections">
                <div className="profile-section">
                    <h2>Expertise</h2>
                    <div className="expertise-tags">
                        {expertData.expertise ? (
                            expertData.expertise.map((skill, index) => (
                                <span key={index} className="expertise-tag">{skill}</span>
                            ))
                        ) : (
                            <p>No expertise listed</p>
                        )}
                    </div>
                </div>

                <div className="profile-section">
                    <h2>Education</h2>
                    <div className="education-item">
                        <FaGraduationCap className="section-icon" />
                        <div>
                            <h3>{expertData.education?.degree || 'Master of Science'}</h3>
                            <p>{expertData.education?.institution || 'University of Technology'}</p>
                            <p>{expertData.education?.year || '2020'}</p>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h2>Experience</h2>
                    <div className="experience-item">
                        <FaBriefcase className="section-icon" />
                        <div>
                            <h3>{expertData.experience?.title || 'Senior Developer'}</h3>
                            <p>{expertData.experience?.company || 'Tech Solutions Inc.'}</p>
                            <p>{expertData.experience?.duration || '2018 - Present'}</p>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h2>Reviews</h2>
                    <ExpertReviews expertId={expertData._id} />
                </div>
            </div>
        </div>
    );
};

export default ExpertProfile;