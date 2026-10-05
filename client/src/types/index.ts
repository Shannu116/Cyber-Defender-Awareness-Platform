export type QuestionCategory = 
  | 'Phishing Detection'
  | 'Social Engineering'
  | 'Password Safety'
  | 'Incident Response'
  | 'Remote Work Safety';

export type QuestionType =
  | 'hotspot'
  | 'classification'
  | 'chat_decision'
  | 'mfa_alert'
  | 'drag_drop'
  | 'password_challenge'
  | 'scenario_decision'
  | 'qr_inspect'
  | 'multiple_choice'
  | 'message_investigate'
  | 'laptop_security'
  | 'incident_toolbox'
  | 'workday_timeline'
  | 'email_investigation'
  | 'office_incident';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Hotspot {
  id: string;
  title: string;
  elementKey: string;
  description: string;
  isVulnerability: boolean;
}

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  date: string;
  greeting: string;
  bodyText: string;
  actionText: string;
  actionUrl: string;
  footerText: string;
}

export interface ClassificationMessage {
  id: string;
  type: string;
  sender: string;
  subject: string;
  preview: string;
  correctClassification: 'safe' | 'suspicious';
  explanation: string;
}

export interface PasswordItem {
  id: string;
  text: string;
  correctCategory: 'stronger' | 'weaker';
  reason: string;
}

export interface QuestionDetails {
  email?: EmailData;
  hotspots?: Hotspot[];
  messages?: ClassificationMessage[];
  chatSender?: {
    name: string;
    avatarText: string;
    role: string;
    status: string;
  };
  chatMessages?: Array<{ sender: 'them' | 'me'; time: string; text: string }>;
  alertCount?: number;
  timeWindow?: string;
  sampleAlert?: {
    app: string;
    title: string;
    location: string;
    device: string;
    time: string;
  };
  passwords?: PasswordItem[];
  imageHint?: string;
  riskType?: string;
  posterHeader?: string;
  posterSubtitle?: string;
  posterNotice?: string;
  qrPreviewUrl?: string;
  officialPortalUrl?: string;
  location?: string;
  availableNetworks?: Array<{ name: string; security: string }>;
  vectors?: string[];
  tone?: string;
  context?: string;
}

export interface Question {
  _id?: string;
  id: string;
  order: number;
  title: string;
  category: QuestionCategory;
  questionType: QuestionType;
  scenario: string;
  question: string;
  points: number;
  bonusPoints: number;
  options: Option[];
  details: QuestionDetails;
  explanation: string;
  safeTakeaway: string;
  commonMistake?: string;
}

export interface UserAnswerSubmission {
  questionId: string;
  questionTitle: string;
  category: QuestionCategory;
  userResponse: any;
  timeSpentSeconds: number;
}

export interface EvaluatedAnswer {
  questionId: string;
  questionTitle: string;
  category: QuestionCategory;
  isCorrect: boolean;
  scoreAwarded: number;
  bonusAwarded: number;
  userResponse: any;
  timeSpentSeconds: number;
}

export interface CategoryStat {
  score: number;
  maxScore: number;
  percentage: number;
}

export interface QuizAttempt {
  _id?: string;
  participantName: string;
  department: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'Needs Practice' | 'Security Aware' | 'Cyber Defender' | 'Cyber Champion';
  completionTimeSeconds: number;
  completed: boolean;
  answers: EvaluatedAnswer[];
  categoryBreakdown: Record<QuestionCategory, CategoryStat>;
  recommendations: string[];
  isPracticeQuiz?: boolean;
  sessionId?: string | null;
  createdAt?: string;
}

export interface AdminStats {
  totalParticipants: number;
  inProgressSessions?: number;
  averageScore: number;
  averagePercentage: number;
  completionRate: number;
  averageCompletionTime: string;
  mostCommonlyMissedQuestion: string;
  categoryPerformance: Array<{ name: QuestionCategory; averagePercentage: number }>;
  levelDistribution: Record<string, number>;
  recentAttempts: Array<{
    _id?: string;
    participantName: string;
    department: string;
    score: number;
    maxScore: number;
    percentage: number;
    level: string;
    completionTimeSeconds: number;
    createdAt: string;
    sessionId?: string | null;
  }>;
}

export interface SessionAnswerItem {
  questionId: string;
  questionTitle?: string;
  category?: string;
  userResponse: any;
  timeSpentSeconds: number;
  answeredAt?: string;
}

export interface QuizSessionData {
  id: string;
  participantName: string;
  department: string;
  status: 'in_progress' | 'completed';
  currentIndex: number;
  activeSeconds: number;
  resumeCode: string;
  answers: SessionAnswerItem[];
  questionIds: string[];
  attemptId?: string | null;
  startedAt?: string;
  lastActivityAt?: string;
}

export interface SessionStartResponse {
  success: boolean;
  sessionId: string;
  deviceToken: string;
  resumeCode: string;
  currentIndex: number;
  participantName: string;
  department: string;
  questionIds: string[];
}

export interface SessionResumeResponse {
  success: boolean;
  sessionId: string;
  deviceToken: string;
  resumeCode: string;
  session: QuizSessionData;
  attempt?: QuizAttempt | null;
}

export interface LeaderboardEntry {
  rank: number;
  id?: string;
  participantName: string;
  department: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: string;
  completionTimeSeconds?: number;
  cyberTitle: string;
}

