import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String }
}, { _id: false });

const HotspotSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  elementKey: { type: String, required: true },
  description: { type: String, required: true },
  isVulnerability: { type: Boolean, default: true }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order: { type: Number, required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Phishing Detection',
      'Social Engineering',
      'Password Safety',
      'Incident Response',
      'Remote Work Safety'
    ]
  },
  questionType: { 
    type: String, 
    required: true,
    enum: [
      'hotspot',
      'classification',
      'chat_decision',
      'mfa_alert',
      'drag_drop',
      'scenario_decision',
      'qr_inspect',
      'multiple_choice',
      'message_investigate',
      'laptop_security',
      'incident_toolbox',
      'workday_timeline',
      'email_investigation',
      'office_incident',
      'password_challenge'
    ]
  },
  scenario: { type: String, required: true },
  question: { type: String, required: true },
  points: { type: Number, default: 100 },
  bonusPoints: { type: Number, default: 0 },
  options: [OptionSchema],
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  explanation: { type: String, required: true },
  safeTakeaway: { type: String, required: true },
  commonMistake: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('Question', QuestionSchema);
