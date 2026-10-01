import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QuizAttempt, QuestionCategory } from '../types';
import { 
  Award, 
  RotateCcw, 
  Target, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Database
} from 'lucide-react';

interface ResultsScreenProps {
  attempt: QuizAttempt;
  onRetakeFull: () => void;
  onPracticeWeakAreas: (categories: QuestionCategory[]) => void;
  onOpenAdmin?: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  attempt,
  onRetakeFull,
  onPracticeWeakAreas,
}) => {
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

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Results Header Card */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />

        {/* Top Tagline */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mission Completed</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          YOUR CYBER DEFENDER RESULTS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono mb-8">
          Participant: <strong className="text-slate-200">{attempt.participantName}</strong> • Department: <strong className="text-slate-200">{attempt.department}</strong>
        </p>

        {/* Score & Level Badge Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto items-center mb-8">
          {/* Numerical Score */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-1">
              Final Cyber Score
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {attempt.score}
              </span>
              <span className="text-slate-600 text-2xl sm:text-3xl font-normal"> / {attempt.maxScore}</span>
            </div>
            <div className="text-xs font-mono text-cyan-400 mt-2">
              Overall Accuracy: {attempt.percentage}%
            </div>
          </div>

          {/* Gamification Level Badge */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center justify-center">
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
              Cybersecurity Level
            </div>
            <div className={`px-5 py-2.5 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r shadow-lg border ${getLevelColor(attempt.level)}`}>
              {attempt.level}
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-3 leading-tight max-w-[240px]">
              Gamification milestone reflecting awareness exhibited on this simulation.
            </p>
          </div>
        </div>

        {/* Category Performance Breakdown */}
        <div className="text-left max-w-2xl mx-auto space-y-4 mb-8">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Category Performance Breakdown</span>
            <span>Accuracy</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(attempt.categoryBreakdown).map(([categoryName, stat]) => {
              const pct = stat?.percentage ?? 100;
              const isHigh = pct >= 80;
              const isMedium = pct >= 60 && pct < 80;

              return (
                <div key={categoryName} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-200 mb-2">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      {categoryName}
                    </span>
                    <span className="font-mono font-bold text-white">{pct}%</span>
                  </div>

                  {/* Visual Progress bar */}
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

        {/* Personalized Feedback Recommendations */}
        <div className="text-left max-w-2xl mx-auto rounded-2xl bg-cyan-950/20 border border-cyan-500/30 p-5 sm:p-6 mb-8">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4" />
            Personalized Learning Recommendations
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onRetakeFull}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (Full Mission)</span>
          </button>

          {weakCategories.length > 0 && (
            <button
              onClick={() => onPracticeWeakAreas(weakCategories)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 hover:border-purple-400 transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4 text-purple-400" />
              <span>Practice My Weak Areas ({weakCategories.length})</span>
            </button>
          )}
        </div>

        {/* Database confirmation footer */}
        <div className="mt-8 text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Session verified and stored in secure database</span>
        </div>
      </div>
    </div>
  );
};
