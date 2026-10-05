import express from 'express';
import QuizSession from '../models/QuizSession.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Question from '../models/Question.js';
import { 
  normalizeName, 
  isValidName, 
  isValidEmail, 
  generateResumeCode, 
  normalizeResumeCode, 
  generateDeviceToken, 
  hashDeviceToken 
} from '../utils/sessionCrypto.js';
import { isValidDepartment } from '../constants/departments.js';
import { gradeAnswers } from '../services/evaluation.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limiters to defend against name enumeration and brute forcing
const startLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many registration requests from this connection. Please wait a few minutes before trying again.'
});

const resumeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many resume attempts. Please wait 15 minutes before attempting again.'
});

/**
 * Helper to extract Bearer deviceToken from request headers
 */
function getDeviceToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1]?.trim() || null;
}

/**
 * POST /api/session/start
 * Registers a new session with atomic uniqueness check
 */
router.post('/start', startLimiter, async (req, res) => {
  try {
    const { participantName, department, email } = req.body || {};

    if (!isValidName(participantName)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid name (2 to 60 characters, letters only).'
      });
    }

    if (!isValidDepartment(department)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid department from the organization directory.'
      });
    }

    let cleanEmail = undefined;
    if (email && typeof email === 'string' && email.trim().length > 0) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'The email format entered is invalid.'
        });
      }
      cleanEmail = email.trim().toLowerCase();
    }

    const trimmedName = participantName.trim();
    const trimmedDept = department.trim();
    const nameKey = normalizeName(trimmedName);

    // Pre-check for duplicate active or completed session (nameKey is always lowercased,
    // so "Red Criminal", "red criminal", "RED CRIMINAL" all produce the same nameKey)
    const existing = await QuizSession.findOne({ nameKey, department: trimmedDept });
    if (existing) {
      const storedName = existing.participantName; // use original registered casing in message
      if (existing.status === 'in_progress') {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          error: `Someone has already registered as "${storedName}" in ${trimmedDept}. If that's you, resume your test below. If you're a different person, add your middle initial or choose your correct department.`
        });
      } else {
        // Fetch the completed attempt record from MongoDB
        let attemptData = null;
        if (existing.attemptId) {
          attemptData = await QuizAttempt.findById(existing.attemptId);
        }
        if (!attemptData) {
          attemptData = await QuizAttempt.findOne({
            participantName: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
            department: trimmedDept
          });
        }

        return res.status(409).json({
          success: false,
          isDuplicate: true,
          isCompleted: true,
          attemptId: existing.attemptId || (attemptData ? attemptData._id : null),
          attempt: attemptData,
          error: `"${storedName}" in ${trimmedDept} has already completed the cybersecurity awareness test. Retakes are not permitted.`
        });
      }
    }

    // Also check QuizAttempt directly to ensure no completed attempt exists
    const directAttempt = await QuizAttempt.findOne({
      participantName: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      department: trimmedDept,
      completed: true,
      isPracticeQuiz: { $ne: true }
    });
    if (directAttempt) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        isCompleted: true,
        attemptId: directAttempt._id,
        attempt: directAttempt,
        error: `"${directAttempt.participantName}" in ${trimmedDept} has already completed the cybersecurity awareness test. Retakes are not permitted.`
      });
    }

    // Capture snapshot of question IDs in order
    const questions = await Question.find().sort({ order: 1 }).select('id');
    const questionIds = questions.map(q => q.id);

    const deviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(deviceToken);
    const resumeCode = generateResumeCode();

    const session = new QuizSession({
      nameKey,
      participantName: trimmedName,
      department: trimmedDept,
      email: cleanEmail,
      questionIds,
      currentIndex: 0,
      activeSeconds: 0,
      answers: [],
      resumeCode,
      deviceTokenHash,
      startedAt: new Date(),
      lastActivityAt: new Date()
    });

    await session.save();

    console.log(`[QuizSession] Created session ID=${session._id} for "${session.participantName}" (${session.department})`);

    // Return session data with deviceToken (email is NEVER sent back)
    return res.status(201).json({
      success: true,
      sessionId: session._id,
      deviceToken,
      resumeCode: session.resumeCode,
      currentIndex: 0,
      participantName: session.participantName,
      department: session.department,
      questionIds: session.questionIds
    });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition safety caught by MongoDB unique index
      const trimmedName = (req.body?.participantName || '').trim();
      const trimmedDept = (req.body?.department || '').trim();
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        error: `Someone has already registered as "${trimmedName}" in ${trimmedDept}. If that's you, resume your test below. If you're a different person, add your middle initial or choose your correct department.`
      });
    }
    console.error('[QuizSession] Error starting session:', err);
    return res.status(500).json({ success: false, error: 'Failed to initialize test session.' });
  }
});

