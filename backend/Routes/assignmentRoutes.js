// backend/routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Assignment = require('../Models/Assignment');
const Expert = require('../Models/Expert');

// POST /api/assignments/accept-bid
router.post('/accept-bid', async (req, res) => {
  try {
    const { assignmentId, bidId } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    assignment.acceptedBid = bidId;
    assignment.status = 'in progress';

    await assignment.save();

    // You can notify the expert here (e.g., email/notification)

    res.json({ message: 'Bid accepted', assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assignments/submit
router.post('/submit', upload.single('submissionFile'), async (req, res) => {
    try {
      const { assignmentId, expertId, note } = req.body;
      const fileUrl = req.file?.path;

      if (!fileUrl) {
          return res.status(400).json({ error: 'Submission file is required.' });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }
      
      if (!assignment.expertId || assignment.expertId.toString() !== expertId || assignment.status !== 'in progress') {
        return res.status(403).json({ error: 'Unauthorized submission or assignment not ready for submission.' });
      }

      assignment.submission = {
        fileUrl: `/uploads/${req.file.filename}`,
        note: note || '',
        submittedAt: new Date(),
        expertId: expertId
      };
      
      assignment.status = 'submitted';

      await assignment.save();
      res.json({ message: 'Work submitted successfully', assignment });
    } catch (error) {
      console.error('Error submitting work:', error);
      res.status(500).json({ error: error.message || 'Failed to submit work.' });
    }
});

router.post('/review', async (req, res) => {
  try {
    const { assignmentId, action } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.status !== 'submitted') {
      return res.status(404).json({ error: 'Assignment not submitted yet' });
    }

    if (action === 'approve') {
      assignment.status = 'completed';
    } else if (action === 'revision') {
      assignment.status = 'in progress';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await assignment.save();
    res.json({ message: `Assignment ${action}d`, assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create', upload.single('file'), async (req, res) => {
  try {
    const { title, description, budget, deadline, category, studentId } = req.body;
    const fileUrl = req.file?.path;

    const newAssignment = new Assignment({
      title,
      description,
      budget,
      deadline,
      category,
      student: studentId,
      fileUrl,
      status: 'open'
    });

    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
