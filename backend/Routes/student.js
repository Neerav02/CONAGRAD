const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Assignment, ASSIGNMENT_STATUS } = require('../Models/Assignment');
const authMiddleware = require('../middleware/auth');

// Try to import Expert/User model, but handle gracefully if it doesn't exist
let Expert = null;
try {
    Expert = require('../Models/Expert');
} catch (err) {
    try {
        Expert = require('../Models/User');
    } catch (err2) {
        console.warn('[WARN] Expert/User model not found. Population will be skipped.');
    }
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = Date.now() + '-' + sanitizedFilename;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'));
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 20MB.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// GET /api/student/assignments - Get all assignments for a student
router.get('/assignments', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching assignments for user:', req.userId);
        
        const assignments = await Assignment
            .find({ studentId: req.userId })
            .sort({ createdAt: -1 });
            
        console.log('Found assignments:', assignments.length);
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});

// GET /api/student/assignments/:id - Get a specific assignment by ID
router.get('/assignments/:id', authMiddleware, async (req, res) => {
    const assignmentId = req.params.id;
    const userId = req.userId;
    console.log(`[DEBUG] GET /assignments/:id called with ID: ${assignmentId} by user: ${userId}`);

    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            console.warn(`[WARN] Invalid assignment ID format: ${assignmentId}`);
            return res.status(400).json({ error: 'Invalid assignment ID format' });
        }

        // Always populate expertId, bids.expertId, and submission.expertId
        let query = Assignment.findById(assignmentId)
            .populate({
                path: 'expertId',
                select: 'name username email expertise',
                model: Expert || 'experts'
            })
            .populate({
                path: 'bids.expertId',
                select: 'name username email expertise',
                model: Expert || 'experts'
            })
            .populate({
                path: 'submission.expertId',
                select: 'name username email expertise',
                model: Expert || 'experts'
            });

        const assignment = await query.exec();
        if (!assignment) {
            console.warn(`[WARN] Assignment not found: ${assignmentId}`);
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check ownership
        if (assignment.studentId.toString() !== userId) {
            console.warn(`[WARN] Unauthorized access attempt. Assignment student: ${assignment.studentId}, Requesting user: ${userId}`);
            return res.status(403).json({ error: 'You do not have permission to view this assignment' });
        }

        console.log(`[DEBUG] Assignment populated successfully`);
        return res.json(assignment);
    } catch (error) {
        console.error(`[ERROR] Error in GET /assignments/:id:`, error);
        return res.status(500).json({
            error: 'Failed to fetch assignment details',
            message: error.message
        });
    }
});

// POST /api/student/upload-assignment - Upload new assignment
router.post('/upload-assignment', authMiddleware, upload.single('file'), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log('File received:', req.file);
        console.log('Request body:', req.body);
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));

        const { title, description, subject, dueDate, budget } = req.body;

        console.log('Parsed fields:', {
            title,
            description,
            subject,
            dueDate,
            budget
        });

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) < 12) {
            return res.status(400).json({ 
                error: "Budget is required and must be at least $12",
                receivedBudget: budget
            });
        }

        try {
            const newAssignment = new Assignment({
                title,
                description: description || '',
                subject: subject || 'General',
                studentId: req.userId,
                fileUrl: `/uploads/${req.file.filename}`,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                dueDate: dueDate ? new Date(dueDate) : new Date(),
                status: ASSIGNMENT_STATUS.PENDING,
                submittedDate: new Date(),
                bids: [],
                budget: parseFloat(budget)
            });

            console.log('Attempting to save assignment:', JSON.stringify(newAssignment.toObject(), null, 2));
            const savedAssignment = await newAssignment.save();
            console.log('Assignment saved successfully:', JSON.stringify(savedAssignment.toObject(), null, 2));
            
            res.status(201).json({ 
                message: "Assignment uploaded successfully",
                assignment: savedAssignment
            });
        } catch (saveError) {
            console.error('Error saving assignment:', saveError);
            // If file was uploaded but database save failed, delete the file
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file after failed save:', unlinkError);
                }
            }
            throw saveError; // Re-throw to be caught by outer try-catch
        }
    } catch (error) {
        console.error('Upload error details:', error);
        res.status(500).json({ 
            error: "Failed to upload assignment",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /api/student/download/:filename - Download file
router.get('/download/:filename', authMiddleware, async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join(uploadsDir, filename);
        
        console.log('Download request for:', filename);
        console.log('File path:', filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log('File not found:', filePath);
            return res.status(404).json({ error: 'File not found' });
        }

        // Get file stats
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // Set headers for download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Length', fileSize);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
        }
    }
});

