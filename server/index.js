import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB, mongoose } from './db.js';
import Question from './models/Question.js';
import QuizAttempt from './models/QuizAttempt.js';
import QuizSession from './models/QuizSession.js';
import AdminUser from './models/AdminUser.js';
import { requireAdminAuth, JWT_SECRET } from './middleware/auth.js';
import { questionsData } from './seedData.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { gradeAnswers, getCyberLevel, generateRecommendations } from './services/evaluation.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount Session Routes
app.use('/api/session', sessionRoutes);

// Initialize MongoDB collections and ensure clean zero-state
async function seedDatabaseIfEmpty() {
  try {
    for (const qData of questionsData) {
      await Question.findOneAndUpdate({ id: qData.id }, qData, { upsert: true, returnDocument: 'after' });
    }
    console.log(`[MongoDB] Verified & synchronized 10 challenges in MongoDB.`);

    // Purge only legacy demo/mock participant names so real tests are never deleted
    await QuizAttempt.deleteMany({
      $or: [
        { participantName: { $regex: /David K\.|Sarah M\.|Ravi P\.|Elena V\.|James L\.|Demo User/i } },
        { isDemo: true }
      ]
    });

    await QuizSession.deleteMany({
      participantName: { $regex: /David K\.|Sarah M\.|Ravi P\.|Elena V\.|James L\.|Demo User/i }
    });

    const adminCount = await AdminUser.countDocuments();
    if (adminCount === 0) {
      console.log('[MongoDB] AdminUser collection empty. Seeding default administrator...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('CyberAdmin2025!', salt);
      await AdminUser.create({
        username: 'admin',
        passwordHash,
        name: 'Lead Security Administrator',
        role: 'admin'
      });
      console.log('[MongoDB] Default administrator seeded: username="admin" (password securely hashed).');
    }
  } catch (err) {
    console.error('[MongoDB] Seeding error:', err);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || 'cyber_defender',
    timestamp: new Date().toISOString()
  });
});

// GET all 10 challenges
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ order: 1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve questions from MongoDB' });
  }
});

// GET weak area challenges for practice quiz
app.get('/api/questions/weak-areas', async (req, res) => {
  try {
    const categoriesParam = req.query.categories;
    let filter = {};
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => c.trim());
      filter = { category: { $in: categories } };
    }
    const questions = await Question.find(filter).sort({ order: 1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    console.error('Error fetching weak area questions:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve practice challenges' });
  }
});

// POST Submit Quiz Attempt (Used for practice quizzes or standalone fallback)
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { 
      participantName, 
      department, 
      answers = [], 
      completionTimeSeconds = 0, 
      isPracticeQuiz = false,
      sessionId = null
    } = req.body;

    if (!participantName || !participantName.trim()) {
      return res.status(400).json({ success: false, error: 'Participant name is strictly required' });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, error: 'Department is strictly required' });
    }

    // Fetch official questions from MongoDB to grade answers securely
    const questions = await Question.find();
    const graded = gradeAnswers(questions, answers);

    // Save to MongoDB collection QuizAttempt
    const newAttempt = new QuizAttempt({
      participantName: participantName.trim(),
      department: department.trim(),
      score: graded.totalScore,
      maxScore: graded.totalMaxScore,
      percentage: graded.finalPercentage,
      level: graded.finalLevel,
      completionTimeSeconds,
      completed: true,
      answers: graded.evaluatedAnswers,
      categoryBreakdown: graded.categoryBreakdown,
      recommendations: graded.recommendations,
      isPracticeQuiz: Boolean(isPracticeQuiz),
      sessionId: sessionId || null
    });

    const savedAttempt = await newAttempt.save();
    console.log(`[MongoDB] Quiz attempt recorded: ID=${savedAttempt._id}, Participant="${savedAttempt.participantName}", Score=${savedAttempt.score} (Practice=${savedAttempt.isPracticeQuiz})`);

    res.status(201).json({
      success: true,
      message: 'Quiz attempt saved successfully to MongoDB',
      data: savedAttempt
    });
  } catch (err) {
    console.error('Error saving quiz attempt to MongoDB:', err);
    res.status(500).json({ success: false, error: 'Failed to record quiz attempt in MongoDB' });
  }
});

