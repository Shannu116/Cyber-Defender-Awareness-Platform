import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizSessionData, QuizAttempt, SessionStartResponse, SessionResumeResponse } from '../types';
import { 
  getStoredSession, 
  setStoredSession, 
  clearStoredSession, 
  fetchSession, 
  startSession as apiStartSession, 
  saveSessionAnswer as apiSaveSessionAnswer, 
  resumeSession as apiResumeSession, 
  completeSession as apiCompleteSession 
} from '../services/api';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useSession(totalQuestions = 10) {
  const [session, setSession] = useState<QuizSessionData | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [resumePromptData, setResumePromptData] = useState<{
    participantName: string;
    department: string;
    currentIndex: number;
    totalQuestions: number;
    activeSeconds: number;
    resumeCode: string;
    answers: QuizSessionData['answers'];
    completedAttempt?: QuizAttempt | null;
  } | null>(null);

  // Check stored session on mount
  useEffect(() => {
    async function initStoredSession() {
      const stored = getStoredSession();
      if (!stored) return;

      setIsColdStarting(true);
      try {
        const result = await fetchSession(stored.sessionId, stored.deviceToken);
        if (result.session) {
          setDeviceToken(stored.deviceToken);
          setSession(result.session);

          if (result.session.status === 'in_progress') {
            setResumePromptData({
              participantName: result.session.participantName,
              department: result.session.department,
              currentIndex: result.session.currentIndex,
              totalQuestions: result.session.questionIds?.length || totalQuestions,
              activeSeconds: result.session.activeSeconds || 0,
              resumeCode: result.session.resumeCode,
              answers: result.session.answers || []
            });
          } else if (result.session.status === 'completed') {
            setResumePromptData({
              participantName: result.session.participantName,
              department: result.session.department,
              currentIndex: totalQuestions,
              totalQuestions: result.session.questionIds?.length || totalQuestions,
              activeSeconds: result.session.activeSeconds || 0,
              resumeCode: result.session.resumeCode,
              answers: result.session.answers || [],
              completedAttempt: result.attempt || null
            });
          }
        }
      } catch (err: any) {
        if (err.message === 'SESSION_INVALID') {
          clearStoredSession();
        }
        console.warn('Could not auto-restore session:', err.message);
      } finally {
        setIsColdStarting(false);
      }
    }

    initStoredSession();
  }, [totalQuestions]);

  const startNewSession = useCallback(async (
    participantName: string, 
    department: string, 
    email?: string
  ): Promise<SessionStartResponse> => {
    setIsColdStarting(true);
    try {
      const response = await apiStartSession({ participantName, department, email });
      setDeviceToken(response.deviceToken);
      setSession({
        id: response.sessionId,
        participantName: response.participantName,
        department: response.department,
        status: 'in_progress',
        currentIndex: 0,
        activeSeconds: 0,
        resumeCode: response.resumeCode,
        answers: [],
        questionIds: response.questionIds,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      });
      setResumePromptData(null);
      return response;
    } finally {
      setIsColdStarting(false);
    }
  }, []);

  const saveAnswer = useCallback(async (payload: {
    questionId: string;
    questionTitle?: string;
    category?: string;
    userResponse: any;
    timeSpentSeconds: number;
  }) => {
    if (!session || !deviceToken) return;

    setSaveStatus('saving');
    try {
      const result = await apiSaveSessionAnswer(session.id, deviceToken, payload);
      setSaveStatus('saved');
      setSession(prev => prev ? {
        ...prev,
        currentIndex: result.currentIndex,
        activeSeconds: result.activeSeconds,
        answers: [
          ...prev.answers.filter(a => a.questionId !== payload.questionId),
          {
            questionId: payload.questionId,
            questionTitle: payload.questionTitle,
            category: payload.category,
            userResponse: payload.userResponse,
            timeSpentSeconds: payload.timeSpentSeconds,
            answeredAt: new Date().toISOString()
          }
        ]
      } : null);

      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to autosave answer:', err);
      setSaveStatus('error');
    }
  }, [session, deviceToken]);

  const resumeWithCredentials = useCallback(async (payload: {
    participantName: string;
    department: string;
    resumeCode?: string;
    email?: string;
  }): Promise<SessionResumeResponse> => {
    setIsColdStarting(true);
    try {
      const result = await apiResumeSession(payload);
      setDeviceToken(result.deviceToken);
      setSession(result.session);
      setResumePromptData(null);
      return result;
    } finally {
      setIsColdStarting(false);
    }
  }, []);

  const completeActiveSession = useCallback(async (): Promise<QuizAttempt> => {
    if (!session || !deviceToken) {
      throw new Error('No active session to complete.');
    }

    const attempt = await apiCompleteSession(session.id, deviceToken);
    setSession(prev => prev ? { ...prev, status: 'completed', attemptId: attempt._id } : null);
    return attempt;
  }, [session, deviceToken]);

  const dismissResumePrompt = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setDeviceToken(null);
    setResumePromptData(null);
  }, []);

  return {
    session,
    deviceToken,
    resumeCode: session?.resumeCode || null,
    saveStatus,
    isColdStarting,
    resumePromptData,
    startNewSession,
    saveAnswer,
    resumeWithCredentials,
    completeActiveSession,
    dismissResumePrompt
  };
}
