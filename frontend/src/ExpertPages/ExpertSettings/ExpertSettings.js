import React, { useState } from 'react';
import './ExpertSettings.css';
import ExpertNavbar from "../../components/ExpertNavbar/ExpertNavbar.js";

const ToggleSwitch = ({ checked, onChange, id }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} id={id} />
    <span className="slider" />
  </label>
);

const ExpertSettings = () => {
  // State
  const [notifications, setNotifications] = useState({ email: true, push: false, sms: false });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [appearance, setAppearance] = useState('light');
  const [language, setLanguage] = useState('en');

  // Handlers
  const handleNotificationToggle = (type) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  };
  const handleAppearanceToggle = () => {
    setAppearance(prev => (prev === 'light' ? 'dark' : 'light'));
  };
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    setPasswordMsg('Password changed successfully!');
    setTimeout(() => setPasswordMsg(''), 2000);
    setPasswords({ current: '', new: '', confirm: '' });
    setShowPasswordModal(false);
  };

  // Save button (for demo, just shows alert)
  const handleSave = () => {
    alert('Settings saved!');
  };

  return (
    <div className='expert-settings-container'>
        <ExpertNavbar/>
        <div className='expert-settings-content'>
            <div className='settings-header-row'>
                <h2>Settings</h2>
                <button className='save-btn' onClick={handleSave}>Save Changes</button>
            </div>

            {/* Notification card */}
            <div className='settings-card'>
                <h3>Notification</h3> 
                <div className='setting-row'>
                    <span>Email Notification</span>
                    <ToggleSwitch checked={notifications.email} onChange={()=>handleNotificationToggle('email')} className="toggle-switch" id="email-toggle"/>
                </div>
                <div className='setting-row'>
                    <span>Push Notification</span>
                    <ToggleSwitch checked={notifications.push} onChange={()=>handleNotificationToggle('push')} className="toggle-switch" id="push-toggle"/>
                </div>
                <div className='setting-row'>
                    <span>SMS Notification</span>
                    <ToggleSwitch checked={notifications.sms} onChange={()=>handleNotificationToggle('sms')} className="toggle-switch" id="sms-toggle"/>
                </div>
            </div>

            {/* Privacy */}
            <div className='settings-card'>
                <h3>Privacy</h3>
                <div className='setting-row'>
                    <span>Change Password</span>
                    <button className='change-password-btn' onClick={()=>setShowPasswordModal(true)}>Change</button>
                </div>
            </div>

            {/* Customization */}
            <div className='settings-card'>
                <h3>Customization</h3>
                <div className='setting-row'>
                    <span>Appearance</span>
                    <div className="appearance-toggle-group">
                        <button
                            className={appearance === 'light' ? 'appearance-btn selected' : 'appearance-btn'}
                            onClick={() => setAppearance('light')}
                            type="button"
                        >Light</button>
                        <button
                            className={appearance === 'dark' ? 'appearance-btn selected' : 'appearance-btn'}
                            onClick={() => setAppearance('dark')}
                            type="button"
                        >Dark</button>
                    </div>
                </div>
                <div className='setting-row'>
                    <span>Language</span>
                    <select value={language} onChange={handleLanguageChange} className="settings-select">
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h4>Change Password</h4>
                    <form className="modal-form" onSubmit={handlePasswordSubmit}>
                        <input type="password" name="current" placeholder="Current Password" value={passwords.current} onChange={handlePasswordChange} required />
                        <input type="password" name="new" placeholder="New Password" value={passwords.new} onChange={handlePasswordChange} required />
                        <input type="password" name="confirm" placeholder="Confirm New Password" value={passwords.confirm} onChange={handlePasswordChange} required />
                        {passwordMsg && <div className="modal-msg">{passwordMsg}</div>}
                        <div className="modal-actions">
                            <button type="submit" className="modal-save-btn">Save</button>
                            <button type="button" className="modal-cancel-btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            )}
        </div>
    </div>
  );
};

export default ExpertSettings;
