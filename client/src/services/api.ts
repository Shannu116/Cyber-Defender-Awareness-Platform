import {
  Question,
  QuizAttempt,
  AdminStats,
  QuestionCategory,
  QuizSessionData,
  SessionStartResponse,
  SessionResumeResponse,
} from '../types';
import { fallbackQuestions } from '../data/fallbackQuestions';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api`
  : '/api';
const TOKEN_KEY = 'cyber_defender_admin_token';

// --- Admin Authentication Token Management ---

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken());
}

export async function adminLogin(username: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Invalid administrator username or password.');
  }

  setAdminToken(json.token);
  return json;
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// --- Challenges API ---

export async function fetchQuestions(): Promise<Question[]> {
  try {
    const res = await fetch(`${API_BASE}/questions`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json.data;
    }
    return fallbackQuestions;
  } catch (err) {
    console.warn('[API] Could not connect to backend, using embedded challenges:', err);
    return fallbackQuestions;
  }
}

export async function fetchWeakAreaQuestions(categories: QuestionCategory[]): Promise<Question[]> {
  try {
    const params = new URLSearchParams({ categories: categories.join(',') });
    const res = await fetch(`${API_BASE}/questions/weak-areas?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[API] Fetch weak areas fallback:', err);
    const filtered = fallbackQuestions.filter(q => categories.includes(q.category));
    return filtered.length > 0 ? filtered : fallbackQuestions.slice(0, 4);
  }
}

// --- Submit Attempt to MongoDB ---

export async function submitQuizAttempt(payload: {
  participantName: string;
  department: string;
  answers: Array<{
    questionId: string;
    questionTitle: string;
    category: QuestionCategory;
    userResponse: any;
    timeSpentSeconds: number;
  }>;
  completionTimeSeconds: number;
  isPracticeQuiz?: boolean;
}): Promise<QuizAttempt> {
  try {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error! status: ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('[API] Failed to submit quiz attempt to MongoDB:', err);
    throw err;
  }
}

// --- Admin Analytics from MongoDB ---

export async function fetchAdminStats(): Promise<AdminStats> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/admin/stats`, { headers });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchAdminAttempts(): Promise<QuizAttempt[]> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/admin/attempts`, { headers });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function resetAdminDemo(): Promise<void> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/admin/reset-demo`, {
    method: 'POST',
    headers
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
}

export async function adminResetSession(sessionId: string): Promise<void> {
  const token = getAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/session/admin/${sessionId}/reset`, {
    method: 'POST',
    headers
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `HTTP error! status: ${res.status}`);
  }
}

export async function adminDeleteAttempt(attemptId: string): Promise<void> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/admin/attempts/${attemptId}`, {
    method: 'DELETE',
    headers
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `HTTP error! status: ${res.status}`);
  }
}

export async function fetchAdminInProgressSessions(): Promise<QuizSessionData[]> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/session/admin/in-progress`, { headers });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// --- Participant Session Management ---

const SESSION_STORAGE_KEY = 'cyber_defender_session';

export function getStoredSession(): { sessionId: string; deviceToken: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.sessionId && parsed.deviceToken) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredSession(sessionId: string, deviceToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessionId, deviceToken }));
  } catch (e) {
    console.warn('Could not save session to localStorage:', e);
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear session from localStorage:', e);
  }
}

export async function startSession(payload: {
  participantName: string;
  department: string;
  email?: string;
}): Promise<SessionStartResponse> {
  const res = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const error: any = new Error(json.error || 'A session already exists for this participant and department.');
    error.isDuplicate = true;
    error.isCompleted = Boolean(json.isCompleted);
    throw error;
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error || `HTTP error! status: ${res.status}`);
  }

  setStoredSession(json.sessionId, json.deviceToken);
  return json;
}

export async function fetchSession(
  sessionId: string,
  deviceToken: string
): Promise<{ session: QuizSessionData; attempt?: QuizAttempt | null }> {
  const res = await fetch(`${API_BASE}/session/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${deviceToken}`
    }
  });

  if (res.status === 401 || res.status === 404) {
    clearStoredSession();
    throw new Error('SESSION_INVALID');
  }

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  return json;
}

export async function saveSessionAnswer(
  sessionId: string,
  deviceToken: string,
  payload: {
    questionId: string;
    questionTitle?: string;
    category?: string;
    userResponse: any;
    timeSpentSeconds: number;
  },
  retries = 3
): Promise<{ currentIndex: number; activeSeconds: number; answersCount: number }> {
  let attempt = 0;
  let delay = 1000;

  while (attempt < retries) {
    try {
      const res = await fetch(`${API_BASE}/session/${sessionId}/answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deviceToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      return json;
    } catch (err: any) {
      attempt++;
      if (attempt >= retries) {
        throw err;
      }
      // Wait with backoff before next attempt
      await new Promise(r => setTimeout(r, delay));
      delay *= 1.5;
    }
  }

  throw new Error('Failed to record answer after repeated attempts.');
}

export async function resumeSession(payload: {
  participantName: string;
  department: string;
  resumeCode?: string;
  email?: string;
}): Promise<SessionResumeResponse> {
  const res = await fetch(`${API_BASE}/session/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'The details provided do not match any active test session.');
  }

  setStoredSession(json.sessionId, json.deviceToken);
  return json;
}

export async function completeSession(
  sessionId: string,
  deviceToken: string
): Promise<QuizAttempt> {
  const res = await fetch(`${API_BASE}/session/${sessionId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deviceToken}`
    }
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  clearStoredSession();
  return json.data || json.attempt;
}

