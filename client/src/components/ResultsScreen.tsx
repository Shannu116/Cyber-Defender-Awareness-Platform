import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizAttempt, QuestionCategory, LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../services/api';
import { 
  Award, 
  RotateCcw, 
  Target, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Database,
  Trophy,
  Flame,
  Zap,
  Crown,
  UserCheck
} from 'lucide-react';

interface ResultsScreenProps {
  attempt: QuizAttempt;
  onRetakeFull: () => void;
  onPracticeWeakAreas: (categories: QuestionCategory[]) => void;
  onOpenAdmin?: () => void;
}

// Deterministic generator for funny cybersecurity meme & hacker titles
function getLocalCyberMemeTitle(score: number, rank: number, name = ''): string {
  if (rank === 1) return 'Chief Firewall Whisperer 👑';
  if (rank === 2) return 'Zero-Day Overlord ⚡';
  if (rank === 3) return 'Master of sudo rm -rf / 💻';

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const pick = (arr: string[]) => arr[Math.abs(hash) % arr.length];

  if (score >= 950) {
    return pick([
      'The 1337 H4x0r 🕶️',
      'NSA Intern of the Month 🕵️',
      'Zero-Day Overlord ⚡',
      'Root Access Granted 🔑',
      'Cyber Chad 💪',
      'Certified Packet Bender 🌐'
    ]);
  } else if (score >= 800) {
    return pick([
      'Phish Fryer 9000 🎣',
      'Kernel Panic Preventer 🛡️',
      'Air-Gapped Brain 🧠',
      'MFA Fatigue Immune 📵',
      'Script Kiddie Repeller 🚫',
      'Entropy Maximizer 🔐',
      'Social Engineering Sponge 🧽'
    ]);
  } else if (score >= 600) {
    return pick([
      'Password: Not Hunter2 🔑',
      'Clean Desk Crusader 🗄️',
      'Hover Before You Click Fanatic 🖱️',
      'VPN Always-On Defender 🛡️',
      'Suspicious Link Skeptic 🧐',
      'Incognito Mode Enjoyer 🕶️'
    ]);
  } else if (score >= 400) {
    return pick([
      "Didn't Click the Free Pizza Link 🍕",
      'Sticky Note Credential Hider 📝',
      'Almost Got Phished But Survived 😅',
      'Rebooted the Router Once 🔄',
      'HTTPS Appreciator 🔒',
      'Locked Screen After 3 Mins ⏱️'
    ]);
  } else {
    return pick([
      "Password is 'Password123!' 🤡",
      'Plugged in the Mystery USB Drive 🔌',
      'Wired 50 Gift Cards to the CEO 💳',
      "Clicked 'Hot Singles in Your Subnet' 💔",
      'Disabled Firewall for Video Games 🎮',
      "Tapped 'Accept' on 2 AM MFA Push 📱"
    ]);
  }
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  attempt,
  onRetakeFull,
  onPracticeWeakAreas,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  // Fire celebration confetti when screen loads if score is good
  useEffect(() => {
    if (attempt.score >= 500) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [attempt.score]);

  // Fetch real-time leaderboard from MongoDB
  useEffect(() => {
    let isMounted = true;
    async function loadLeaderboardData() {
      try {
        setIsLoadingLeaderboard(true);
        const data = await fetchLeaderboard(20);
        if (!isMounted) return;

        // Check if the current participant is already in the fetched leaderboard
        const hasCurrent = data.some(
          d => d.participantName.trim().toLowerCase() === attempt.participantName.trim().toLowerCase()
        );

        if (!hasCurrent && attempt.participantName) {
          const currentEntry: LeaderboardEntry = {
            rank: 0,
            participantName: attempt.participantName,
            department: attempt.department,
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage: attempt.percentage,
            level: attempt.level,
            completionTimeSeconds: attempt.completionTimeSeconds,
            cyberTitle: getLocalCyberMemeTitle(attempt.score, 0, attempt.participantName)
          };

          const combined = [...data, currentEntry].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (a.completionTimeSeconds || 0) - (b.completionTimeSeconds || 0);
          });

          const reRanked = combined.map((item, idx) => ({
            ...item,
            rank: idx + 1,
            cyberTitle: item.cyberTitle || getLocalCyberMemeTitle(item.score, idx + 1, item.participantName)
          }));

          setLeaderboard(reRanked);
        } else {
          setLeaderboard(data);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        if (isMounted) setIsLoadingLeaderboard(false);
      }
    }

    loadLeaderboardData();
    return () => { isMounted = false; };
  }, [attempt]);

  // Identify weak categories (< 80%)
  const weakCategories: QuestionCategory[] = Object.entries(attempt.categoryBreakdown)
    .filter(([_, data]) => (data?.percentage ?? 100) < 80)
    .map(([cat]) => cat as QuestionCategory);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Cyber Champion':
        return 'from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-400/50 shadow-amber-500/20';
      case 'Cyber Defender':
        return 'from-cyan-400 via-blue-400 to-cyan-500 text-slate-950 border-cyan-400/50 shadow-cyan-500/20';
      case 'Security Aware':
        return 'from-blue-400 via-indigo-400 to-blue-500 text-white border-blue-400/50 shadow-blue-500/20';
      default:
        return 'from-slate-400 via-slate-300 to-slate-400 text-slate-950 border-slate-400/50 shadow-slate-500/20';
    }
  };

  // Find user's entry in leaderboard
  const currentUserEntry = leaderboard.find(
    e => e.participantName.trim().toLowerCase() === attempt.participantName.trim().toLowerCase()
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header Card */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />

        {/* Top Tagline */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mission Completed & Evaluated</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight mb-2">
          YOUR CYBER AWARE 2026 RESULTS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          Participant: <strong className="text-slate-100">{attempt.participantName}</strong> • Department: <strong className="text-slate-100">{attempt.department}</strong>
        </p>
      </div>

      {/* Main 2-Column Split: Left = User Results & Breakdown, Right = Leaderboard & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════ LEFT COLUMN: Participant Results & Evaluation (lg:col-span-7) ══════════ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Score & Gamification Level Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Numerical Score Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-center flex flex-col justify-center">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-1">
                Final Cyber Score
              </div>
              <div className="text-4xl sm:text-5xl font-black text-slate-100 font-mono tracking-tight my-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {attempt.score}
                </span>
                <span className="text-slate-500 text-2xl font-normal"> / {attempt.maxScore}</span>
              </div>
              <div className="text-xs font-mono text-cyan-400 font-semibold mt-1">
                Overall Accuracy: {attempt.percentage}%
              </div>
            </div>

            {/* Gamification Level Badge Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-center flex flex-col items-center justify-center">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
                Earned Cyber Tier
              </div>
              <div className={`px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r shadow-lg border ${getLevelColor(attempt.level)}`}>
                {attempt.level}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-2.5 leading-tight">
                {attempt.percentage >= 85
                  ? 'Outstanding vigilance & threat triage.'
                  : attempt.percentage >= 70
                  ? 'Strong baseline defense awareness.'
                  : 'Awareness identified with areas for practice.'}
              </p>
            </div>
          </div>

          {/* Category Performance Breakdown */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Category Performance Breakdown</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Accuracy</span>
            </div>

            <div className="space-y-3.5">
              {Object.entries(attempt.categoryBreakdown).map(([categoryName, stat]) => {
                const pct = stat?.percentage ?? 100;
                const isHigh = pct >= 80;
                const isMedium = pct >= 60 && pct < 80;

                return (
                  <div key={categoryName} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-200 mb-2">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{categoryName}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-100">{pct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isHigh
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                            : isMedium
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

          {/* Personalized Learning Recommendations */}
          <div className="rounded-2xl bg-cyan-950/20 border border-cyan-500/30 p-5 sm:p-6 shadow-xl text-left space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Personalized Learning Recommendations</span>
            </h3>

            <div className="space-y-2.5">
              {attempt.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onRetakeFull}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Mode (Full Mission)</span>
            </button>

            {weakCategories.length > 0 && (
              <button
                onClick={() => onPracticeWeakAreas(weakCategories)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 hover:border-purple-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Target className="w-4 h-4 text-purple-400" />
                <span>Practice Weak Areas ({weakCategories.length})</span>
              </button>
            )}
          </div>

          {/* Database confirmation note */}
          <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5 pt-2">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Session verified and stored in secure database</span>
          </div>
        </div>

        {/* ══════════ RIGHT COLUMN: Live Leaderboard & Meme Titles (lg:col-span-5) ══════════ */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4 text-left">
            
            {/* Leaderboard Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Trophy className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Leaderboard
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live defender rankings & titles
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Live Standings</span>
              </span>
            </div>

            {/* Current Defender Standing Spotlight Card */}
            {currentUserEntry && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/40 shadow-inner space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-300 font-bold uppercase flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Your Standing</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-[10px]">
                    Rank #{currentUserEntry.rank}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">
                      {currentUserEntry.participantName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {currentUserEntry.department} • Score: <strong className="text-cyan-300">{currentUserEntry.score}</strong> ({currentUserEntry.percentage}%)
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium bg-slate-950 border border-cyan-500/40 text-cyan-200 shadow-sm">
                    {currentUserEntry.cyberTitle}
                  </span>
                </div>
              </div>
            )}

            {/* Standings Table */}
            {isLoadingLeaderboard ? (
              <div className="py-12 text-center text-xs font-mono text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span>Fetching leaderboard & hacker titles...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No completed records yet. You are the first defender on the board!
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="py-2 px-2.5">Rank</th>
                      <th className="py-2 px-2.5">Defender</th>
                      <th className="py-2 px-2.5">Score</th>
                      <th className="py-2 px-2.5 text-right">Cyber Title</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-sans">
                    {leaderboard.map((entry) => {
                      const isCurrentUser =
                        entry.participantName.trim().toLowerCase() === attempt.participantName.trim().toLowerCase();

                      return (
                        <tr
                          key={`${entry.rank}-${entry.participantName}`}
                          className={`transition-colors ${
                            isCurrentUser
                              ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                              : 'hover:bg-slate-950/40'
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-2.5 px-2.5 font-mono whitespace-nowrap">
                            {entry.rank === 1 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                                👑 #1
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-300/20 text-slate-200 border border-slate-400/40 font-bold text-[10px]">
                                🥈 #2
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-700/20 text-amber-400 border border-amber-600/40 font-bold text-[10px]">
                                🥉 #3
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold pl-1 text-[11px]">#{entry.rank}</span>
                            )}
                          </td>

                          {/* Defender */}
                          <td className="py-2.5 px-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold ${isCurrentUser ? 'text-cyan-300 font-bold' : 'text-slate-100'}`}>
                                {entry.participantName}
                              </span>
                              {isCurrentUser && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {entry.department}
                            </div>
                          </td>

                          {/* Score */}
                          <td className="py-2.5 px-2.5 font-mono whitespace-nowrap">
                            <span className="font-bold text-slate-100">{entry.score}</span>
                            <div className="text-[10px] text-cyan-400">{entry.percentage}%</div>
                          </td>

                          {/* Cyber Title */}
                          <td className="py-2.5 px-2.5 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium border shadow-sm max-w-[150px] truncate ${
                              isCurrentUser
                                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-200'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                            title={entry.cyberTitle}
                            >
                              {entry.cyberTitle}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
