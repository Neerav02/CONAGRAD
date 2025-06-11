const express = require('express');
const app = express();
const studentRoutes = require('./Routes/student');
const authRoutes = require('./Routes/auth');
const bidRoutes = require('./Routes/bidRoutes');
const assignmentRoutes = require('./Routes/assignmentRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/api/uploads', express.static('uploads'));

// Route registrations
app.use('/api/student', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reviews', reviewRoutes);

// Server setup
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});