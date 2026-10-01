import { Question, QuizAttempt, AdminStats, QuestionCategory } from '../types';
import { fallbackQuestions } from '../data/fallbackQuestions';

const API_BASE = '/api';
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
