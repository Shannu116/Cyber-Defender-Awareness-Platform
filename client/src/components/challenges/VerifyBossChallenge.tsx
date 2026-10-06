import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { 
  PhoneCall, 
  MessageSquare, 
  Flag, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneOff, 
  ShieldAlert, 
  ShieldCheck, 
  Info,
  RotateCcw,
  User,
  Phone,
  X
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface VerifyBossChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const VerifyBossChallenge: React.FC<VerifyBossChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral, registerChecklist, clearChecklist } = useEcho();
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [callVerified, setCallVerified] = useState(false);
  const [isCallingModalOpen, setIsCallingModalOpen] = useState(false);
  const [callingState, setCallingState] = useState<'ringing' | 'connected' | 'completed'>('ringing');
  const [chosenAction, setChosenAction] = useState<string | null>(null);
  const [showNeedsCallHint, setShowNeedsCallHint] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  const totalSuspiciousCount = 3;

  // Register Echo checklist on mount
  useEffect(() => {
    registerChecklist([
      {
        id: 'suspicious_handle',
        label: 'External freemail account address',
        hint: 'Inspect the sender’s profile details or email address. Does it end with your official company domain or an external freemail provider?',
        severity: 'high',
      },
      {
        id: 'suspicious_voice_obstruction',
        label: 'Voice call refusal clause',
        hint: 'Look for phrases where the sender actively discourages or refuses speaking on the phone. Why would they avoid a phone call?',
        severity: 'medium',
      },
      {
        id: 'suspicious_giftcards',
        label: 'Untraceable gift card purchase demand',
        hint: 'Examine the financial request. Does corporate procurement ever ask employees to buy retail gift cards on personal cards?',
        severity: 'critical',
      },
    ]);
    return () => clearChecklist();
  }, [registerChecklist, clearChecklist]);

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setFoundIds([]);
    setCallVerified(false);
    setIsCallingModalOpen(false);
    setChosenAction(null);
    setShowNeedsCallHint(false);
    setIsProfileExpanded(false);
  };

  const handleElementClick = (elementId: string, isSuspicious: boolean, neutralHint?: string) => {
    if (submitted) return;

    if (isSuspicious) {
      if (!foundIds.includes(elementId)) {
        sounds.playSuccess();
        setFoundIds(prev => [...prev, elementId]);
      } else {
        sounds.playClick();
      }

      if (elementId === 'suspicious_handle') {
        explainThreat({
          id: 'suspicious_handle',
          title: 'External Freemail Handle (<robert.chen.freemail@gmail-notice.com>)',
          subtitle: 'Shadow Matching: Digital Profile Spoofing',
          severity: 'high',
          explanation: 'The profile display name says "Robert Chen", but inspecting the underlying account reveals an external address (@gmail-notice.com) instead of your corporate email domain. Attackers create lookalike freemail profiles to spoof executives.',
          attackerObjective: 'To bypass internal enterprise mail authentication filters by sending messages via external chat bridges.',
          proTip: 'Always inspect the underlying email handle or account source, not merely the friendly display name.'
        });
      } else if (elementId === 'suspicious_voice_obstruction') {
        explainThreat({
          id: 'suspicious_voice_obstruction',
          title: 'Voice Obstruction Tactic',
          subtitle: '"I cannot take phone calls right now, handle this over chat."',
          severity: 'medium',
          explanation: 'Claiming inability to speak on the phone is a deliberate tactic to isolate victims and prevent out-of-band biometric/voice identity verification.',
          attackerObjective: 'To stop you from picking up the phone to confirm whether your real boss authored the request.',
          proTip: 'Whenever an executive makes an urgent financial request and refuses to talk, always call their official number independently.'
        });
      } else if (elementId === 'suspicious_giftcards') {
        explainThreat({
          id: 'suspicious_giftcards',
          title: 'Untraceable Gift Card Purchase Demand',
          subtitle: '5 × ₹2,000 Retail Gift Cards with Personal Funds',
          severity: 'critical',
          explanation: 'Corporations have formal procurement pipelines with approved vendors. No legitimate director will ever ask employees to purchase consumer gift cards with personal funds and transmit scratched PIN codes over chat.',
          attackerObjective: 'To obtain irreversible, bearer-bond style liquid funds that can be cashed out in minutes globally.',
          proTip: 'Any request for retail gift cards, prepaid vouchers, or scratched PIN codes is 100% fraudulent.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralHint || 'This part of the chat interface looks standard. Focus on inspecting sender details, payment demands, and excuses.',
        'Chat Element'
      );
    }
  };

  const handleStartCall = () => {
    if (submitted) return;
    sounds.playClick();
    setIsCallingModalOpen(true);
    setCallingState('ringing');
    setShowNeedsCallHint(false);

    // Realistic phone ring then answer sequence
    setTimeout(() => {
      setCallingState('connected');
      sounds.playSuccess();
    }, 1800);
  };

  const handleFinishCall = () => {
    setCallingState('completed');
    setCallVerified(true);
    setIsCallingModalOpen(false);
    sounds.playSuccess();
  };

  const handleFinalSubmit = (actionKey: 'report' | 'purchase') => {
    if (submitted) return;
    sounds.playClick();

    if (actionKey === 'report' && !callVerified) {
      setShowNeedsCallHint(true);
      sounds.playWarning();
      return;
    }

    setChosenAction(actionKey);

    const isCorrect = actionKey === 'report' && callVerified;
    const scoreAwarded = isCorrect
      ? Math.round(60 + (foundIds.length / totalSuspiciousCount) * 40)
      : 0;
    const bonusAwarded = isCorrect && foundIds.length === totalSuspiciousCount ? (question.bonusPoints || 15) : 0;

    onSubmitAnswer({
      action: actionKey,
      callVerified,
      foundIds,
      foundCount: foundIds.length,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const isHandleFound = foundIds.includes('suspicious_handle');
  const isObstructionFound = foundIds.includes('suspicious_voice_obstruction');
  const isGiftCardsFound = foundIds.includes('suspicious_giftcards');

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is a direct messaging chat claiming to be your director. Find the suspicious elements within this conversation.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Use "Shadow Matching": inspect the sender profile handle, recognize the voice obstruction tactic, and verify via "Call Director".
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(foundIds.length > 0 || callVerified || chosenAction !== null) && !submitted && (
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
            <span className="text-slate-400">Suspicious Elements Found:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              foundIds.length === totalSuspiciousCount
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : foundIds.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {foundIds.length} / {totalSuspiciousCount}
            </span>
          </div>
        </div>
      </div>

      {/* Corporate Chat App Mockup (Teams / Slack Style) */}
      <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Chat Window Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs select-none">
                RC
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950" title="External Account" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Robert Chen</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  External Guest
                </span>
              </div>

              {/* SENDER HANDLE (Primary Hotspot) */}
              <div
                onClick={() => {
                  setIsProfileExpanded(!isProfileExpanded);
                  handleElementClick('suspicious_handle', true);
                }}
                className={`text-[11px] font-mono cursor-pointer rounded px-1.5 py-0.5 transition-colors inline-block mt-0.5 ${
                  isHandleFound
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Click to inspect underlying profile details"
              >
                &lt;robert.chen.freemail@gmail-notice.com&gt;
              </div>
            </div>
          </div>

          {/* Out-of-Band Tool: "Call Director" Button */}
          <button
            type="button"
            disabled={submitted}
            onClick={handleStartCall}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
              callVerified
                ? 'bg-slate-800 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{callVerified ? '✓ Desk Phone: Impersonation Confirmed' : 'Call Director (Out-of-Band)'}</span>
          </button>
        </div>

        {/* Profile Card Drawer if expanded */}
        {isProfileExpanded && (
          <div className="p-3.5 bg-slate-900 border-b border-slate-800 text-xs font-mono space-y-1.5 animate-fadeIn">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold text-slate-200">Executive Profile Inspection</span>
              <span className="text-rose-400">⚠️ Domain mismatch</span>
            </div>
            <div className="text-slate-300 text-[11px]">
              Display Name: <strong>Robert Chen (Director of Operations)</strong>
            </div>
            <div className="text-rose-300 text-[11px]">
              Authenticated Account: <strong>robert.chen.freemail@gmail-notice.com</strong> (Non-Corporate Freemail)
            </div>
            <div className="text-slate-400 text-[10px]">
              Official Corporate Domain: <strong>@company-internal.net</strong>
            </div>
          </div>
        )}

        {/* Chat Message Stream with Exact Sequence from changes.md */}
        <div className="p-6 space-y-4 bg-slate-950/40 min-h-[220px]">
          {/* Message 1 */}
          <div className="flex flex-col items-start space-y-1">
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-[85%] select-none">
              Hi, are you at your desk? I'm stuck in back-to-back executive meetings and need a quick favor.
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2">11:15 AM</span>
          </div>

          {/* Message 2: Voice Obstruction Tactic Hotspot */}
          <div className="flex flex-col items-start space-y-1">
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-[85%] select-none">
              <span
                onClick={() => handleElementClick('suspicious_voice_obstruction', true)}
                className={`rounded px-1.5 py-0.5 cursor-pointer transition-colors inline ${
                  isObstructionFound
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-semibold'
                    : 'text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Click to inspect this statement"
              >
                I cannot take phone calls right now, handle this over chat.
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2">11:16 AM</span>
          </div>

          {/* Message 3: Gift Card Demand Hotspot */}
          <div className="flex flex-col items-start space-y-1">
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-[85%] select-none">
              <span
                onClick={() => handleElementClick('suspicious_giftcards', true)}
                className={`rounded px-1.5 py-0.5 cursor-pointer transition-colors inline ${
                  isGiftCardsFound
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-semibold'
                    : 'text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Click to inspect this demand"
              >
                I urgently need 5 × ₹2,000 retail gift cards with personal funds for client rewards.
              </span>{' '}
              Please send photos of the scratched PIN codes on the back ASAP. I will reimburse you by evening.
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2">11:17 AM</span>
          </div>
        </div>

        {/* Warning if user tried to report without calling first */}
        {showNeedsCallHint && !callVerified && (
          <div className="mx-5 mb-3 p-3 rounded-xl bg-amber-950/50 border border-amber-500/60 text-xs text-amber-200 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Verify Out-of-Band first!</strong> Click the <strong>"Call Director"</strong> button to verify via their official office extension before filing the incident report.
              </span>
            </div>
            <button
              type="button"
              onClick={handleStartCall}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] whitespace-nowrap hover:bg-amber-400 transition-colors"
            >
              Call Now
            </button>
          </div>
        )}

        {/* Resolution Workflow Toolbar */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider font-mono">
              Decide your response:
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              {callVerified ? 'Phone verification complete' : `${foundIds.length} of ${totalSuspiciousCount} clues found`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('report')}
              className={`py-3 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                chosenAction === 'report'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Flag className="w-4 h-4 text-slate-400" />
              <span>Report Executive Impersonation</span>
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('purchase')}
              className={`py-3 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                chosenAction === 'purchase'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Agree to Buy Gift Cards</span>
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('purchase')}
              className={`py-3 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                chosenAction === 'codes'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Send Codes over Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Out-of-Band Call Simulation Modal */}
      {isCallingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsCallingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Phone className={`w-6 h-6 ${callingState === 'ringing' ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Out-of-Band Voice Verification</h3>
                <p className="text-xs font-mono text-cyan-400">Director Robert Chen (Ext: 302)</p>
              </div>
            </div>

            {callingState === 'ringing' ? (
              <div className="py-6 text-center space-y-3">
                <div className="text-sm font-mono text-slate-400 animate-pulse">
                  Dialing verified office desk extension... 📞
                </div>
                <div className="text-xs text-slate-500">
                  Calling via official enterprise PBX directory (bypassing chat)
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-slate-200 space-y-2 leading-relaxed">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real Director Robert Chen:</span>
                  </div>
                  <p className="italic text-slate-100 bg-slate-950/50 p-3 rounded-xl border border-emerald-500/20">
                    "Alex? Good thing you called my direct desk phone! I'm sitting right here in my office preparing next quarter's roadmap. I never sent you any chat messages and I would never ask an employee to buy gift cards on their personal card! That chat account is an impersonator — report them immediately!"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinishCall}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4 text-slate-400" />
                  <span>End Call & Return to Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
