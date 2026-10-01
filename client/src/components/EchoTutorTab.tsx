import React from 'react';
import { useEcho, EchoExplanation } from '../context/EchoContext';
import { 
  Bot, 
  Sparkles, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  Target, 
  ChevronRight, 
  RotateCcw,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const EchoTutorTab: React.FC = () => {
  const { 
    isOpen, 
    closeEcho, 
    toggleEcho, 
    activeFinding, 
    history, 
    selectHistoryItem, 
    clearEchoHistory 
  } = useEcho();

  const threatHistory = history.filter(h => h.type === 'threat');

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          label: 'CRITICAL THREAT'
        };
      case 'high':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          label: 'HIGH RISK RED FLAG'
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          label: 'SUSPICIOUS INDICATOR'
        };
      case 'neutral':
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          label: 'AUTHENTIC ELEMENT'
        };
      default:
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          label: 'OBSERVATION'
        };
    }
  };

  return (
    <>
      {/* -------------------------------------------------------------
          FLOATING DOCKED TAB TRIGGER (Visible when drawer is closed)
         ------------------------------------------------------------- */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleEcho}
          aria-label="Open Echo AI Tutor"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-850 text-white border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300 group backdrop-blur-md"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/40">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="text-left font-mono">
            <div className="text-xs font-bold flex items-center gap-1.5 text-white">
              <span>Echo</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AI Tutor
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {threatHistory.length > 0 
                ? `${threatHistory.length} threat${threatHistory.length > 1 ? 's' : ''} analyzed`
                : 'Tap to open advice'}
            </div>
          </div>
        </button>
      )}

      {/* -------------------------------------------------------------
          BACKDROP OVERLAY (Mobile click-outside to close)
         ------------------------------------------------------------- */}
      {isOpen && (
        <div
          onClick={closeEcho}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden transition-opacity"
        />
      )}

      {/* -------------------------------------------------------------
          ECHO SIDEBAR DRAWER PANEL
         ------------------------------------------------------------- */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-300">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white font-mono tracking-tight">
                  Echo
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Security AI Tutor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Real-time threat tutor & forensic guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeEcho}
            aria-label="Close Echo Tutor"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Center Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Active Explanation View */}
          {activeFinding ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Badge & Detection Header */}
              <div className="flex items-center justify-between text-xs font-mono">
                {(() => {
                  const badge = getSeverityBadge(activeFinding.severity);
                  return (
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                  );
                })()}

                {activeFinding.detectedAt && (
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Analyzed {activeFinding.detectedAt}</span>
                  </span>
                )}
              </div>

              {/* Title Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  {activeFinding.type === 'threat' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <span>{activeFinding.title}</span>
                </h4>
                {activeFinding.subtitle && (
                  <p className="text-xs text-slate-400 font-mono">
                    {activeFinding.subtitle}
                  </p>
                )}
              </div>

              {/* Echo's Tutor Breakdown (Speech Bubble) */}
              <div className="relative p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs sm:text-sm text-slate-200 space-y-2.5 shadow-md">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Echo's Analysis:</span>
                </div>
                <p className="leading-relaxed font-sans text-slate-200">
                  {activeFinding.explanation}
                </p>
              </div>

              {/* Attacker's Motive Section */}
              {activeFinding.attackerObjective && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 shadow-sm">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Attacker's Objective:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {activeFinding.attackerObjective}
                  </p>
                </div>
              )}

              {/* Pro Tip Section */}
              {activeFinding.proTip && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5 shadow-sm">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>How to Spot It in the Future:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {activeFinding.proTip}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty / Idle State */
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Bot className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Ready to Assist Your Investigation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click on any text, sender address, button, or link in the challenge you suspect is malicious. I'll break down the threat vector right here.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 text-left flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Tip: Look closely at domain spellings, false urgency, and unexpected attachments.
                </span>
              </div>
            </div>
          )}

          {/* History of Discovered Red Flags */}
          {threatHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Discovered Red Flags ({threatHistory.length})
                </span>
                <span className="text-[10px] text-slate-500">Click to review</span>
              </div>

              <div className="space-y-1.5">
                {threatHistory.map((item, idx) => {
                  const isCurrent = activeFinding?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectHistoryItem(item)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow-sm'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-cyan-400' : 'text-emerald-400'}`} />
                        <span className="truncate font-medium">{item.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Ribbon */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-400/90">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Echo Tutor Online</span>
          </div>
          <span>Cyber Awareness Mode</span>
        </div>
      </aside>
    </>
  );
};
