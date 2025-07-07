const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const errorHandler = require("./middleware/errorHandler");
const jwt = require('jsonwebtoken');
const authMiddleware = require("./middleware/auth");
require('dotenv').config();
const studentRoutes = require('./Routes/student');
const { Assignment, ASSIGNMENT_STATUS } = require('./Models/Assignment');

// FIXED: Correct path with capital R
const expertRoutes = require('./routes/expertRoutes'); // Make sure this path is correct
const app = express();
const PORT = 4000;

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.db.databaseName);
    mongoose.connection.db.listCollections().toArray().then(collections => {
        console.log('Available collections:', collections.map(c => c.name));
    });
})
.catch((err) => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token']
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    fallthrough: false
}));

// FIXED: Mount expert routes BEFORE other conflicting routes
app.use('/api/expert', expertRoutes);
app.use('/api/student', studentRoutes);

// Import Models
const Student = require('./Models/Student');
const Expert = require('./Models/Expert');

// Student Routes (keep these for backward compatibility)
app.post("/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
        const newStudent = new Student({ name, email, username, password });
        await newStudent.save();
    res.status(201).json({ 
            message: "Registration successful!",
      redirectTo: "/login"
    });
  } catch (error) {
        res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const student = await Student.findOne({ username, password });
        if (!student) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const token = jwt.sign(
            { userId: student._id, userType: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            message: "Login successful!",
            token,
            user: {
                id: student._id,
                username: student.username,
                name: student.name
            },
            redirectTo: "/student-upload"
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// Student Upload Assignment Route
app.post("/upload-assignment", authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { title, description, subject, dueDate } = req.body;
        const studentId = req.userId;

        const newAssignment = new Assignment({
            title,
            description,
            subject,
            studentId,
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            dueDate,
            status: 'pending'
        });

        await newAssignment.save();
        await newAssignment.populate('studentId', 'name username');
        
        res.status(201).json({ 
            message: "Assignment uploaded successfully",
            assignment: newAssignment
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: "Failed to upload assignment" });
    }
});

// Route for fetching available assignments
app.get('/available-assignments', authMiddleware, async (req, res) => {
    try {
        const assignments = await Assignment
            .find({ status: 'pending' })
            .populate('studentId', 'name username')
            .sort({ createdAt: -1 });
            
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Get Current Work Route
app.get("/current-work", async (req, res) => {
    try {
        const currentWork = await Assignment.find({
            status: 'assigned'
        }).lean();
        res.json(currentWork);
    } catch (error) {
        console.error('Error fetching current work:', error);
        res.status(500).json({ error: "Failed to fetch current work" });
    }
});

// Route for checking current assignment
app.get('/expert/current-assignment', authMiddleware, async (req, res) => {
    try {
        const currentAssignment = await Assignment
            .findOne({ 
                expertId: req.userId,
                status: 'assigned'
            })
            .populate('studentId', 'name username')
            .populate('expertId', 'name username');
            
        res.json(currentAssignment);
    } catch (error) {
        console.error('Error checking current assignment:', error);
        res.status(500).json({ error: 'Failed to check current assignment' });
    }
});

// Accept assignment route
app.post("/accept-assignment/:id", authMiddleware, async (req, res) => {
    try {
        const existingAssignment = await Assignment.findOne({
            status: 'assigned',
            expertId: req.userId
        });

        if (existingAssignment) {
            return res.status(400).json({ 
                error: "You already have an active assignment. Please complete it first." 
            });
        }

        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    status: 'assigned',
                    expertId: req.userId
                }
            },
            { new: true }
        ).populate('studentId', 'name username')
         .populate('expertId', 'name username');

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        res.json({ 
            message: "Assignment accepted successfully",
            assignment 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to accept assignment" });
    }
});

// Submit bid route
app.post('/submit-bid/:id', authMiddleware, async (req, res) => {
    try {
        console.log('Submit bid route hit:', req.params.id);
        console.log('Request body:', req.body);
        console.log('Expert ID:', req.userId);

        const { amount, message } = req.body;
        const assignmentId = req.params.id;
        const expertId = req.userId;

        if (!amount || !message) {
            return res.status(400).json({
                error: 'Amount and message are required'
            });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                error: 'Assignment not found'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                error: 'Assignment is no longer available for bidding'
            });
        }

        const bid = {
            expertId,
            amount: parseFloat(amount),
            message,
            timestamp: new Date()
        };

        const existingBidIndex = assignment.bids.findIndex(
            b => b.expertId.toString() === expertId
        );

        if (existingBidIndex !== -1) {
            assignment.bids[existingBidIndex] = bid;
        } else {
            assignment.bids.push(bid);
        }

        await assignment.save();

        res.json({
            success: true,
            message: 'Bid submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting bid:', error);
        res.status(500).json({
            error: 'Failed to submit bid',
            details: error.message
        });
    }
});

// Complete assignment route
app.post("/complete-assignment/:id", async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    status: 'completed'
                }
            },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        res.json({ 
            message: "Assignment completed successfully",
            assignment 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to complete assignment" });
    }
});