// GET /api/student/assignments/:id/bids - Get all bids for a specific assignment
router.get('/assignments/:id/bids', authMiddleware, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        console.log('Fetching bids for assignment:', assignmentId);
        
        // Verify the assignment belongs to this student
        let assignment;
        if (Expert) {
            assignment = await Assignment.findOne({
                _id: assignmentId,
                studentId: req.userId
            }).populate({
                path: 'bids.expertId',
                select: 'name username email',
                model: Expert
            });
        } else {
            assignment = await Assignment.findOne({
                _id: assignmentId,
                studentId: req.userId
            });
        }
        
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found or unauthorized" });
        }
        
        console.log('Found bids:', assignment.bids.length);
        res.json(assignment.bids);
    } catch (error) {
        console.error('Error fetching bids:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid assignment ID format' });
        }
        res.status(500).json({ error: "Failed to fetch bids" });
    }
});

// POST /api/student/assignments/:id/accept-bid/:bidId - Accept a specific bid
router.post('/assignments/:id/accept-bid/:bidId', authMiddleware, async (req, res) => {
    try {
        const { id: assignmentId, bidId } = req.params;
        console.log('Accepting bid:', { assignmentId, bidId });
        
        // Find the assignment and verify it belongs to this student
        const assignment = await Assignment.findOne({
            _id: assignmentId,
            studentId: req.userId,
            status: ASSIGNMENT_STATUS.PENDING // Only pending assignments can have bids accepted
        });
        
        if (!assignment) {
            return res.status(404).json({ 
                error: "Assignment not found, unauthorized, or not in pending status" 
            });
        }
        
        // Find the bid
        const bid = assignment.bids.id(bidId);
        if (!bid) {
            return res.status(404).json({ error: "Bid not found" });
        }
        
        // Update assignment status and assign to expert
        assignment.status = ASSIGNMENT_STATUS.IN_PROGRESS;
        assignment.expertId = bid.expertId;
        assignment.acceptedBid = bidId;
        
        await assignment.save();
        
        // TODO: Add notification logic here (could be email, in-app notification, etc.)
        
        console.log('Bid accepted successfully');
        res.json({ 
            message: "Bid accepted successfully",
            assignment
        });
    } catch (error) {
        console.error('Error accepting bid:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        res.status(500).json({ error: "Failed to accept bid" });
    }
});

// POST /api/student/assignments/:id/approve - Approve a submitted assignment
// POST /api/student/assignments/:id/approve - Approve a submitted assignment
router.post('/assignments/:id/approve', authMiddleware, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const studentId = req.userId;

        console.log(`[DEBUG] Approving assignment ${assignmentId} by student ${studentId}`);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ error: 'Invalid assignment ID format' });
        }

        // Find the assignment and verify ownership
        const assignment = await Assignment.findOne({
            _id: assignmentId,
            studentId: studentId
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found or unauthorized' });
        }

        // Check if assignment is in the correct status for approval
        if (assignment.status !== ASSIGNMENT_STATUS.SUBMITTED && assignment.status !== 'submitted') {
            return res.status(400).json({ 
                error: 'Assignment must be submitted before it can be approved',
                currentStatus: assignment.status 
            });
        }

        // Check if there's a submission
        if (!assignment.submission || !assignment.submission.fileUrl) {
            return res.status(400).json({ error: 'No submission found to approve' });
        }

        // Update assignment status to completed (use the same status as in assignmentRoutes.js)
        assignment.status = 'completed';
        assignment.approvedAt = new Date();
        
        await assignment.save();

        console.log(`[DEBUG] Assignment ${assignmentId} approved successfully`);
        
        res.json({ 
            message: 'Assignment approved successfully',
            assignment: assignment
        });

    } catch (error) {
        console.error(`[ERROR] Error approving assignment:`, error);
        res.status(500).json({ 
            error: 'Failed to approve assignment',
            message: error.message
        });
    }
});

