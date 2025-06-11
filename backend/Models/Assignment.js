const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
    expertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'experts',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Define status enum values as a constant
const ASSIGNMENT_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    COMPLETED: 'completed'
};

const AssignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    status: {
        type: String,
        enum: Object.values(ASSIGNMENT_STATUS),
        default: ASSIGNMENT_STATUS.PENDING
    },
    submittedDate: {
        type: Date,
        default: Date.now
    },
    expertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'experts'
    },
    dueDate: Date,
    subject: String,
    studentName: String,
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'students',
        required: true
    },
    expertDocument: {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    acceptedBidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        default: null
    },
    submission: {
        fileUrl: String,
        note: String,
        fileName: String,
        fileSize: Number,
        submittedAt: Date,
        expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert' }
    },
    expertMessage: String,
    completionDate: Date,
    bids: [BidSchema],
    budget: {
        type: Number,
        required: true,
        min: 12, // Ensure budget is at least $12
    },
});

// Add a pre-save middleware to ensure status is valid
AssignmentSchema.pre('save', function(next) {
    if (!Object.values(ASSIGNMENT_STATUS).includes(this.status)) {
        this.status = ASSIGNMENT_STATUS.PENDING;
    }
    next();
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);

// Export both the model and the status enum
module.exports = {
    Assignment,
    ASSIGNMENT_STATUS
};