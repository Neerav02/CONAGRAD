import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./styles/App.css";

import StudentDashboard from "./components/StudentDashboard";
import AssignmentDetails from './components/AssignmentDetails';
import AssignmentHistory from "./components/AssignmentHistory";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Help from "./components/Help";
import About from "./components/About";
import Services from "./components/Services";
import Contact from "./components/Contact";
import StudentAuth from "./components/studentAuth";
import ExpertAuth from "./components/expertAuth";
import ExpertDashboard from "./components/ExpertPages/ExpertDashboard/ExpertDashboard";
import ExpertProfile from "./components/ExpertPages/ExpertProfile/ExpertProfile";
import StudentUpload from "./components/StudentUpload";
import AssignmentBids from './components/AssignmentBids';
import ExpertPublicProfile from './components/ExpertPublicProfile';
import YourWork from "./components/ExpertPages/YourWork/YourWork";

function Home() {
  return (
    <div className="app">
      <header>
        <div className="video-container">
          <video autoPlay loop muted>
            <source src="/Conagrad..mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="logo">
          <img src="/Conagrad.jpg" alt="Platform Logo" />
        </div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>
      </header>

      <div className="overlay"></div>

      <section className="hero">
        <div className="overlay"></div>
        <div className="content">
          <h1>Welcome to the Student & Expert Platform</h1>
          <p>Connecting students with experts to enhance learning and growth.</p>
          <div className="buttons">
            <Link to="/student-login" className="btn student">Are You a Student?</Link>
            <Link to="/expert-login" className="btn expert">Are You an Expert?</Link>
          </div>
        </div>
      </section>

      <footer>
        <p>&copy; 2025 Student & Expert Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Student Pages */}
        <Route path="/student-login" element={<StudentAuth />} />
        <Route path="/student-upload" element={<StudentUpload />} />
        <Route path="/assignments" element={<AssignmentHistory />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/assignment/:id" element={<AssignmentDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:expertId" element={<ExpertPublicProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        <Route path="/assignments/:id/bids" element={<AssignmentBids />} />

        {/* Expert Pages */}
        <Route path="/expert-login" element={<ExpertAuth />} />
        <Route path="/expert-dashboard" element={<ExpertDashboard />} />
        <Route path="/expert-profile" element={<ExpertProfile />} />
        <Route path="/your-work" element={<YourWork />} />
      </Routes>
    </Router>
  );
}

export default App;