// POST /api/student/assignments/:id/request-revision - Request revision for a submitted assignment
router.post('/assignments/:id/request-revision', authMiddleware, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const studentId = req.userId;
        const { revisionNote } = req.body;

        console.log(`[DEBUG] Requesting revision for assignment ${assignmentId} by student ${studentId}`);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ error: 'Invalid assignment ID format' });
        }

        // Find the assignment and verify ownership
        const assignment = await Assignment.findOne({
            _id: assignmentId,
            studentId: studentId
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found or unauthorized' });
        }

        // Check if assignment is in the correct status for revision request
        if (assignment.status !== ASSIGNMENT_STATUS.SUBMITTED && assignment.status !== 'submitted') {
            return res.status(400).json({ 
                error: 'Assignment must be submitted before revision can be requested',
                currentStatus: assignment.status 
            });
        }

        // Check if there's a submission
        if (!assignment.submission || !assignment.submission.fileUrl) {
            return res.status(400).json({ error: 'No submission found to request revision for' });
        }

        // Update assignment status back to in progress for revision (use consistent status)
        assignment.status = 'in progress';
        assignment.revisionRequested = true;
        assignment.revisionNote = revisionNote || 'Revision requested by student';
        assignment.revisionRequestedAt = new Date();
        
        await assignment.save();

        console.log(`[DEBUG] Revision requested for assignment ${assignmentId} successfully`);
        
        res.json({ 
            message: 'Revision requested successfully',
            assignment: assignment
        });

    } catch (error) {
        console.error(`[ERROR] Error requesting revision:`, error);
        res.status(500).json({ 
            error: 'Failed to request revision',
            message: error.message
        });
    }
});

// POST /api/student/assignments/:id/reject-bid/:bidId - Reject a specific bid
router.post('/assignments/:id/reject-bid/:bidId', authMiddleware, async (req, res) => {
    try {
        const { id: assignmentId, bidId } = req.params;
        console.log('Rejecting bid:', { assignmentId, bidId });
        
        // Find the assignment and verify it belongs to this student
        const assignment = await Assignment.findOne({
            _id: assignmentId,
            studentId: req.userId
        });
        
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found or unauthorized" });
        }
        
        // Remove the bid
        assignment.bids.pull(bidId);
        await assignment.save();
        
        console.log('Bid rejected successfully');
        res.json({ 
            message: "Bid rejected successfully",
            assignment
        });
    } catch (error) {
        console.error('Error rejecting bid:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        res.status(500).json({ error: "Failed to reject bid" });
    }
});

// GET /api/student/assignments/:id/expert-document
router.get('/assignments/:id/expert-document', authMiddleware, async (req, res) => {
    try {
        let assignment;
        if (Expert) {
            assignment = await Assignment.findById(req.params.id)
                .populate({
                    path: 'expertId',
                    select: 'name username email expertise rating',
                    model: Expert
                });
        } else {
            assignment = await Assignment.findById(req.params.id);
        }

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        if (assignment.studentId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json({
            expertDetails: assignment.expertId,
            document: assignment.expertDocument,
            message: assignment.expertMessage,
            completionDate: assignment.completionDate
        });
    } catch (error) {
        console.error('Error fetching expert document:', error);
        res.status(500).json({ error: 'Failed to fetch expert document details' });
    }
});

// GET /api/student/assignments/:id/download-expert-document
router.get('/assignments/:id/download-expert-document', authMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment || !assignment.expertDocument) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (assignment.studentId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        const filePath = path.join(uploadsDir, assignment.expertDocument.fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(filePath, assignment.expertDocument.fileName);
    } catch (error) {
        console.error('Error downloading expert document:', error);
        res.status(500).json({ error: 'Failed to download expert document' });
    }
});

module.exports = router;