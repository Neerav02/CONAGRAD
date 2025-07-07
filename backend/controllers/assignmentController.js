const { Assignment, ASSIGNMENT_STATUS } = require('../Models/Assignment');
const Bid = require('../Models/Bids');

exports.acceptBid = async (req, res) => {
  const { assignmentId, bidId } = req.params;
  try {
    // 1. Update assignment status to "in progress"
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    assignment.status = 'in progress';
    assignment.acceptedBidId = bidId; // Store the accepted bid ID
    await assignment.save();

    // 2. Lock further bidding (optional: update a flag or status)
    // Example: assignment.isBiddingLocked = true;
    // await assignment.save();

    // 3. Notify the selected expert (e.g., send an email or notification)
    const bid = await Bid.findById(bidId);
    if (bid && bid.expertId) {
      // Example: sendNotification(bid.expertId, 'Your bid has been accepted!');
    }

    res.json({ message: 'Bid accepted successfully', assignment });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.status !== 'submitted' && assignment.status !== 'to be reviewed') {
      return res.status(400).json({ error: 'Assignment is not in a reviewable state' });
    }
    assignment.status = 'approved';
    await assignment.save();
    res.json({ message: 'Assignment approved', assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestRevision = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.status !== 'submitted' && assignment.status !== 'to be reviewed') {
      return res.status(400).json({ error: 'Assignment is not in a reviewable state' });
    }
    assignment.status = 'in progress';
    await assignment.save();
    res.json({ message: 'Revision requested', assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({
        path: 'acceptedBidId',
        populate: { path: 'expertId', select: 'name username email' }
      })
      .populate('submission.expertId');
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({
      ...assignment.toObject(),
      submission: assignment.submission || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSubmission = async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (!assignment.submission) {
      return res.status(404).json({ error: 'No submission found for this assignment.' });
    }
    res.json(assignment.submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submission details.' });
  }
};

exports.submitExpertWork = async (req, res) => {
    const { assignmentId } = req.params;
    const { note } = req.body;
    const expertId = req.expert._id; // Expert ID from authenticated middleware

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        // Ensure the expert submitting is the accepted expert for this assignment
        if (!assignment.acceptedBidId || !assignment.acceptedBidId.expertId.equals(expertId)) {
            return res.status(403).json({ error: 'Not authorized to submit work for this assignment.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        assignment.submission = {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            note: note || '',
            submittedAt: new Date(),
            expertId: expertId,
        };
        assignment.status = 'submitted'; // Update assignment status

        await assignment.save();

        res.status(200).json({ message: 'Work submitted successfully!', submission: assignment.submission });

    } catch (error) {
        console.error('Error submitting expert work:', error);
        res.status(500).json({ error: 'Failed to submit work.' });
    }
};

exports.createAssignment = async (req, res) => {
    const studentId = req.student._id; // Assuming student ID is available from auth middleware

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded for the assignment.' });
        }

        const { title, description, subject, dueDate, budget } = req.body;

        if (!title || !description || !subject || !dueDate || !budget) {
            return res.status(400).json({ error: 'All required fields (title, description, subject, due date, budget) must be provided.' });
        }

        // Basic validation for budget (client-side also handles this, but good to have server-side)
        if (parseFloat(budget) < 12) {
            return res.status(400).json({ error: 'Budget must be at least $12.' });
        }

        const newAssignment = new Assignment({
            title,
            description,
            subject,
            dueDate: new Date(dueDate),
            budget: parseFloat(budget),
            studentId,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`, // Adjust based on your upload strategy
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            status: 'pending', // Default status for new assignments
        });

        await newAssignment.save();

        res.status(201).json({ message: 'Assignment uploaded successfully!', assignment: newAssignment });

    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ error: 'Failed to create assignment.' });
    }
}; 