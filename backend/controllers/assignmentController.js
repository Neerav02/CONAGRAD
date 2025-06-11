const { Assignment } = require('../Models/Assignment');
const Bid = require('../Models/Bid');

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
  const { assignmentId } = req.params;
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    assignment.status = 'approved';
    await assignment.save();
    res.json({ message: 'Submission approved successfully', assignment });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
};

exports.requestRevision = async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    assignment.status = 'revision_requested';
    await assignment.save();
    res.json({ message: 'Revision requested successfully', assignment });
  } catch (error) {
    console.error('Error requesting revision:', error);
    res.status(500).json({ error: 'Failed to request revision' });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({
        path: 'acceptedBidId',
        populate: { path: 'expertId', select: 'name username email' }
      });
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