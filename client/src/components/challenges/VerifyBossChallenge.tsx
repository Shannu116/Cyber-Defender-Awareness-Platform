import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  PhoneCall, 
  MessageSquare, 
  UserCheck, 
  Flag, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneOff, 
  ShieldAlert, 
  ShieldCheck, 
  Info,
  Check,
  RotateCcw
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
  const { explainThreat, explainNeutral } = useEcho();
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [callVerified, setCallVerified] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);
  const [chosenAction, setChosenAction] = useState<string | null>(null);

  const totalSuspiciousCount = 4;

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setFoundIds([]);
    setCallVerified(false);
    setCallInProgress(false);
    setChosenAction(null);
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

      if (elementId === 'suspicious_sender') {
        explainThreat({
          id: 'suspicious_sender',
          title: 'External Unofficial Freemail Account',
          subtitle: '<robert.chen.freemail@gmail-notice.com>',
          severity: 'high',
          explanation: 'The sender is communicating from an external Gmail-lookalike address (@gmail-notice.com) instead of your company domain. Attackers use free webmail services to impersonate leadership because anyone can create any display name.',
          attackerObjective: 'To impersonate executive leadership without triggering company email security gateways.',
          proTip: 'Always inspect the actual email/account address, not just the display name shown in chat.'
        });
      } else if (elementId === 'suspicious_meeting') {
        explainThreat({
          id: 'suspicious_meeting',
          title: 'Deliberate Obstruction of Voice Verification',
          subtitle: '"Stuck in an executive meeting, can\'t take calls"',
          severity: 'medium',
          explanation: 'Claiming an urgent meeting or inability to answer phone calls is a classic social engineering ploy. It discourages victims from calling to verify their true identity.',
          attackerObjective: 'To isolate the employee and prevent real-time out-of-band identity verification.',
          proTip: 'If someone asks for unusual urgent financial actions while claiming they cannot talk, always verify via a trusted secondary channel or wait until voice confirmation.'
        });
      } else if (elementId === 'suspicious_giftcards') {
        explainThreat({
          id: 'suspicious_giftcards',
          title: 'Untraceable Gift Card Purchase Request',
          subtitle: '5 × ₹2,000 Apple / Google Play Gift Cards',
          severity: 'critical',
          explanation: 'Corporate procurement has established vendor billing systems and never instructs employees to purchase retail gift cards on personal cards. Gift cards are untraceable and cannot be refunded.',
          attackerObjective: 'To obtain instantly liquid, non-refundable digital currency that can be laundered globally.',
          proTip: 'No legitimate executive will ask you to purchase gift cards for clients or company bonuses.'
        });
      } else if (elementId === 'suspicious_codes') {
        explainThreat({
          id: 'suspicious_codes',
          title: 'Immediate Demand for Scratched PIN Codes',
          subtitle: 'Send photos of scratched PIN codes ASAP',
          severity: 'critical',
          explanation: 'Digital gift cards are cashed out the second the PIN codes are visible. Once sent over chat, the funds are drained within minutes. Any promise of reimbursement is completely fabricated.',
          attackerObjective: 'To harvest the secret redemption credentials and drain account funds immediately.',
          proTip: 'Never reveal, photograph, or transmit scratched gift card redemption codes under any circumstances.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralHint || 'This part looks typical. Continue analyzing the chat messages for social engineering.',
        'Standard Message Element'
      );
    }
  };

  const handleCallManager = () => {
    if (submitted) return;
    sounds.playClick();
    setCallInProgress(true);

    setTimeout(() => {
      setCallInProgress(false);
      setCallVerified(true);
      sounds.playSuccess();
    }, 2000);
  };

  const handleFinalSubmit = (actionKey: 'report' | 'call_and_refuse' | 'purchase') => {
    if (submitted) return;
    sounds.playClick();
    setChosenAction(actionKey);

    const isCorrect = actionKey === 'report' || (actionKey === 'call_and_refuse' && (foundIds.length >= 2 || callVerified));
    const scoreAwarded = isCorrect
      ? Math.round(50 + (foundIds.length / totalSuspiciousCount) * 50)
      : 0;
    const bonusAwarded = isCorrect && (foundIds.length >= 3 || callVerified) ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      action: actionKey,
      foundIds,
      foundCount: foundIds.length,
      callVerified,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const isSenderFound = foundIds.includes('suspicious_sender');
  const isMeetingFound = foundIds.includes('suspicious_meeting');
  const isGiftCardsFound = foundIds.includes('suspicious_giftcards');
  const isCodesFound = foundIds.includes('suspicious_codes');

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is a chat claiming to be your manager. Find the suspicious elements within this conversation.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Click on the sender details or specific phrases in the messages that raise social engineering red flags.
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

      {/* Chat Simulation Container */}
      <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Chat Window Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs select-none">
              RC
            </div>
            <div>
              <div 
                onClick={() => handleElementClick('name_header', false, 'The display name says "Robert Chen", but examine the underlying account details.')}
                className="text-sm font-bold text-white cursor-pointer"
              >
                Robert Chen (Director of Operations)
              </div>

              {/* SENDER DETAILS: Plain text, NO hover color giveaway */}
              <div
                onClick={() => handleElementClick('suspicious_sender', true)}
                className={`text-[11px] font-mono cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                  isSenderFound
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-bold'
                    : 'text-slate-400'
                }`}
              >
                &lt;robert.chen.freemail@gmail-notice.com&gt; • External Account
              </div>
            </div>
          </div>

          {/* Quick Out-of-Band Call Verification */}
          <button
            type="button"
            onClick={handleCallManager}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl border flex items-center gap-1.5 transition-all ${
              callVerified
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-cyan-300 border-slate-700 hover:border-cyan-500/40'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>{callVerified ? '✓ Real Manager Called: "Not Me!"' : callInProgress ? 'Calling Ext 302...' : 'Call Official Ext: 302'}</span>
          </button>
        </div>

        {/* Chat Message Stream */}
        <div className="p-6 space-y-4 bg-slate-950/40 min-h-[220px]">
          {/* Message 1 */}
          <div className="flex flex-col items-start space-y-1">
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-[85%] cursor-pointer select-none">
              Hey,{' '}
              {/* MEETING EXCUSE PHRASE: NO hover giveaway */}
              <span
                onClick={() => handleElementClick('suspicious_meeting', true)}
                className={`rounded px-1 py-0.5 transition-colors ${
                  isMeetingFound
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-semibold'
                    : 'text-slate-200'
                }`}
              >
                I'm stuck in an executive meeting right now and can't take phone calls.
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2">11:15 AM</span>
          </div>

          {/* Message 2 */}
          <div className="flex flex-col items-start space-y-1">
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-[85%] cursor-pointer select-none">
              {/* GIFTCARDS REQUEST PHRASE: NO hover giveaway */}
              <span
                onClick={() => handleElementClick('suspicious_giftcards', true)}
                className={`rounded px-1 py-0.5 transition-colors ${
                  isGiftCardsFound
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-semibold'
                    : 'text-slate-200'
                }`}
              >
                I urgently need 5 × ₹2,000 Apple / Google Play gift cards for a client presentation.
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2">11:16 AM</span>
          </div>

          {/* Message 3 */}
          <div className="flex flex-col items-start space-y-1">
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-[85%] cursor-pointer select-none">
              Please buy them on your personal card and{' '}
              {/* CODES DEMAND PHRASE: NO hover giveaway */}
              <span
                onClick={() => handleElementClick('suspicious_codes', true)}
                className={`rounded px-1 py-0.5 transition-colors ${
                  isCodesFound
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-semibold'
                    : 'text-slate-200'
                }`}
              >
                send me photos of the scratched PIN codes on the back ASAP
              </span>
              . I will reimburse you by evening.
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2">11:17 AM</span>
          </div>
        </div>

        {/* Action Decision Section */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
            Choose your response:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('report')}
              className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                chosenAction === 'report'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <span>Report Impersonation</span>
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('call_and_refuse')}
              className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                chosenAction === 'call_and_refuse'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PhoneOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Refuse & Verify Voice</span>
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('purchase')}
              className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                chosenAction === 'purchase'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Buy Gift Cards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
