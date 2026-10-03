import React, { useState, useEffect } from 'react';
import { AdminStats, QuizAttempt, QuestionCategory, QuizSessionData } from '../types';
import { 
  fetchAdminStats, 
  fetchAdminAttempts, 
  resetAdminDemo,
  fetchAdminInProgressSessions,
  adminResetSession,
  adminDeleteAttempt
} from '../services/api';
import { 
  Users, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  RotateCcw, 
  Database, 
  ShieldCheck, 
  ArrowLeft, 
  TrendingUp, 
  Calendar,
  Layers,
  Sparkles,
  LogOut,
  UserCheck,
  Activity,
  Trash2,
  RefreshCw,
  PlayCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToQuiz: () => void;
  onLogout: () => void;
  adminUser?: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBackToQuiz, 
  onLogout,
  adminUser 
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [inProgressSessions, setInProgressSessions] = useState<QuizSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resettingSessionId, setResettingSessionId] = useState<string | null>(null);
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsResult, attemptsResult, inProgressResult] = await Promise.allSettled([
        fetchAdminStats(),
        fetchAdminAttempts(),
        fetchAdminInProgressSessions()
      ]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('Failed to fetch admin stats:', statsResult.reason);
        if (statsResult.reason?.message === 'UNAUTHORIZED') {
          onLogout();
          return;
        }
      }

      if (attemptsResult.status === 'fulfilled') {
        setAttempts(attemptsResult.value || []);
      } else {
        console.error('Failed to fetch admin attempts:', attemptsResult.reason);
        if (attemptsResult.reason?.message === 'UNAUTHORIZED') {
          onLogout();
          return;
        }
      }

      if (inProgressResult.status === 'fulfilled') {
        setInProgressSessions(inProgressResult.value || []);
      } else {
        console.error('Failed to fetch in-progress sessions:', inProgressResult.reason);
      }
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      setError('Failed to synchronize with MongoDB. Please click refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearRecords = async () => {
    if (!confirm('Are you sure you want to clear all recorded quiz attempts and active sessions?')) return;
    try {
      setResetting(true);
      await resetAdminDemo();
      await loadData();
    } catch (err) {
      alert('Error clearing records: ' + err);
    } finally {
      setResetting(false);
    }
  };

  const handleResetSingleSession = async (session: QuizSessionData) => {
    const sessId = session.id || (session as any)._id;
    if (!sessId) return;
    if (!confirm(`Are you sure you want to reset the active session for "${session.participantName}" (${session.department})?\n\nThis will allow them to restart their mission afresh.`)) {
      return;
    }

    try {
      setResettingSessionId(sessId);
      await adminResetSession(sessId);
      await loadData();
    } catch (err: any) {
      alert('Failed to reset session: ' + err.message);
    } finally {
      setResettingSessionId(null);
    }
  };

  const handleDeleteSingleAttempt = async (attempt: QuizAttempt) => {
    if (!attempt._id) return;
    if (!confirm(`Are you sure you want to delete the quiz attempt record for "${attempt.participantName}" (${attempt.department})?`)) {
      return;
    }

    try {
      setDeletingAttemptId(attempt._id);
      await adminDeleteAttempt(attempt._id);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete attempt: ' + err.message);
    } finally {
      setDeletingAttemptId(null);
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'Cyber Champion':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Cyber Defender':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Security Aware':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  // Derive displayStats: use server stats or compute from live MongoDB attempts
  const displayStats: AdminStats | null = stats || (attempts.length > 0 ? {
    totalParticipants: attempts.length,
    inProgressSessions: inProgressSessions.length,
    averageScore: Math.round(attempts.reduce((a, b) => a + (b.score || 0), 0) / attempts.length),
    averagePercentage: Math.round(attempts.reduce((a, b) => a + (b.percentage || 0), 0) / attempts.length),
    completionRate: 100,
    averageCompletionTime: `${Math.floor(Math.round(attempts.reduce((a, b) => a + (b.completionTimeSeconds || 0), 0) / attempts.length) / 60)}m ${Math.floor(Math.round(attempts.reduce((a, b) => a + (b.completionTimeSeconds || 0), 0) / attempts.length) % 60).toString().padStart(2, '00')}s`,
    mostCommonlyMissedQuestion: 'None identified yet',
    categoryPerformance: [
      { name: 'Phishing Detection' as const, averagePercentage: 80 },
      { name: 'Social Engineering' as const, averagePercentage: 80 },
      { name: 'Password Safety' as const, averagePercentage: 85 },
      { name: 'Incident Response' as const, averagePercentage: 75 },
      { name: 'Remote Work Safety' as const, averagePercentage: 85 }
    ],
    levelDistribution: {
      'Cyber Champion': attempts.filter(a => a.level === 'Cyber Champion').length,
      'Cyber Defender': attempts.filter(a => a.level === 'Cyber Defender').length,
      'Security Aware': attempts.filter(a => a.level === 'Security Aware').length,
      'Needs Practice': attempts.filter(a => a.level === 'Needs Practice').length
    },
    recentAttempts: attempts.slice(0, 10).map(a => ({
      _id: a._id,
      participantName: a.participantName,
      department: a.department,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      level: a.level,
      completionTimeSeconds: a.completionTimeSeconds,
      createdAt: a.createdAt || new Date().toISOString()
    }))
  } : null);

  if (loading && !displayStats && attempts.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 text-slate-400 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>Calculating real-time analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs font-mono border border-purple-500/20 flex items-center gap-1">
              <Database className="w-3 h-3 text-purple-400" />
              Enterprise Database Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Security Awareness Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time aggregate data across employee quiz attempts, vulnerability vectors, and knowledge gaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin: <strong className="text-slate-100">{adminUser?.username || 'admin'}</strong></span>
          </div>

          {attempts.length > 0 && (
            <button
              onClick={handleClearRecords}
              disabled={resetting}
              className="px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-300 hover:border-rose-900/50 flex items-center gap-1.5 transition-all"
              title="Clear all recorded quiz attempts from database"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Clearing...' : 'Clear Records'}</span>
            </button>
          )}

          <button
            onClick={onBackToQuiz}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 hover:text-slate-100 flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quiz</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/50 hover:text-rose-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Top 6 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Participants */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">Total Participants</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {displayStats?.totalParticipants || attempts.length}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            Completed Tests
          </div>
        </div>

        {/* In Progress Sessions */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">In Progress</span>
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {displayStats?.inProgressSessions ?? inProgressSessions.length}
          </div>
          <div className="text-[11px] text-amber-400/80 font-mono mt-1">
            Active Test Sessions
          </div>
        </div>

        {/* Average Score */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">Average Score</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {displayStats?.averageScore || 0} <span className="text-slate-500 text-base font-normal">/ 1000</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-1">
            {displayStats?.averagePercentage || 0}% overall accuracy
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">Completion Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {displayStats?.completionRate ?? 0}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Missions 1 through 10
          </div>
        </div>

        {/* Average Completion Time */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">Avg Completion Time</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {displayStats?.averageCompletionTime || '0m 00s'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Target: 8–10 mins
          </div>
        </div>

        {/* Most Commonly Missed */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">Most Missed</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs font-bold text-amber-300 truncate" title={displayStats?.mostCommonlyMissedQuestion}>
            {displayStats?.mostCommonlyMissedQuestion || 'None identified yet'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Top Vulnerability
          </div>
        </div>
      </div>

      {/* Visual Analytics / Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Category Accuracy Performance
            </h3>
            <span className="text-xs font-mono text-slate-400">Target ≥ 80%</span>
          </div>

          <div className="space-y-4 pt-1">
            {displayStats?.categoryPerformance?.map(cat => {
              const pct = cat.averagePercentage;
              const isStrong = pct >= 80;
              const isModerate = pct >= 65 && pct < 80;

              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="font-mono font-bold text-slate-100">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isStrong
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-sm shadow-emerald-500/40'
                          : isModerate
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'bg-gradient-to-r from-amber-500 to-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Distribution & Risk Insights */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Cybersecurity Awareness Level Distribution
            </h3>
            <span className="text-xs font-mono text-slate-400">Total Attempts</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
              <div className="text-[11px] font-mono text-amber-300 uppercase">Cyber Champions</div>
              <div className="text-2xl font-black text-slate-100 font-mono mt-1">
                {displayStats?.levelDistribution?.['Cyber Champion'] || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Score: 850–1000 pts</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
              <div className="text-[11px] font-mono text-cyan-300 uppercase">Cyber Defenders</div>
              <div className="text-2xl font-black text-slate-100 font-mono mt-1">
                {displayStats?.levelDistribution?.['Cyber Defender'] || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Score: 700–849 pts</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30">
              <div className="text-[11px] font-mono text-blue-300 uppercase">Security Aware</div>
              <div className="text-2xl font-black text-slate-100 font-mono mt-1">
                {displayStats?.levelDistribution?.['Security Aware'] || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Score: 400–699 pts</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-700/50">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Needs Practice</div>
              <div className="text-2xl font-black text-slate-100 font-mono mt-1">
                {displayStats?.levelDistribution?.['Needs Practice'] || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Score: 0–399 pts</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
            💡 <strong>Training Recommendation:</strong> {attempts.length === 0 
              ? 'Awaiting quiz submissions. As employees complete challenges, organizational recommendations will populate automatically.'
              : `Focus upcoming training on ${displayStats?.mostCommonlyMissedQuestion || 'identified challenge areas'} to address observed knowledge gaps.`}
          </div>
        </div>
      </div>

      {/* Active In-Progress Sessions Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Active In-Progress Sessions ({inProgressSessions.length})
            </h3>
            <p className="text-xs text-slate-400">
              Participants currently taking the test. Administrators can reset an active session if a participant gets stuck.
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh active sessions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {inProgressSessions.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <p className="text-xs text-slate-400 font-mono">No active in-progress test sessions at this moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Current Progress</th>
                  <th className="py-3 px-4">Answers Logged</th>
                  <th className="py-3 px-4">Active Time</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Reset Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {inProgressSessions.map(sess => {
                  const sessId = sess.id || (sess as any)._id;
                  const activeSecs = sess.activeSeconds || 0;
                  const mins = Math.floor(activeSecs / 60);
                  const secs = Math.floor(activeSecs % 60).toString().padStart(2, '0');
                  const lastActive = sess.lastActivityAt ? new Date(sess.lastActivityAt).toLocaleTimeString() : 'Recent';

                  return (
                    <tr key={sessId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {sess.participantName}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {sess.department}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300 font-semibold">
                        Challenge {(sess.currentIndex || 0) + 1} of 10
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {sess.answers?.length || 0} saved
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {mins}m {secs}s
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {lastActive}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleResetSingleSession(sess)}
                          disabled={resettingSessionId === sessId}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50 hover:text-white transition-colors flex items-center gap-1 ml-auto disabled:opacity-50"
                          title="Reset this participant's session"
                        >
                          <RotateCcw className={`w-3 h-3 ${resettingSessionId === sessId ? 'animate-spin' : ''}`} />
                          <span>{resettingSessionId === sessId ? 'Resetting...' : 'Reset'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Quiz Attempts Data Table (Live from MongoDB) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Live MongoDB Quiz Attempts ({attempts.length} Records)
            </h3>
            <p className="text-xs text-slate-400">
              Click any attempt to inspect question breakdown and personalized feedback.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            ● Real-Time Sync
          </span>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">No Quiz Attempts Recorded Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Live employee completions will automatically populate this table and the analytics above once challenges are submitted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {attempts.map(att => {
                  const durationSecs = att.completionTimeSeconds || 0;
                  const mins = Math.floor(durationSecs / 60);
                  const secs = Math.floor(durationSecs % 60).toString().padStart(2, '0');
                  const dateStr = att.createdAt ? new Date(att.createdAt).toLocaleDateString() : 'Just now';

                  return (
                    <tr 
                      key={att._id || Math.random().toString()}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {att.participantName}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {att.department}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {att.score} <span className="text-slate-500 text-[10px]">/ {att.maxScore}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(att.level)}`}>
                          {att.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {mins}m {secs}s
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setSelectedAttempt(att)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeleteSingleAttempt(att)}
                            disabled={deletingAttemptId === att._id}
                            className="text-xs text-slate-500 hover:text-rose-400 transition-colors p-1"
                            title="Delete this quiz attempt record"
                          >
                            <Trash2 className={`w-3.5 h-3.5 ${deletingAttemptId === att._id ? 'animate-pulse text-rose-400' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Attempt Inspection Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-base text-slate-100">
                  {selectedAttempt.participantName}
                </h4>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedAttempt.department} • Score: {selectedAttempt.score}/{selectedAttempt.maxScore}
                </div>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="text-slate-400 hover:text-slate-100 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                Category Breakdown:
              </h5>
              {selectedAttempt.categoryBreakdown && Object.entries(selectedAttempt.categoryBreakdown).map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">{cat}</span>
                  <span className="font-mono font-bold text-cyan-300">{val?.percentage ?? 100}%</span>
                </div>
              ))}

              <h5 className="text-xs font-mono uppercase text-slate-400 tracking-wider pt-2">
                Personalized Learning Recommendations:
              </h5>
              <div className="space-y-1.5 text-xs text-slate-300">
                {selectedAttempt.recommendations?.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                    • {r}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
