import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { BellRing, ShieldAlert, CheckCircle2, AlertOctagon, Smartphone, XCircle, MapPin, Laptop, ShieldCheck } from 'lucide-react';

interface MfaBombardmentChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (optionId: string) => void;
}

export const MfaBombardmentChallenge: React.FC<MfaBombardmentChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [buzzCount, setBuzzCount] = useState(1);

  // Simulated rapid notification counter
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setBuzzCount(prev => (prev < 6 ? prev + 1 : 6));
    }, 1200);
    return () => clearInterval(interval);
  }, [submitted]);

  const handleSelect = (id: string) => {
    if (submitted) return;
    setSelectedOption(id);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    onSubmitAnswer(selectedOption);
  };

  const sampleAlert = question.details.sampleAlert || {
    app: 'Corporate Authenticator',
    title: 'Approve sign-in request?',
    location: 'Frankfurt, Germany (IP: 185.220.101.5)',
    device: 'Chrome on Linux OS',
    time: 'Just now'
  };

  return (
    <div className="space-y-6">
      {/* Mobile Device Simulation Graphic */}
      <div className="max-w-md mx-auto rounded-3xl bg-slate-950 p-4 border-4 border-slate-800 shadow-2xl relative">
        {/* Device Notch / Speaker */}
        <div className="w-24 h-4 bg-slate-900 mx-auto rounded-full mb-3 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-800" />
        </div>

        {/* Live Notification Banner */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
              <BellRing className="w-3.5 h-3.5" />
              Incoming Push Request #{buzzCount} of 6
            </span>
            <span>2:02 PM</span>
          </div>

          {/* Realistic Authenticator Notification Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/40 shadow-lg shadow-rose-950/20 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  ID
                </div>
                <span className="text-xs font-bold text-white">{sampleAlert.app}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{sampleAlert.time}</span>
            </div>

            <div>
              <div className="text-sm font-black text-rose-300 mb-1 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                {sampleAlert.title}
              </div>
              <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>Location: <strong className="text-white">{sampleAlert.location}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Laptop className="w-3 h-3 text-purple-400" />
                  <span>Device: <strong className="text-white">{sampleAlert.device}</strong></span>
                </div>
              </div>
            </div>

            {/* Simulated Approve / Deny Buttons (Disabled visual representation) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="py-2 text-center rounded-xl bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 opacity-80">
                Deny
              </div>
              <div className="py-2 text-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow opacity-80">
                Approve
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center font-mono pb-1">
          ⚠️ Your phone has buzzed with 6 consecutive approvals in under 30 seconds.
        </p>
      </div>

      {/* Decision Options */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
          What is the safest response?
        </h4>

        {question.options.map(option => {
          const isSelected = selectedOption === option.id;
          const isCorrect = option.isCorrect;

          let cardStyle = 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200';
          if (submitted) {
            if (isCorrect) {
              cardStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/30';
            } else if (isSelected) {
              cardStyle = 'bg-rose-950/40 border-rose-500 text-rose-100 ring-2 ring-rose-500/30';
            } else {
              cardStyle = 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60';
            }
          } else if (isSelected) {
            cardStyle = 'bg-cyan-950/40 border-cyan-500 text-cyan-100 ring-2 ring-cyan-500/30';
          }

          return (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`p-4 rounded-xl border text-sm transition-all cursor-pointer flex items-start gap-3 ${cardStyle}`}
            >
              <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 border ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-400 text-slate-950 font-bold text-xs'
                  : 'border-slate-700 bg-slate-800 text-slate-400 text-xs'
              }`}>
                {option.id.replace('mfa-opt-', '').toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="font-medium leading-relaxed">{option.text}</div>
                {submitted && isSelected && (
                  <p className="mt-2 text-xs opacity-90 font-mono">
                    {option.explanation}
                  </p>
                )}
              </div>

              {submitted && (
                <div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex justify-end max-w-2xl mx-auto pt-2">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              selectedOption
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Confirm Action
          </button>
        </div>
      )}
    </div>
  );
};
