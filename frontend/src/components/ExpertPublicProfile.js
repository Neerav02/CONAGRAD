import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../config/api';
import './ExpertPublicProfile.css';
// import io from 'socket.io-client'; // Uncomment when backend is ready

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const ExpertPublicProfile = () => {
  const { expertId } = useParams();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  // const [socket, setSocket] = useState(null); // For real-time chat
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const res = await axiosInstance.get(`/expert/experts/${expertId}`);
        setExpert({
          ...res.data,
          // Add mock data for new fields if not present
          rating: res.data.rating || 4.8,
          completedAssignments: res.data.completedAssignments || 27,
          joinDate: res.data.joinDate || '2023-01-15',
          avatarUrl: res.data.avatarUrl || '',
        });
      } catch (err) {
        setError('Failed to fetch expert details.');
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [expertId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Real-time chat setup (uncomment when backend is ready)
  // useEffect(() => {
  //   const s = io('http://localhost:4000');
  //   setSocket(s);
  //   s.on('chatMessage', (msg) => {
  //     setChatMessages((prev) => [...prev, msg]);
  //   });
  //   return () => s.disconnect();
  // }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    // For now, just add the message locally. Integrate with backend for real chat.
    setChatMessages([...chatMessages, { sender: 'You', text: chatInput, time: new Date().toLocaleTimeString() }]);
    setChatInput('');
    // socket?.emit('chatMessage', { sender: 'You', text: chatInput });
  };

  if (loading) return <div>Loading expert profile...</div>;
  if (error) return <div>{error}</div>;
  if (!expert) return <div>Expert not found.</div>;

  return (
    <div className="expert-public-profile-page" style={{ fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      <div className="expert-profile-header">
        <div className="expert-avatar">
          {expert.avatarUrl ? (
            <img src={expert.avatarUrl} alt={expert.name} />
          ) : (
            <span className="expert-avatar-initials">{getInitials(expert.name)}</span>
          )}
        </div>
        <div>
          <h2>{expert.name} <span className="username">@{expert.username}</span></h2>
          <div className="expert-rating-row">
            <span className="expert-rating">⭐ {expert.rating}</span>
            <span className="expert-completed">• {expert.completedAssignments} completed</span>
            <span className="expert-join-date">• Joined {new Date(expert.joinDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="expert-profile-details">
        <p><strong>Email:</strong> {expert.email}</p>
        <p><strong>Bio:</strong> {expert.bio || 'No bio provided.'}</p>
        <p><strong>Expertise:</strong> {Array.isArray(expert.expertise) ? expert.expertise.join(', ') : expert.expertise || 'N/A'}</p>
        <p><strong>Education:</strong> {expert.education || 'N/A'}</p>
        <p><strong>Experience:</strong> {expert.experience || 'N/A'}</p>
      </div>
      <hr className="expert-profile-divider" />
      <div className="expert-chat-section">
        <div className="expert-chat-title">Chat with {expert.name}</div>
        <div className="expert-chat-messages">
          {chatMessages.length === 0 ? (
            <div style={{ color: '#888' }}>No messages yet. Start the conversation!</div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className={`expert-chat-message${msg.sender === 'You' ? ' you' : ''}`}>
                <div className="expert-chat-sender">{msg.sender} <span style={{ fontSize: '0.8em', color: '#bbb' }}>{msg.time}</span>:</div>
                <div className="expert-chat-bubble">{msg.text}</div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="expert-chat-input-row">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type your message..."
            className="expert-chat-input"
            style={{ fontFamily: 'inherit' }}
          />
          <button type="submit" className="expert-chat-send-btn">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ExpertPublicProfile; 