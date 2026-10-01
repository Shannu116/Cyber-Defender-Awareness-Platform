import React, { useState } from 'react';
import { Question } from '../../types';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Mail, Smartphone, Calendar, Info } from 'lucide-react';

interface ClassificationChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: Record<string, 'safe' | 'suspicious'>) => void;
}

export const ClassificationChallenge: React.FC<ClassificationChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const messages = question.details.messages || [];
  const [classifications, setClassifications] = useState<Record<string, 'safe' | 'suspicious'>>({});

  const handleSelect = (msgId: string, choice: 'safe' | 'suspicious') => {
    if (submitted) return;
    setClassifications(prev => ({
      ...prev,
      [msgId]: choice,
    }));
  };

  const isAllAnswered = messages.every(m => classifications[m.id]);

  const handleSubmit = () => {
    if (!isAllAnswered) return;
    onSubmitAnswer(classifications);
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('Email')) return <Mail className="w-4 h-4 text-cyan-400" />;
    if (type.includes('SMS')) return <Smartphone className="w-4 h-4 text-amber-400" />;
    return <Calendar className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
        Review each communication item below and categorize whether it is <strong>Likely Safe</strong> or <strong>Suspicious</strong>.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {messages.map((msg, index) => {
          const currentChoice = classifications[msg.id];
          const isCorrect = submitted && currentChoice === msg.correctClassification;

          return (
            <div
              key={msg.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                submitted
                  ? isCorrect
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Channel Header */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(msg.type)}
                    <span className="text-xs font-mono font-medium text-slate-400">{msg.type}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                    {msg.sender}
                  </span>
                </div>

                {/* Subject / Headline */}
                <h5 className="font-bold text-sm text-white mb-2">{msg.subject}</h5>

                {/* Message preview snippet */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed mb-4">
                  {msg.preview}
                </div>
              </div>

              {/* Classification buttons or submitted result */}
              <div>
                {!submitted ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(msg.id, 'safe')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        currentChoice === 'safe'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Likely Safe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect(msg.id, 'suspicious')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        currentChoice === 'suspicious'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-rose-500/40 hover:text-rose-300'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Suspicious</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Your choice:</span>
                      <span className={`font-bold capitalize ${
                        currentChoice === 'safe' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {currentChoice}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-lg text-xs leading-normal ${
                      isCorrect ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200' : 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                    }`}>
                      <div className="font-semibold mb-1 flex items-center gap-1">
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Correct: {msg.correctClassification.toUpperCase()}</span>
                      </div>
                      <p>{msg.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 font-mono">
            {Object.keys(classifications).length} of {messages.length} classified
          </span>
          <button
            onClick={handleSubmit}
            disabled={!isAllAnswered}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isAllAnswered
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Submit Classifications
          </button>
        </div>
      )}
    </div>
  );
};