/**
 * GET /api/session/:id
 * Retrieves current session state on the same device
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deviceToken = getDeviceToken(req);

    if (!deviceToken) {
      return res.status(401).json({ success: false, error: 'Device token required.' });
    }

    const session = await QuizSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    const tokenHash = hashDeviceToken(deviceToken);
    if (session.deviceTokenHash !== tokenHash) {
      return res.status(401).json({ success: false, error: 'Device token does not match active session.' });
    }

    let attemptData = null;
    if (session.status === 'completed' && session.attemptId) {
      attemptData = await QuizAttempt.findById(session.attemptId);
    }

    return res.json({
      success: true,
      session: {
        id: session._id,
        participantName: session.participantName,
        department: session.department,
        status: session.status,
        currentIndex: session.currentIndex,
        activeSeconds: session.activeSeconds,
        resumeCode: session.resumeCode,
        answers: session.answers,
        questionIds: session.questionIds,
        attemptId: session.attemptId,
        startedAt: session.startedAt,
        lastActivityAt: session.lastActivityAt
      },
      attempt: attemptData
    });
  } catch (err) {
    console.error('[QuizSession] Error retrieving session:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve session.' });
  }
});

/**
 * PUT /api/session/:id/answer
 * Autosaves an answer idempotently
 */
router.put('/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const deviceToken = getDeviceToken(req);

    if (!deviceToken) {
      return res.status(401).json({ success: false, error: 'Device token required.' });
    }

    const session = await QuizSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    const tokenHash = hashDeviceToken(deviceToken);
    if (session.deviceTokenHash !== tokenHash) {
      return res.status(401).json({ success: false, error: 'Device token does not match active session.' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Session is already completed.' });
    }

    const { questionId, questionTitle, category, userResponse, timeSpentSeconds } = req.body || {};
    if (!questionId) {
      return res.status(400).json({ success: false, error: 'questionId is required.' });
    }

    const elapsed = Math.max(1, Number(timeSpentSeconds) || 0);

    // Idempotent upsert by questionId
    const existingIndex = session.answers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      session.answers[existingIndex].userResponse = userResponse;
      session.answers[existingIndex].timeSpentSeconds = elapsed;
      session.answers[existingIndex].answeredAt = new Date();
      if (questionTitle) session.answers[existingIndex].questionTitle = questionTitle;
      if (category) session.answers[existingIndex].category = category;
    } else {
      session.answers.push({
        questionId,
        questionTitle: questionTitle || 'Challenge',
        category: category || 'General',
        userResponse,
        timeSpentSeconds: elapsed,
        answeredAt: new Date()
      });
      session.activeSeconds = (session.activeSeconds || 0) + elapsed;
    }

    // Determine current index based on answered questions
    const questionIds = session.questionIds || [];
    const answeredIds = new Set(session.answers.map(a => a.questionId));
    let nextIndex = questionIds.findIndex(qid => !answeredIds.has(qid));
    if (nextIndex === -1) {
      nextIndex = questionIds.length;
    }
    session.currentIndex = nextIndex;
    session.lastActivityAt = new Date();

    await session.save();

    return res.json({
      success: true,
      currentIndex: session.currentIndex,
      activeSeconds: session.activeSeconds,
      answersCount: session.answers.length
    });
  } catch (err) {
    console.error('[QuizSession] Error saving answer:', err);
    return res.status(500).json({ success: false, error: 'Failed to record answer.' });
  }
});

/**
 * POST /api/session/resume
 * Resumes on another device or after clearing storage
 */
