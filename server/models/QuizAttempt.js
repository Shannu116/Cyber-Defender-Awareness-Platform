import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionTitle: { type: String },
  category: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  scoreAwarded: { type: Number, default: 0 },
  bonusAwarded: { type: Number, default: 0 },
  userResponse: { type: mongoose.Schema.Types.Mixed },
  timeSpentSeconds: { type: Number, default: 0 }
}, { _id: false });

const CategoryStatSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 }
}, { _id: false });

const QuizAttemptSchema = new mongoose.Schema({
  participantName: { 
    type: String, 
    required: [true, 'Participant name is required']
  },
  department: { 
    type: String, 
    required: [true, 'Department is required']
  },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 1000 },
  percentage: { type: Number, required: true },
  level: { 
    type: String, 
    enum: ['Needs Practice', 'Security Aware', 'Cyber Defender', 'Cyber Champion'],
    required: true 
  },
  completionTimeSeconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: true },
  answers: [AnswerSchema],
  categoryBreakdown: {
    'Phishing Detection': CategoryStatSchema,
    'Social Engineering': CategoryStatSchema,
    'Password Safety': CategoryStatSchema,
    'Incident Response': CategoryStatSchema,
    'Remote Work Safety': CategoryStatSchema
  },
  recommendations: [{ type: String }],
  isPracticeQuiz: { type: Boolean, default: false },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSession', default: null, index: true },
}, {
  timestamps: true
});

export default mongoose.model('QuizAttempt', QuizAttemptSchema);
