import React from 'react';
import { 
  Play, 
  HelpCircle, 
  PhoneCall, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  Send,
  Zap
} from 'lucide-react';

interface MissionBriefingProps {
  participantName: string;
  onBeginMission: () => void;
  onBack: () => void;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({
  participantName,
  onBeginMission,
  onBack
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full mx-auto">
        {/* Mission Briefing Card */}
        <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
          {/* Top Decorative accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                Microcare Security Awareness Campaign
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Mission Briefing
              </h2>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Agent: <span className="text-cyan-300 font-bold">{participantName}</span>
            </div>
          </div>

          {/* Scenario Overview */}
          <div className="space-y-4 mb-8">
            <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
              You’re having a normal workday. Along the way, you’ll encounter <span className="text-cyan-300 font-semibold">emails, messages, calls, login alerts, and other everyday situations</span> that could put your company at risk.
            </p>

            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 font-medium text-sm sm:text-base flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
              <span>
                <strong>Your mission:</strong> make the safest decision in each situation.
              </span>
            </div>
          </div>

          {/* Three Simple Rules */}
          <div className="mb-8">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-4">
              Three Simple Rules For Every Employee:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rule 1 */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-xs">
                    01
                  </span>
                  <span>Stop & Think</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal">
                  Scammers rely on artificial urgency and panic. Take a 30-second breath before clicking or replying.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-blue-400 font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-xs">
                    02
                  </span>
                  <span>Verify Requests</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal">
                  Unexpected requests for money, gift cards, or credentials must always be confirmed through a known channel.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-purple-400 font-mono font-bold text-sm">
                  <span className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-xs">
                    03
                  </span>
                  <span>Report Activity</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal">
                  Reporting is blameless and supportive. Early alerts allow IT defenders to protect the whole organization.
                </p>
              </div>
            </div>
          </div>

          {/* Interaction preview notes */}
          <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-400 mb-8 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Tip: Challenges include interactive emails with clickable hotspots, chat simulations, password sorting, and incident choices.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={onBack}
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Overview
            </button>

            <button
              onClick={onBeginMission}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Begin Mission</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
