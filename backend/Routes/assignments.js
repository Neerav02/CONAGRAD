const router = require('express').Router();
const assignmentController = require('../controllers/assignmentController');
const { studentAuthMiddleware } = require('../middleware/authMiddleware');

// Student-specific assignment routes (protected)
router.get('/student/assignments', studentAuthMiddleware, assignmentController.getStudentAssignments);
router.get('/student/assignments/:assignmentId', studentAuthMiddleware, assignmentController.getAssignmentById);
router.get('/student/assignments/:assignmentId/submission', studentAuthMiddleware, assignmentController.getSubmission);
router.post('/student/assignments', studentAuthMiddleware, assignmentController.createAssignment);
router.post('/student/assignments/:assignmentId/submit', studentAuthMiddleware, assignmentController.submitAssignment);
router.post('/student/assignments/:assignmentId/approve', studentAuthMiddleware, assignmentController.approveSubmission);
router.post('/student/assignments/:assignmentId/request-revision', studentAuthMiddleware, assignmentController.requestRevision);
router.post('/student/assignments/:assignmentId/accept-bid/:bidId', studentAuthMiddleware, assignmentController.acceptBid);

// Export the router
module.exports = router;