// POST Admin Login (Returns JWT token)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const admin = await AdminUser.findOne({ username: username.trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid administrator credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid administrator credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

// GET current admin profile (Token verification)
app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({ success: true, user: req.adminUser });
});

// GET Admin Dashboard Statistics (Protected - Aggregates directly from MongoDB)
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    // Strictly exclude practice mode attempts from corporate analytics
    const nonPracticeMatch = { completed: { $ne: false }, isPracticeQuiz: { $ne: true } };
    const totalParticipants = await QuizAttempt.countDocuments(nonPracticeMatch);
    const inProgressSessions = await QuizSession.countDocuments({ status: 'in_progress' });
    
    if (totalParticipants === 0) {
      return res.json({
        success: true,
        data: {
          totalParticipants: 0,
          inProgressSessions,
          averageScore: 0,
          averagePercentage: 0,
          completionRate: 0,
          averageCompletionTime: '0m 00s',
          mostCommonlyMissedQuestion: 'No completed quiz attempts recorded yet',
          categoryPerformance: [
            { name: 'Phishing Detection', averagePercentage: 0 },
            { name: 'Social Engineering', averagePercentage: 0 },
            { name: 'Password Safety', averagePercentage: 0 },
            { name: 'Incident Response', averagePercentage: 0 },
            { name: 'Remote Work Safety', averagePercentage: 0 }
          ],
          levelDistribution: {
            'Cyber Champion': 0,
            'Cyber Defender': 0,
            'Security Aware': 0,
            'Needs Practice': 0
          },
          recentAttempts: []
        }
      });
    }

    const aggregateScores = await QuizAttempt.aggregate([
      { $match: nonPracticeMatch },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          avgPercentage: { $avg: '$percentage' },
          avgTime: { $avg: '$completionTimeSeconds' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' }
        }
      }
    ]);

    const stats = aggregateScores[0] || { avgScore: 0, avgPercentage: 0, avgTime: 0 };
    const avgScore = Math.round(stats.avgScore || 0);
    const avgPercentage = Math.round(stats.avgPercentage || 0);
    const avgTime = Math.round(stats.avgTime || 0);
    const avgMinutes = Math.floor(avgTime / 60);
    const avgSecs = Math.floor(avgTime % 60).toString().padStart(2, '0');

    // Level distribution (non-practice only)
    const levelCounts = await QuizAttempt.aggregate([
      { $match: nonPracticeMatch },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);
    const levelDistribution = {
      'Cyber Champion': 0,
      'Cyber Defender': 0,
      'Security Aware': 0,
      'Needs Practice': 0
    };
    levelCounts.forEach(l => {
      if (l._id && levelDistribution[l._id] !== undefined) {
        levelDistribution[l._id] = l.count;
      }
    });

    // Category Performance & Missed Questions (non-practice only)
    const attempts = await QuizAttempt.find(nonPracticeMatch).select('categoryBreakdown answers').lean();
    const categoryTotals = {
      'Phishing Detection': { totalPct: 0, count: 0 },
      'Social Engineering': { totalPct: 0, count: 0 },
      'Password Safety': { totalPct: 0, count: 0 },
      'Incident Response': { totalPct: 0, count: 0 },
      'Remote Work Safety': { totalPct: 0, count: 0 }
    };

    const questionMissCount = {};

    attempts.forEach(att => {
      if (att.categoryBreakdown) {
        Object.entries(att.categoryBreakdown).forEach(([cat, data]) => {
          if (categoryTotals[cat] && data && typeof data.percentage === 'number') {
            categoryTotals[cat].totalPct += data.percentage;
            categoryTotals[cat].count++;
          }
        });
      }

      if (att.answers && Array.isArray(att.answers)) {
        att.answers.forEach(ans => {
          const key = ans.questionTitle || ans.questionId;
          if (!questionMissCount[key]) {
            questionMissCount[key] = { title: key, misses: 0, total: 0 };
          }
          questionMissCount[key].total++;
          if (!ans.isCorrect) {
            questionMissCount[key].misses++;
          }
        });
      }
    });

    const categoryPerformance = Object.entries(categoryTotals).map(([name, val]) => ({
      name,
      averagePercentage: val.count > 0 ? Math.round(val.totalPct / val.count) : 0
    }));

    // Most missed question
    let mostMissed = 'None identified yet';
    let highestMissRatio = 0;
    Object.values(questionMissCount).forEach(item => {
      const ratio = item.total > 0 ? item.misses / item.total : 0;
      if (ratio > highestMissRatio && item.misses > 0) {
        highestMissRatio = ratio;
        mostMissed = `${item.title} (${Math.round(ratio * 100)}% miss rate)`;
      }
    });

    // Calculate real completion rate: completed non-practice / (completed non-practice + in_progress sessions)
    const totalInitiated = totalParticipants + inProgressSessions;
    const completionRate = totalInitiated > 0 ? Math.round((totalParticipants / totalInitiated) * 100) : 100;

    // Recent attempts from MongoDB (non-practice only, no email)
    const recentAttempts = await QuizAttempt.find(nonPracticeMatch)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('participantName department score maxScore percentage level completionTimeSeconds createdAt sessionId')
      .lean();

    res.json({
      success: true,
      data: {
        totalParticipants,
        inProgressSessions,
        averageScore: avgScore,
        averagePercentage: avgPercentage,
        completionRate,
        averageCompletionTime: `${avgMinutes}m ${avgSecs}s`,
        mostCommonlyMissedQuestion: mostMissed,
        categoryPerformance,
        levelDistribution,
        recentAttempts
      }
    });
  } catch (err) {
    console.error('Error calculating admin stats from MongoDB:', err);
    res.status(500).json({ success: false, error: 'Failed to aggregate admin analytics' });
  }
});

