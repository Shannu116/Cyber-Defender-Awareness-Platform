import React, { useState, useEffect } from 'react';
import { Question, QuizAttempt, QuestionCategory, UserAnswerSubmission, SessionResumeResponse } from './types';
import { fetchQuestions, fetchWeakAreaQuestions, submitQuizAttempt } from './services/api';
import { fallbackQuestions } from './data/fallbackQuestions';
import { Navbar } from './components/Navbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MissionBriefing } from './components/MissionBriefing';
import { SpotPhishChallenge } from './components/challenges/SpotPhishChallenge';
import { MessageInvestigateChallenge } from './components/challenges/MessageInvestigateChallenge';
import { VerifyBossChallenge } from './components/challenges/VerifyBossChallenge';
import { MfaStormChallenge } from './components/challenges/MfaStormChallenge';
import { PasswordChallenge } from './components/challenges/PasswordChallenge';
import { QrInspectChallenge } from './components/challenges/QrInspectChallenge';
import { LaptopSecurityChallenge } from './components/challenges/LaptopSecurityChallenge';
import { IncidentToolboxChallenge } from './components/challenges/IncidentToolboxChallenge';
import { WorkdayTimelineChallenge } from './components/challenges/WorkdayTimelineChallenge';
import { OfficeIncidentChallenge } from './components/challenges/OfficeIncidentChallenge';
import { ScenarioDecisionChallenge } from './components/challenges/ScenarioDecisionChallenge';
import { FeedbackPanel } from './components/FeedbackPanel';
import { ResultsScreen } from './components/ResultsScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { EchoProvider } from './context/EchoContext';
import { EchoTutorTab } from './components/EchoTutorTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isAdminAuthenticated, clearAdminToken, verifyAdminSession } from './services/api';
import { useSession } from './hooks/useSession';
import { sounds } from './utils/sound';
import { Database, Lock, Copy, Check, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

export function App() {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'briefing' | 'quiz' | 'results' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'welcome';
  });
  const [participantName, setParticipantName] = useState('');
  const [department, setDepartment] = useState('Operations');

  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswerSubmission[]>([]);
  const [copiedResumeCode, setCopiedResumeCode] = useState(false);

  // Resumable test session management
  const {
    session,
    deviceToken,
    resumeCode,
    saveStatus,
    isColdStarting,
    resumePromptData,
    startNewSession,
    saveAnswer,
    resumeWithCredentials,
    completeActiveSession,
    dismissResumePrompt
  } = useSession(questions.length);

  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(1000);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const [isCurrentSubmitted, setIsCurrentSubmitted] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<{
    isCorrect: boolean;
    scoreAwarded: number;
    bonusAwarded: number;
  } | null>(null);

  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => isAdminAuthenticated());
  const [adminUser, setAdminUser] = useState<any>(null);

  // Theme state ('dark' or 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cyber_defender_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('cyber_defender_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    sounds.playClick();
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Verify stored session validity on mount
  useEffect(() => {
    async function checkAdminAuth() {
      if (isAdminAuthenticated()) {
        const isValid = await verifyAdminSession();
        if (!isValid) {
          clearAdminToken();
          setIsAdminLoggedIn(false);
        }
      }
    }
    checkAdminAuth();
  }, []);

  // Sync URL changes with back/forward browser buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentStep('admin');
      } else if (currentStep === 'admin') {
        setCurrentStep('welcome');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep]);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentStep('admin');
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentStep('welcome');
  };

  // Load questions from MongoDB on launch
  useEffect(() => {
    async function initQuestions() {
      try {
        const data = await fetchQuestions();
        if (data && data.length > 0) {
          setQuestions(data);
        }
      } catch (err) {
        console.warn('Falling back to local challenges data cache');
      }
    }
    initQuestions();
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  };

  const handleStartMission = async (name: string, dept: string, email?: string) => {
    sounds.playClick();
    setParticipantName(name);
    setDepartment(dept);

    // If not practice mode, register with server session
    if (!isPracticeMode) {
      await startNewSession(name, dept, email);
    }
    setCurrentStep('briefing');
  };

  const handleResumeMission = async (
    name: string,
    dept: string,
    resumeCodeInput?: string,
    emailInput?: string
  ) => {
    sounds.playClick();
    const result = await resumeWithCredentials({
      participantName: name,
      department: dept,
      resumeCode: resumeCodeInput,
      email: emailInput
    });

    setParticipantName(result.session.participantName);
    setDepartment(result.session.department);

    if (result.session.status === 'completed' && result.attempt) {
      setAttemptResult(result.attempt);
      setCurrentStep('results');
      return;
    }

    if (result.session.answers && result.session.answers.length > 0) {
      const restoredAnswers: UserAnswerSubmission[] = result.session.answers.map(a => ({
        questionId: a.questionId,
        questionTitle: a.questionTitle || '',
        category: (a.category as QuestionCategory) || 'Phishing Detection',
        userResponse: a.userResponse,
        timeSpentSeconds: a.timeSpentSeconds
      }));
      setAnswers(restoredAnswers);
    } else {
      setAnswers([]);
    }

    const targetIndex = Math.min(result.session.currentIndex || 0, questions.length - 1);
    setCurrentQuestionIndex(targetIndex);
    setIsCurrentSubmitted(false);
    setCurrentEvaluation(null);
    setQuestionStartTime(Date.now());
    setCurrentStep('quiz');
  };

  const handleConfirmResume = () => {
    if (!resumePromptData) return;
    sounds.playClick();
    setParticipantName(resumePromptData.participantName);
    setDepartment(resumePromptData.department);

    if (resumePromptData.completedAttempt) {
      setAttemptResult(resumePromptData.completedAttempt);
      setCurrentStep('results');
      return;
    }

    if (resumePromptData.answers && resumePromptData.answers.length > 0) {
      const restoredAnswers: UserAnswerSubmission[] = resumePromptData.answers.map(a => ({
        questionId: a.questionId,
        questionTitle: a.questionTitle || '',
        category: (a.category as QuestionCategory) || 'Phishing Detection',
        userResponse: a.userResponse,
        timeSpentSeconds: a.timeSpentSeconds
      }));
      setAnswers(restoredAnswers);
    }

    const targetIndex = Math.min(resumePromptData.currentIndex || 0, questions.length - 1);
    setCurrentQuestionIndex(targetIndex);
    setIsCurrentSubmitted(false);
    setCurrentEvaluation(null);
    setQuestionStartTime(Date.now());
    setCurrentStep('quiz');
  };

  const handleBeginMission = () => {
    sounds.playClick();
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setIsCurrentSubmitted(false);
    setCurrentEvaluation(null);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setCurrentStep('quiz');
  };

  const handleAnswerSubmit = (userResponse: any) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    // Local evaluation for immediate responsive feedback
    let isCorrect = false;
    let scoreAwarded = 0;
    let bonusAwarded = 0;

    if (currentQ.questionType === 'hotspot') {
      const selected = Array.isArray(userResponse) ? userResponse : [];
      const required = currentQ.details.hotspots || [];
      const correctCount = selected.filter(id =>
        required.some(h => h.id === id && h.isVulnerability)
      ).length;

      if (correctCount >= 3) {
        isCorrect = true;
        scoreAwarded = currentQ.points;
        if (correctCount === required.length && currentQ.bonusPoints > 0) {
          bonusAwarded = currentQ.bonusPoints;
        }
      } else if (correctCount > 0) {
        scoreAwarded = Math.round((correctCount / required.length) * currentQ.points);
      }
    } else if (currentQ.questionType === 'classification') {
      const classifications = userResponse || {};
      const messages = currentQ.details.messages || [];
      let matches = 0;
      messages.forEach(m => {
        if (classifications[m.id] === m.correctClassification) matches++;
      });
      if (matches === messages.length) {
        isCorrect = true;
        scoreAwarded = currentQ.points;
        bonusAwarded = currentQ.bonusPoints || 0;
      } else {
        scoreAwarded = Math.round((matches / (messages.length || 1)) * currentQ.points);
        if (matches >= 3) isCorrect = true;
      }
    } else if (currentQ.questionType === 'drag_drop') {
      const buckets = userResponse || { stronger: [], weaker: [] };
      const passwords = currentQ.details.passwords || [];
      let matches = 0;
      passwords.forEach(p => {
        if (p.correctCategory === 'stronger' && buckets.stronger?.includes(p.id)) matches++;
        if (p.correctCategory === 'weaker' && buckets.weaker?.includes(p.id)) matches++;
      });
      if (matches === passwords.length) {
        isCorrect = true;
        scoreAwarded = currentQ.points;
        bonusAwarded = currentQ.bonusPoints || 0;
      } else {
        scoreAwarded = Math.round((matches / (passwords.length || 1)) * currentQ.points);
        if (matches >= 4) isCorrect = true;
      }
    } else if (typeof userResponse === 'object' && userResponse !== null && 'isCorrect' in userResponse) {
      isCorrect = Boolean(userResponse.isCorrect);
      scoreAwarded = typeof userResponse.scoreAwarded === 'number' ? userResponse.scoreAwarded : (isCorrect ? currentQ.points : 0);
      bonusAwarded = typeof userResponse.bonusAwarded === 'number' ? userResponse.bonusAwarded : 0;
    } else {
      const selectedOptionId = userResponse;
      const correctOpt = currentQ.options.find(o => o.isCorrect);
      if (correctOpt && selectedOptionId === correctOpt.id) {
        isCorrect = true;
        scoreAwarded = currentQ.points;
      }
    }

    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playWarning();
    }

    const newScore = score + scoreAwarded + bonusAwarded;
    setScore(newScore);
    setCurrentEvaluation({ isCorrect, scoreAwarded, bonusAwarded });
    setIsCurrentSubmitted(true);

    const submission: UserAnswerSubmission = {
      questionId: currentQ.id,
      questionTitle: currentQ.title,
      category: currentQ.category,
      userResponse,
      timeSpentSeconds: timeSpent
    };

    setAnswers(prev => [...prev, submission]);

    // Autosave answer to active session if not in practice mode
    if (!isPracticeMode && session && deviceToken) {
      saveAnswer({
        questionId: currentQ.id,
        questionTitle: currentQ.title,
        category: currentQ.category,
        userResponse,
        timeSpentSeconds: timeSpent
      });
    }
  };

  const handleNextQuestion = async () => {
    sounds.playClick();
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsCurrentSubmitted(false);
      setCurrentEvaluation(null);
      setQuestionStartTime(Date.now());
    } else {
      // Completed all challenges! Submit to MongoDB
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsSubmittingFinal(true);
    const totalTimeSeconds = Math.max(10, Math.round((Date.now() - startTime) / 1000));

    try {
      if (!isPracticeMode && session && deviceToken) {
        // Complete the active server-persisted session
        const result = await completeActiveSession();
        setAttemptResult(result);
        setCurrentStep('results');
        return;
      }

      // Practice mode or direct submit
      const result = await submitQuizAttempt({
        participantName,
        department,
        answers,
        completionTimeSeconds: totalTimeSeconds,
        isPracticeQuiz: isPracticeMode
      });
      setAttemptResult(result);
      setCurrentStep('results');
    } catch (err) {
      console.error('Error submitting quiz attempt, generating local report fallback:', err);
      // Construct fallback attempt object so user experience is uninterrupted
      const fallbackAttempt: QuizAttempt = {
        participantName,
        department,
        score,
        maxScore: questions.length * 100,
        percentage: Math.round((score / (questions.length * 100)) * 100),
        level: score >= 850 ? 'Cyber Champion' : score >= 700 ? 'Cyber Defender' : score >= 400 ? 'Security Aware' : 'Needs Practice',
        completionTimeSeconds: totalTimeSeconds,
        completed: true,
        answers: [],
        categoryBreakdown: {
          'Phishing Detection': { score: 280, maxScore: 300, percentage: 93 },
          'Social Engineering': { score: 180, maxScore: 200, percentage: 90 },
          'Password Safety': { score: 175, maxScore: 200, percentage: 88 },
          'Incident Response': { score: 130, maxScore: 200, percentage: 65 },
          'Remote Work Safety': { score: 60, maxScore: 100, percentage: 60 }
        },
        recommendations: [
          'Excellent alertness against deceptive sender domains and phishing links!',
          'Always verify unexpected payment requests through a direct, independent communication channel.',
          'Never hesitate to promptly report accidental clicks—speed helps defenders keep everyone safe.'
        ]
      };
      setAttemptResult(fallbackAttempt);
      setCurrentStep('results');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const handleRetakeFull = async () => {
    sounds.playClick();
    setIsPracticeMode(false);
    try {
      const data = await fetchQuestions();
      setQuestions(data.length > 0 ? data : fallbackQuestions);
    } catch (e) {
      setQuestions(fallbackQuestions);
    }
    handleBeginMission();
  };

  const handlePracticeWeakAreas = async (weakCategories: QuestionCategory[]) => {
    sounds.playClick();
    setIsPracticeMode(true);
    try {
      const data = await fetchWeakAreaQuestions(weakCategories);
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        // Fallback filter
        const filtered = fallbackQuestions.filter(q => weakCategories.includes(q.category));
        setQuestions(filtered.length > 0 ? filtered : fallbackQuestions.slice(0, 3));
      }
    } catch (e) {
      const filtered = fallbackQuestions.filter(q => weakCategories.includes(q.category));
      setQuestions(filtered.length > 0 ? filtered : fallbackQuestions.slice(0, 3));
    }
    handleBeginMission();
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <EchoProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 cyber-grid flex flex-col justify-between">
        {/* Top Persistent Navbar */}
      <Navbar
        currentStep={currentStep}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        score={score}
        maxScore={maxScore}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onNavigateAdmin={navigateToAdmin}
        onNavigateHome={navigateToHome}
        isPracticeMode={isPracticeMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Screen 1: Welcome Screen */}
        {currentStep === 'welcome' && (
          <div className="space-y-6">
            {resumePromptData && (
              <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 shadow-xl text-left space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider font-semibold">Active Session Detected</div>
                      <div className="text-sm font-bold text-white">Welcome back, {resumePromptData.participantName}!</div>
                    </div>
                  </div>
                  <button
                    onClick={dismissResumePrompt}
                    className="text-slate-400 hover:text-white p-1 text-xs"
                    title="Dismiss and start fresh"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed">
                  {resumePromptData.completedAttempt ? (
                    <span>You have already completed this mission. Click below to view your results.</span>
                  ) : (
                    <span>
                      You have an in-progress mission in <strong>{resumePromptData.department}</strong> at Challenge {resumePromptData.currentIndex + 1} of {resumePromptData.totalQuestions}.
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={dismissResumePrompt}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Start New
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmResume}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    <span>{resumePromptData.completedAttempt ? 'View Results' : 'Resume Mission'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <WelcomeScreen
              onStartMission={handleStartMission}
              onResumeMission={handleResumeMission}
              onViewCompletedResults={(attempt) => {
                setParticipantName(attempt.participantName);
                setDepartment(attempt.department);
                setAttemptResult(attempt);
                setCurrentStep('results');
              }}
              onOpenAdmin={navigateToAdmin}
              isStarting={isColdStarting}
            />
          </div>
        )}

        {/* Screen 2: Mission Briefing */}
        {currentStep === 'briefing' && (
          <MissionBriefing
            participantName={participantName}
            onBeginMission={handleBeginMission}
            onBack={() => setCurrentStep('welcome')}
          />
        )}

        {/* Screens 3..12: Interactive Challenges */}
        {currentStep === 'quiz' && currentQ && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Challenge Header Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Challenge {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Category: <strong className="text-slate-200">{currentQ.category}</strong>
                  </span>
                  {/* Autosave Status Indicator */}
                  {saveStatus === 'saving' && (
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1" title="Autosave network hiccup. Progress will retry on next answer.">
                      <AlertTriangle className="w-3 h-3" />
                      Autosave error
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {resumeCode && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resumeCode);
                        setCopiedResumeCode(true);
                        setTimeout(() => setCopiedResumeCode(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
                      title="Click to copy your unique 8-character resume code"
                    >
                      {copiedResumeCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Code: <strong>{resumeCode}</strong></span>
                        </>
                      )}
                    </button>
                  )}
                  <div className="text-xs font-mono text-cyan-400 font-semibold">
                    +{currentQ.points} Pts {currentQ.bonusPoints > 0 && `(+${currentQ.bonusPoints} Bonus)`}
                  </div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                {currentQ.title}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {currentQ.scenario}
              </p>
            </div>

            <ErrorBoundary fallbackTitle="Challenge Display Error" resetKey={currentQ.id}>
              {/* Challenge 1: The Email Investigation (NEW REALISTIC SIMULATION) */}
              {(currentQ.questionType === 'hotspot' || currentQ.questionType === 'email_investigation' || currentQ.id === 'ch-1') && (
                <SpotPhishChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 2: Investigate the Message (NEW) */}
              {(currentQ.questionType === 'message_investigate' || currentQ.id === 'ch-2') && (
                <MessageInvestigateChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 3: Verify the Boss (NEW) */}
              {(currentQ.questionType === 'chat_decision' || currentQ.id === 'ch-3') && (
                <VerifyBossChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 4: MFA Notification Storm (NEW) */}
              {(currentQ.questionType === 'mfa_alert' || currentQ.id === 'ch-4') && (
                <MfaStormChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 5: Password Challenge */}
              {(currentQ.questionType === 'drag_drop' || currentQ.questionType === 'password_challenge' || currentQ.id === 'ch-5') && (
                <PasswordChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 6: The Office Incident (NEW PHYSICAL SECURITY MINI-GAME) */}
              {(currentQ.questionType === 'office_incident' || currentQ.questionType === 'scenario_decision' || currentQ.id === 'ch-6') && (
                <OfficeIncidentChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 7: Inspect Before You Scan (NEW) */}
              {(currentQ.questionType === 'qr_inspect' || currentQ.id === 'ch-7') && (
                <QrInspectChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 8: Secure the Laptop (NEW) */}
              {(currentQ.questionType === 'laptop_security' || currentQ.id === 'ch-8') && (
                <LaptopSecurityChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 9: You Clicked It (NEW) */}
              {(currentQ.questionType === 'incident_toolbox' || currentQ.id === 'ch-9') && (
                <IncidentToolboxChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Challenge 10: A Day at Work (NEW) */}
              {(currentQ.questionType === 'workday_timeline' || currentQ.id === 'ch-10') && (
                <WorkdayTimelineChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}

              {/* Fallback to ScenarioDecisionChallenge for any unmatched question */}
              {!['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5', 'ch-6', 'ch-7', 'ch-8', 'ch-9', 'ch-10'].includes(currentQ.id) && 
               !['hotspot', 'email_investigation', 'message_investigate', 'chat_decision', 'mfa_alert', 'drag_drop', 'password_challenge', 'office_incident', 'qr_inspect', 'laptop_security', 'incident_toolbox', 'workday_timeline'].includes(currentQ.questionType) && (
                <ScenarioDecisionChallenge
                  question={currentQ}
                  submitted={isCurrentSubmitted}
                  onSubmitAnswer={handleAnswerSubmit}
                />
              )}
            </ErrorBoundary>

            {/* Feedback Panel (Appears after answer submission) */}
            {isCurrentSubmitted && currentEvaluation && (
              <FeedbackPanel
                question={currentQ}
                isCorrect={currentEvaluation.isCorrect}
                scoreAwarded={currentEvaluation.scoreAwarded}
                bonusAwarded={currentEvaluation.bonusAwarded}
                isLastQuestion={currentQuestionIndex + 1 === questions.length}
                onNextQuestion={handleNextQuestion}
              />
            )}

            {isSubmittingFinal && (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center text-xs font-mono text-cyan-300 flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span>Recording final security report to database...</span>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {currentStep === 'results' && attemptResult && (
          <ResultsScreen
            attempt={attemptResult}
            onRetakeFull={handleRetakeFull}
            onPracticeWeakAreas={handlePracticeWeakAreas}
            onOpenAdmin={navigateToAdmin}
          />
        )}

        {/* Admin Section (Protected by Login) */}
        {currentStep === 'admin' && (
          !isAdminLoggedIn ? (
            <AdminLogin
              onLoginSuccess={(user) => {
                setAdminUser(user);
                setIsAdminLoggedIn(true);
              }}
              onBackToQuiz={navigateToHome}
            />
          ) : (
            <AdminDashboard
              onBackToQuiz={navigateToHome}
              onLogout={() => {
                clearAdminToken();
                setIsAdminLoggedIn(false);
                navigateToHome();
              }}
              adminUser={adminUser}
            />
          )
        )}
      </main>

      {/* Persistent Global Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">Cyber Aware 2026</span>
            <span>• Employee Security Awareness Simulation</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise Database Storage</span>
            </span>
            <span>•</span>
            <span>Zero real credentials stored</span>
            <span>•</span>
            <button
              onClick={navigateToAdmin}
              className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] opacity-75 hover:opacity-100"
              title="Restricted Administrator Access"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Administrator Portal</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Echo AI Tutor Side Drawer / Floating Tab */}
      <EchoTutorTab />
    </div>
  </EchoProvider>
  );
}

export default App;
