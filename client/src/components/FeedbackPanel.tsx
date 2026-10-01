import React from 'react';
import { Question } from '../types';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Award } from 'lucide-react';

interface FeedbackPanelProps {
  question: Question;
  isCorrect: boolean;
  scoreAwarded: number;
  bonusAwarded: number;
  isLastQuestion: boolean;
  onNextQuestion: () => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  question,
  isCorrect,
  scoreAwarded,
  bonusAwarded,
  isLastQuestion,
  onNextQuestion,
}) => {
  const totalEarned = scoreAwarded + bonusAwarded;

  return (
    <div className="mt-8 rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-7 shadow-2xl space-y-5 animate-fadeIn">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isCorrect 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
          }`}>
            {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div>
            <div className={`font-bold text-base sm:text-lg ${isCorrect ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isCorrect ? 'Excellent Security Decision!' : 'Key Learning Opportunity'}
            </div>
            <div className="text-xs text-slate-400">
              {isCorrect ? 'You applied the correct verification standard.' : 'Every mistake in training prevents an incident in reality.'}
            </div>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
          <Award className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400">Points Awarded:</span>
          <span className="text-sm font-bold text-cyan-300">
            +{totalEarned} pts
          </span>
          {bonusAwarded > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
              +{bonusAwarded} Bonus
            </span>
          )}
        </div>
      </div>

      {/* Explanation in plain non-technical language */}
      <div className="space-y-2">
        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          The Breakdown:
        </h5>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          {question.explanation}
        </p>
      </div>

      {/* Safe Corporate Takeaway */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Golden Rule:</span>
          <span>{question.safeTakeaway}</span>
        </div>
      </div>

      {/* Navigation Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNextQuestion}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span>{isLastQuestion ? 'View Final Report & Results' : 'Continue to Next Mission'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
