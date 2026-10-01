import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Usb, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  PhoneCall, 
  Clock, 
  FileWarning, 
  Layers, 
  HeartHandshake,
  HelpCircle,
  Laptop,
  RotateCcw
} from 'lucide-react';

interface ScenarioDecisionChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (optionId: string) => void;
}

export const ScenarioDecisionChallenge: React.FC<ScenarioDecisionChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (submitted) return;
    setSelectedOption(id);
  };

  const handleClearSelection = () => {
    if (submitted) return;
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    onSubmitAnswer(selectedOption);
  };

  // Render scenario-specific visual graphics
  const renderVisualAid = () => {
    if (question.id === 'ch-6') {
      // Unknown USB Drive
      return (
        <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center shadow-xl mb-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-400">
            <Usb className="w-8 h-8 animate-pulse" />
          </div>
          <div className="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40 mb-2">
            🏷️ "CONFIDENTIAL: Executive Compensation 2025"
          </div>
          <p className="text-xs text-slate-400">
            Found on the ground in the staff parking lot near the office entrance.
          </p>
        </div>
      );
    }

    if (question.id === 'ch-8') {
      // Public Wi-Fi
      return (
        <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left shadow-xl mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Laptop className="w-4 h-4 text-cyan-400" />
              Available Wi-Fi Networks
            </span>
            <span className="text-cyan-400">Café Setting</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">Cafe_Free_WiFi_NoPassword</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">Unsecured</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">Starbucks_Guest_Public</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">Unsecured</span>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-200">Corporate Cellular Mobile Hotspot / VPN</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">WPA3 Encrypted</span>
            </div>
          </div>
        </div>
      );
    }

    if (question.id === 'ch-9') {
      // You Clicked the Link
      return (
        <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-xl mb-4 space-y-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-slate-400">Loading blank external page...</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cyan-300">
            <HeartHandshake className="w-4 h-4" />
            <span>Supportive Culture: Accidents happen to everyone!</span>
          </div>
        </div>
      );
    }

    if (question.id === 'ch-10') {
      // Final Multi-Vector Scenario
      return (
        <div className="max-w-lg mx-auto p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-4 space-y-3">
          <div className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Layers className="w-4 h-4" />
            Active Combined Threat Vectors
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <FileWarning className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Overdue invoice attachment</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>1-hour urgent deadline</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <PhoneCall className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Phone caller ("Dave from IT")</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Demanding authorization code</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Contextual Visual Aid */}
      {renderVisualAid()}

      {/* Decision Options */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">
            {question.question}
          </h4>
          {selectedOption !== null && !submitted && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>

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
                {option.id.split('-').pop()?.toUpperCase()}
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
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-center justify-between max-w-2xl mx-auto pt-2">
          {selectedOption ? (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          ) : <div />}

          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              selectedOption
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Confirm Decision
          </button>
        </div>
      )}
    </div>
  );
};