// Debug routes
app.get("/debug/collections", async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json(collections.map(col => col.name));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/debug/database', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const collections = await mongoose.connection.db.listCollections().toArray();
        const assignmentCount = await Assignment.countDocuments();
        const sampleAssignment = await Assignment.findOne();
        
        res.json({
            status: dbStatus,
            collections: collections.map(c => c.name),
            assignmentCount,
            sampleAssignment
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// REMOVED: Duplicate expert profile route since it's now in expertRoutes

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Expert Assignment API Server',
        endpoints: {
            test: '/test',
            assignments: '/available-assignments',
            currentAssignment: '/expert/current-assignment',
            expertLogin: '/expert/login',
            expertRegister: '/expert/register'
        }
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Add error handling middleware
app.use(errorHandler);

// Function to add test data
const addTestData = async () => {
    try {
        const count = await Assignment.countDocuments();
        if (count === 0) {
            const testAssignment = new Assignment({
                title: "Test Assignment",
                description: "This is a test assignment",
                subject: "Computer Science",
                studentName: "John Doe",
                dueDate: new Date("2025-03-20"),
                status: ASSIGNMENT_STATUS.PENDING
            });
            await testAssignment.save();
            console.log('Test data added successfully');
        }
    } catch (error) {
        console.error('Error adding test data:', error);
    }
};

// Add this route to get expert profile
app.get("/expert/profile", async (req, res) => {
    try {
        // For now, getting username from token. You'll implement proper auth later
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Get expert data from database
        const expert = await Expert.findById(req.expertId); // You'll get this from auth middleware
        if (!expert) {
            return res.status(404).json({ error: "Expert not found" });
        }

        // Return only necessary data
        res.json({
            username: expert.username,
            name: expert.name,
            email: expert.email
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Expert Assignment API Server',
        endpoints: {
            test: '/test',
            assignments: '/available-assignments',
            currentAssignment: '/expert/current-assignment'
        }
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Mount student routes
app.use('/api/student', studentRoutes);

// Add this new endpoint for student assignments
app.get('/api/student/assignments', authMiddleware, async (req, res) => {
    try {
        const assignments = await Assignment
            .find({ studentId: req.userId })
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});

// Add this new endpoint for assignment uploads
app.post('/api/assignments/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, description, subject, dueDate } = req.body;
        
        // Create new assignment
        const newAssignment = new Assignment({
            title,
            description,
            subject: subject || 'General',
            deadline: dueDate || null,
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            studentId: req.userId,
            status: ASSIGNMENT_STATUS.PENDING,
            submittedDate: new Date()
        });
        
        await newAssignment.save();
        
        res.status(201).json({
            message: 'Assignment uploaded successfully',
            assignment: newAssignment
        });
    } catch (error) {
        console.error('Error uploading assignment:', error);
        res.status(500).json({ error: 'Failed to upload assignment' });
    }
});

// Before app.listen
addTestData().then(() => {
  console.log('Test data check complete');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});