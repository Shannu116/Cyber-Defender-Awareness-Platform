import mongoose from 'mongoose';

const SessionAnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionTitle: { type: String },
  category: { type: String },
  userResponse: { type: mongoose.Schema.Types.Mixed },
  timeSpentSeconds: { type: Number, default: 0 },
  answeredAt: { type: Date, default: Date.now }
}, { _id: false });

const QuizSessionSchema = new mongoose.Schema({
  nameKey: {
    type: String,
    required: [true, 'Normalized nameKey is required'],
    index: true
  },
  participantName: {
    type: String,
    required: [true, 'Participant name is required'],
    trim: true,
    minlength: 2,
    maxlength: 60
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    select: false // Never returned in queries unless explicitly requested via .select('+email')
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
    index: true
  },
  questionIds: [{ type: String }],
  currentIndex: {
    type: Number,
    default: 0
  },
  answers: [SessionAnswerSchema],
  activeSeconds: {
    type: Number,
    default: 0
  },
  resumeCode: {
    type: String,
    required: true,
    index: true
  },
  deviceTokenHash: {
    type: String,
    required: true,
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    default: null
  }
}, {
  timestamps: true
});

// Enforce atomic uniqueness per department
QuizSessionSchema.index({ nameKey: 1, department: 1 }, { unique: true });

export default mongoose.model('QuizSession', QuizSessionSchema);