router.post('/resume', resumeLimiter, async (req, res) => {
  try {
    const { participantName, department, resumeCode, email } = req.body || {};

    if (!participantName || !department) {
      return res.status(400).json({
        success: false,
        error: 'Participant name and department are required to locate your session.'
      });
    }

    const trimmedName = participantName.trim();
    const trimmedDept = department.trim();
    const nameKey = normalizeName(trimmedName);

    // Query session including hidden email field for internal verification
    const session = await QuizSession.findOne({
      nameKey,
      department: trimmedDept
    }).select('+email');

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'The details provided do not match any active test session. Please check your spelling, department, or resume code.'
      });
    }

    let isAuthorized = false;

    // 1. Verify via 8-character Resume Code
    if (resumeCode && typeof resumeCode === 'string' && resumeCode.trim().length > 0) {
      const inputNorm = normalizeResumeCode(resumeCode);
      const sessionNorm = normalizeResumeCode(session.resumeCode);
      if (inputNorm && sessionNorm && inputNorm === sessionNorm) {
        isAuthorized = true;
      }
    }

    // 2. Or verify via optional matching email if given
    if (!isAuthorized && email && typeof email === 'string' && email.trim().length > 0) {
      if (session.email && email.trim().toLowerCase() === session.email.toLowerCase()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        error: 'The details provided do not match any active test session. Please check your spelling, department, or resume code.'
      });
    }

    // Issue a NEW deviceToken for this newly resumed device
    const newDeviceToken = generateDeviceToken();
    session.deviceTokenHash = hashDeviceToken(newDeviceToken);
    session.lastActivityAt = new Date();
    await session.save();

    console.log(`[QuizSession] Resumed session ID=${session._id} for "${session.participantName}" on new device`);

    let attemptData = null;
    if (session.status === 'completed') {
      if (session.attemptId) {
        attemptData = await QuizAttempt.findById(session.attemptId);
      }
      if (!attemptData) {
        attemptData = await QuizAttempt.findOne({
          participantName: { $regex: new RegExp(`^${session.participantName}$`, 'i') },
          department: session.department
        });
      }
    }

    // Return session data (NEVER returning email!)
    return res.json({
      success: true,
      sessionId: session._id,
      deviceToken: newDeviceToken,
      resumeCode: session.resumeCode,
      session: {
        id: session._id,
        participantName: session.participantName,
        department: session.department,
        status: session.status,
        currentIndex: session.currentIndex,
        activeSeconds: session.activeSeconds,
        resumeCode: session.resumeCode,
        answers: session.answers,
        questionIds: session.questionIds,
        attemptId: session.attemptId
      },
      attempt: attemptData
    });
  } catch (err) {
    console.error('[QuizSession] Error resuming session:', err);
    return res.status(500).json({ success: false, error: 'Failed to resume test session.' });
  }
});

/**
 * POST /api/session/:id/complete
 * Evaluates session answers, records QuizAttempt, and marks session completed
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const deviceToken = getDeviceToken(req);

    if (!deviceToken) {
      return res.status(401).json({ success: false, error: 'Device token required.' });
    }

    const session = await QuizSession.findById(id).select('+email');
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    const tokenHash = hashDeviceToken(deviceToken);
    if (session.deviceTokenHash !== tokenHash) {
      return res.status(401).json({ success: false, error: 'Device token does not match active session.' });
    }

    if (session.status === 'completed' && session.attemptId) {
      const existingAttempt = await QuizAttempt.findById(session.attemptId);
      if (existingAttempt) {
        return res.json({ success: true, data: existingAttempt });
      }
    }

    // Fetch official questions from MongoDB to grade answers
    const questions = await Question.find();
    const graded = gradeAnswers(questions, session.answers);

    const newAttempt = new QuizAttempt({
      participantName: session.participantName,
      department: session.department,
      email: session.email || undefined,   // carry email from session → stored with select:false
      score: graded.totalScore,
      maxScore: graded.totalMaxScore,
      percentage: graded.finalPercentage,
      level: graded.finalLevel,
      completionTimeSeconds: session.activeSeconds,
      completed: true,
      answers: graded.evaluatedAnswers,
      categoryBreakdown: graded.categoryBreakdown,
      recommendations: graded.recommendations,
      isPracticeQuiz: false,
      sessionId: session._id
    });

    const savedAttempt = await newAttempt.save();

    session.status = 'completed';
    session.attemptId = savedAttempt._id;
    session.lastActivityAt = new Date();
    await session.save();

    console.log(`[QuizSession] Completed session ID=${session._id} -> Attempt ID=${savedAttempt._id} with Score=${savedAttempt.score}`);

    return res.json({
      success: true,
      data: savedAttempt
    });
  } catch (err) {
    console.error('[QuizSession] Error completing session:', err);
    return res.status(500).json({ success: false, error: 'Failed to complete session.' });
  }
});

/**
 * POST /api/admin/session/:id/reset
 * Protected: Admin-only reset of a participant's session
 */
router.post('/admin/:id/reset', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await QuizSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    // Delete session so the { nameKey, department } can be used again
    await QuizSession.findByIdAndDelete(id);

    console.log(`[QuizSession] Admin reset session ID=${id} for "${session.participantName}" (${session.department})`);

    return res.json({
      success: true,
      message: `Session for "${session.participantName}" in ${session.department} has been reset. The participant may now register freshly.`
    });
  } catch (err) {
    console.error('[QuizSession] Admin reset error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reset participant session.' });
  }
});

/**
 * GET /api/admin/sessions/in-progress
 * Protected: Lists active in-progress sessions (Zero emails returned)
 */
router.get('/admin/in-progress', requireAdminAuth, async (req, res) => {
  try {
    const activeSessions = await QuizSession.find({ status: 'in_progress' })
      .sort({ updatedAt: -1 })
      .select('participantName department currentIndex activeSeconds resumeCode createdAt updatedAt')
      .lean();

    return res.json({
      success: true,
      count: activeSessions.length,
      data: activeSessions
    });
  } catch (err) {
    console.error('[QuizSession] Error fetching in-progress sessions:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve in-progress sessions.' });
  }
});

export default router;
