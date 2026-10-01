import React, { useState } from 'react';
import { Question } from '../../types';
import { MessageSquare, AlertCircle, CheckCircle2, ShieldAlert, User, Send, Building } from 'lucide-react';

interface ChatSimulationChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (optionId: string) => void;
}

export const ChatSimulationChallenge: React.FC<ChatSimulationChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const chatSender = question.details.chatSender!;
  const chatMessages = question.details.chatMessages || [];

  const handleSelect = (id: string) => {
    if (submitted) return;
    setSelectedOption(id);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    onSubmitAnswer(selectedOption);
  };

  return (
    <div className="space-y-6">
      {/* Realistic Corporate Instant Chat Client Window */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-w-2xl mx-auto">
        {/* Chat Window Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {chatSender.avatarText}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{chatSender.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  External Guest
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>{chatSender.role}</span>
                <span>•</span>
                <span className="text-amber-400/90 text-[11px]">{chatSender.status}</span>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900 text-slate-400 text-xs font-mono border border-slate-800">
            Corporate Teams Chat
          </div>
        </div>

        {/* Message Thread */}
        <div className="p-5 sm:p-6 space-y-4 bg-slate-900/60 min-h-[220px]">
          <div className="text-center">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
              Direct Message Session Started
            </span>
          </div>

          {chatMessages.map((msg, idx) => (
            <div key={idx} className="flex flex-col items-start max-w-[85%] space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="font-medium text-slate-300">{chatSender.name}</span>
                <span>{msg.time}</span>
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-800 text-slate-100 text-sm leading-relaxed border border-slate-700/60 shadow-sm">
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Disabled mock input area */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400 font-mono">
          <input
            type="text"
            disabled
            placeholder="Select your decision from the options below..."
            className="flex-1 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 cursor-not-allowed"
          />
          <div className="p-2 bg-slate-800 text-slate-400 rounded-lg">
            <Send className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Decision Options */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
          Select Your Response Strategy:
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
                {option.id.replace('opt-', '').toUpperCase()}
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
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
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
            Confirm Decision
          </button>
        </div>
      )}
    </div>
  );
};
