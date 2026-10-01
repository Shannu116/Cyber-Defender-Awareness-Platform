import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Globe, 
  Flag, 
  Key, 
  Trash2, 
  Eraser, 
  RotateCcw, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Info,
  Clock,
  Check
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface IncidentToolboxChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const IncidentToolboxChallenge: React.FC<IncidentToolboxChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const totalEssentialCount = 3;

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setSelectedActions([]);
    setFoundIds([]);
    setLastFeedback(null);
  };

  const actions = [
    {
      id: 'close_browser',
      title: 'Close Browser / Sever Tab Connection',
      icon: Globe,
      isEssential: true,
      explanation: 'Essential Containment: Severing the active web socket immediately cuts communication with the attacker’s command-and-control server.'
    },
    {
      id: 'report_soc',
      title: 'Report Incident to Security Operations (SOC)',
      icon: Flag,
      isEssential: true,
      explanation: 'Essential Containment: Alerting defenders allows security engineers to block the hostile URL company-wide and inspect outbound traffic.'
    },
    {
      id: 'reset_credentials',
      title: 'Reset Account Password & Invalidate Sessions',
      icon: Key,
      isEssential: true,
      explanation: 'Essential Containment: If credentials or tokens were captured by the malicious page, changing your password revokes attacker access immediately.'
    },
    {
      id: 'clear_history',
      title: 'Clear Local Browser History',
      icon: Eraser,
      isEssential: false,
      explanation: 'Ineffective: Clearing browser history merely deletes local browsing logs; it does not stop stolen credentials or alert defenders.'
    },
    {
      id: 'restart_pc',
      title: 'Restart Workstation Immediately',
      icon: RotateCcw,
      isEssential: false,
      explanation: 'Risky / Not Recommended: Rebooting can erase volatile RAM memory and forensic artifacts that security analysts need to investigate the breach.'
    },
    {
      id: 'do_nothing',
      title: 'Keep Quiet & Hope It Was Harmless',
      icon: EyeOff,
      isEssential: false,
      explanation: 'Hazardous: Concealing an accidental click grants the attacker silent uninterrupted dwell time inside corporate infrastructure.'
    }
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    if (submitted) return;
    sounds.playClick();

    if (action.isEssential) {
      if (!foundIds.includes(action.id)) {
        sounds.playSuccess();
        setFoundIds(prev => [...prev, action.id]);
      }
    } else {
      sounds.playWarning();
    }

    setLastFeedback(action.explanation);

    setSelectedActions(prev => 
      prev.includes(action.id) ? prev.filter(id => id !== action.id) : [...prev, action.id]
    );
  };

  const handleFinalSubmit = () => {
    if (submitted) return;
    sounds.playClick();

    const selectedEssential = selectedActions.filter(id => 
      ['close_browser', 'report_soc', 'reset_credentials'].includes(id)
    );
    const selectedHazardous = selectedActions.includes('do_nothing');

    const isCorrect = selectedEssential.length >= 2 && !selectedHazardous;
    const scoreAwarded = isCorrect
      ? Math.round(50 + (selectedEssential.length / totalEssentialCount) * 50)
      : Math.round((selectedEssential.length / totalEssentialCount) * 40);

    const bonusAwarded = isCorrect && selectedEssential.length === 3 ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      selectedActions,
      foundIds,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Scenario & Investigation Objective */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is an incident response screen after clicking a suspicious link. Find the essential containment actions to neutralize the threat.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Click on the response actions to evaluate their effectiveness and select the right containment steps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(selectedActions.length > 0 || foundIds.length > 0) && !submitted && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}

          {/* Counter Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Essential Actions Found:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              foundIds.length === totalEssentialCount
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : foundIds.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {foundIds.length} / {totalEssentialCount}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Discovery Feedback Toast */}
      {lastFeedback && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 flex items-start gap-2.5 animate-fadeIn max-w-2xl mx-auto shadow-lg">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{lastFeedback}</span>
        </div>
      )}

      {/* Incident Response Triage Board */}
      <div className="max-w-3xl mx-auto rounded-3xl bg-slate-900 border-2 border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
          <span className="text-white font-bold">First 5 Minutes Post-Click Protocol</span>
          <span>Click actions to investigate</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {actions.map(action => {
            const isFound = foundIds.includes(action.id);
            const isSelected = selectedActions.includes(action.id);

            return (
              <div
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                  isFound
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md'
                    : isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  <action.icon className={`w-5 h-5 ${isFound ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
                    <span>{action.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {isFound ? '✓ Essential Containment Step' : isSelected ? 'Selected' : 'Click to inspect & select'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Submission */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-mono text-slate-400">
            Selected: {selectedActions.length} actions chosen ({foundIds.length} of {totalEssentialCount} essential identified)
          </div>

          <button
            type="button"
            disabled={submitted || selectedActions.length === 0}
            onClick={handleFinalSubmit}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg transition-all"
          >
            Execute Incident Containment Plan
          </button>
        </div>
      </div>
    </div>
  );
};