// GET recent attempts list from MongoDB (Protected, non-practice only)
app.get('/api/admin/attempts', requireAdminAuth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ isPracticeQuiz: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-email')
      .lean();
    res.json({ success: true, count: attempts.length, data: attempts });
  } catch (err) {
    console.error('Error fetching admin attempts from MongoDB:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve attempts' });
  }
});

// DELETE single quiz attempt and unblock participant (Protected)
app.delete('/api/admin/attempts/:id', requireAdminAuth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByIdAndDelete(req.params.id);
    if (attempt && attempt.sessionId) {
      await QuizSession.findByIdAndDelete(attempt.sessionId);
    }
    res.json({ success: true, message: 'Attempt and associated session deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete attempt' });
  }
});

// Clear all quiz attempts and test sessions from MongoDB (Protected)
app.post('/api/admin/reset-demo', requireAdminAuth, async (req, res) => {
  try {
    await QuizAttempt.deleteMany({});
    await QuizSession.deleteMany({});
    res.json({ success: true, message: 'All quiz attempts and test sessions cleared successfully from MongoDB' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear records' });
  }
});

// Fallback: If anyone visits port 5000 directly, seamlessly redirect them to the single UI URL: http://localhost:3002
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.redirect(`http://localhost:3002${req.originalUrl}`);
});

// Start server
async function start() {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();
    app.listen(PORT, () => {
      console.log(`[Cyber Defender API] Running in background on port ${PORT} (MongoDB connected).`);
      console.log(`➜ SINGLE APPLICATION URL: http://localhost:3002`);
    });
  } catch (err) {
    console.error('[Cyber Defender Server] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
