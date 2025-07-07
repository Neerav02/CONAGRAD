import React, { useState } from "react";
import "./ExpertAuth.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "boxicons/css/boxicons.min.css";

// FIXED: Configure axios defaults
axios.defaults.baseURL = 'http://localhost:4000';
axios.defaults.withCredentials = true;

export default function ExpertAuth() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", username: "", password: "" });
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // FIXED: Enhanced login handler with better error handling
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Basic validation
    if (!loginData.username.trim() || !loginData.password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { username: loginData.username });
      
      const response = await axios.post("/expert/login", {
        username: loginData.username.trim(),
        password: loginData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login response:', response.data);

      // Store authentication data
      if (response.data.token) {
        localStorage.setItem('expertToken', response.data.token);
        localStorage.setItem('expertUsername', response.data.expert.username);
        localStorage.setItem('expertName', response.data.expert.name);
        localStorage.setItem('expertEmail', response.data.expert.email);
        localStorage.setItem('expertId', response.data.expert.id);
        
        // Set default authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setMessage("Login successful! Redirecting...");
        
        // Navigate after a short delay
        setTimeout(() => {
          navigate("/expert-dashboard");
        }, 1000);
      } else {
        setError("Login failed: No token received");
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // Server responded with error status
        setError(error.response.data?.error || "Login failed");
      } else if (error.request) {
        // Network error
        setError("Unable to connect to server. Please check if the server is running.");
      } else {
        // Other error
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced registration handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Basic validation
    if (!registerData.name.trim() || !registerData.email.trim() || 
        !registerData.username.trim() || !registerData.password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password validation
    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting registration with:", {
        name: registerData.name,
        email: registerData.email,
        username: registerData.username
      });

      const response = await axios.post("/expert/register", {
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        username: registerData.username.trim(),
        password: registerData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Registration response:", response.data);
      setMessage(response.data.message || "Registration successful!");
      
      // Clear form and switch to login
      setRegisterData({ name: "", email: "", username: "", password: "" });
      setTimeout(() => {
        setIsActive(false);
        setMessage("");
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.response) {
        setError(error.response.data?.error || "Registration failed");
      } else if (error.request) {
        setError("Unable to connect to server. Please check if the server is running.");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Clear messages when switching between forms
  const handleToggle = (active) => {
    setIsActive(active);
    setError("");
    setMessage("");
  };

  return (
    <div className={`container ${isActive ? "active" : ""}`}>
      {/* Login Section */}
      <div className="form-box login">
        <form onSubmit={handleLogin}>
          <h1>LOGIN</h1>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              required
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              disabled={loading}
            />
            <i className="bx bx-user"></i>
          </div>
          <div className="input-box">
            <input
              type="password"
              placeholder="Password"
              required
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              disabled={loading}
            />
            <i className="bx bx-lock-alt"></i>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <p>or login with social platforms</p>
          <div className="social-icons">
            <a href="#" onClick={(e) => e.preventDefault()}>
              <i className="bx bxl-google"></i>
            </a>
          </div>
        </form>
      </div>

      {/* Register Section */}
      <div className="form-box register">
        <form onSubmit={handleRegister}>
          <h1>REGISTER</h1>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          <div className="input-box">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              disabled={loading}
            />
            <i className="bx bx-user"></i>
          </div>
          <div className="input-box">
            <input
              type="email"
              placeholder="Email"
              required
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              disabled={loading}
            />
            <i className="bx bx-envelope"></i>
          </div>
          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              required
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              disabled={loading}
            />
            <i className="bx bx-user"></i>
          </div>
          <div className="input-box">
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              required
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              disabled={loading}
            />
            <i className="bx bx-lock-alt"></i>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          <p>or register with social platforms</p>
          <div className="social-icons">
            <a href="#" onClick={(e) => e.preventDefault()}>
              <i className="bx bxl-google"></i>
            </a>
          </div>
        </form>
      </div>

      {/* Toggle Section */}
      <div className="toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>Welcome!</h1>
          <p>Don't have an account?</p>
          <button 
            className="btn register-btn" 
            onClick={() => handleToggle(true)}
            type="button"
          >
            REGISTER
          </button>
        </div>
        <div className="toggle-panel toggle-right">
          <h1>Welcome Back</h1>
          <p>Already have an account?</p>
          <button 
            className="btn login-btn" 
            onClick={() => handleToggle(false)}
            type="button"
          >
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}