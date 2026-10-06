import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { 
  Smartphone, 
  ExternalLink, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  UserX,
  CreditCard,
  RotateCcw,
  X,
  Building2,
  Plane,
  Package,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface MessageInvestigateChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

interface ThreadItem {
  id: string;
  senderName: string;
  senderAddress: string;
  isRogue: boolean;
  preview: string;
  time: string;
  unread: boolean;
}

const INBOX_THREADS: ThreadItem[] = [
  {
    id: 'thread-hdfc',
    senderName: 'HDFC Bank',
    senderAddress: 'VM-HDFCBK',
    isRogue: false,
    preview: 'INR 4,500.00 debited from A/c XX4120 on 12-Oct...',
    time: '8:45 AM',
    unread: false
  },
  {
    id: 'thread-courier',
    senderName: 'Delivery Notification',
    senderAddress: '+91 98765 43210',
    isRogue: true,
    preview: 'Your package is pending customs clearance. Pay a small...',
    time: '9:38 AM',
    unread: true
  },
  {
    id: 'thread-indigo',
    senderName: 'IndiGo Airlines',
    senderAddress: 'AX-INDIGO',
    isRogue: false,
    preview: 'Flight 6E 402 to DEL is on schedule. Web check-in open...',
    time: 'Yesterday',
    unread: false
  }
];

export const MessageInvestigateChallenge: React.FC<MessageInvestigateChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral, registerChecklist, clearChecklist } = useEcho();
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-courier');
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [chosenAction, setChosenAction] = useState<string | null>(null);
  const [showPhishedWarning, setShowPhishedWarning] = useState(false);

  const totalSuspiciousCount = 2; // 2 main clues per changes.md

  // Register Echo checklist on mount
  useEffect(() => {
    registerChecklist([
      {
        id: 'suspicious_sender',
        label: 'Sender phone number header',
        hint: 'Compare the sender identity of the delivery alert with the bank and airline texts in your inbox. Notice anything strange about who sent it?',
        severity: 'high',
      },
      {
        id: 'suspicious_fee',
        label: 'Micro-payment clearance hook',
        hint: 'Read the message body carefully. Why is an unexpected small fee required to release a normal package?',
        severity: 'critical',
      },
    ]);
    return () => clearChecklist();
  }, [registerChecklist, clearChecklist]);

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setFoundIds([]);
    setChosenAction(null);
    setShowPhishedWarning(false);
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
          title: 'Personal 10-Digit Mobile Number (+91 98765 43210)',
          subtitle: 'Odd One Out: Rogue Sender vs Alphanumeric Headers',
          severity: 'high',
          explanation: 'The authentic messages in your inbox (VM-HDFCBK and AX-INDIGO) use registered enterprise alphanumeric sender headers. This fraudulent parcel message arrives from an untraceable 10-digit prepaid mobile number (+91 98765 43210).',
          attackerObjective: 'To impersonate reputable logistics couriers cheaply using disposable SIM cards.',
          proTip: 'Official courier agencies (India Post, BlueDart, DHL) communicate using enterprise headers, never random 10-digit phone numbers.'
        });
      } else if (elementId === 'suspicious_fee') {
        explainThreat({
          id: 'suspicious_fee',
          title: 'Micro-Payment Rescheduling Hook (₹25)',
          subtitle: 'Customs Clearance Pretext',
          severity: 'critical',
          explanation: 'Legitimate parcel couriers never withhold shipments over small arbitrary fees demanded via SMS links. Attackers request nominal sums like ₹25 so victims pay without second thought, allowing rogue portals to skim credit card details.',
          attackerObjective: 'To steal credit card credentials, expiration dates, CVVs, and banking OTPs.',
          proTip: 'Never make credit card payments via SMS links to release undelivered parcels.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralHint || 'This is standard automated business messaging. Focus on comparing sender formats and checking for payment traps.',
        'Legitimate Notification'
      );
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (submitted) return;
    sounds.playWarning();
    setShowPhishedWarning(true);
  };

  const handleAction = (actionKey: 'delete_block' | 'pay_fee' | 'reply') => {
    if (submitted) return;
    sounds.playClick();
    setChosenAction(actionKey);

    const isCorrect = actionKey === 'delete_block' && foundIds.length >= 1;
    const scoreAwarded = isCorrect
      ? Math.round(50 + (foundIds.length / totalSuspiciousCount) * 50)
      : actionKey === 'delete_block'
      ? 50
      : 0;
    const bonusAwarded = isCorrect && foundIds.length === totalSuspiciousCount ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      action: actionKey,
      foundIds,
      foundCount: foundIds.length,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const isSenderFound = foundIds.includes('suspicious_sender');
  const isFeeFound = foundIds.includes('suspicious_fee');

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is an SMS received on your smartphone. Find the suspicious elements within it.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Review your message inbox using the "Odd One Out" clue: compare authentic business texts against the rogue parcel alert. (Find both clues to pass)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(foundIds.length > 0 || chosenAction !== null) && !submitted && (
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

      {/* Main Container: Mobile Phone Mockup */}
      <div className="max-w-md mx-auto rounded-[40px] bg-slate-950 border-[6px] border-slate-800 p-5 shadow-2xl relative overflow-hidden">
        {/* Device Notch & Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 pb-3 border-b border-slate-900">
          <span>9:41 AM</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-800" />
          </div>
          <span className="flex items-center gap-1 font-semibold text-slate-300">5G 📶 100%</span>
        </div>

        {/* Odd One Out Inbox Selector Tabs */}
        <div className="py-2.5 px-1 border-b border-slate-800/80 mb-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Recent Messages (Compare Senders)</span>
            <span className="text-cyan-400 font-semibold">"Odd One Out" Metaphor</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {INBOX_THREADS.map(thread => {
              const isActive = activeThreadId === thread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    if (!thread.isRogue) {
                      handleElementClick(
                        thread.id,
                        false,
                        `Authentic automated business message from registered enterprise header "${thread.senderAddress}". Notice it does not use a 10-digit personal SIM number!`
                      );
                    }
                  }}
                  className={`p-1.5 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-slate-800 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    {thread.id === 'thread-hdfc' && <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />}
                    {thread.id === 'thread-courier' && <Package className="w-3 h-3 text-amber-400 shrink-0" />}
                    {thread.id === 'thread-indigo' && <Plane className="w-3 h-3 text-cyan-400 shrink-0" />}
                    <span className="text-[10px] font-bold text-white truncate">{thread.senderName}</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {thread.senderAddress}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Message View */}
        {activeThreadId === 'thread-courier' ? (
          <div>
            {/* Courier Chat Top Bar */}
            <div className="py-2.5 flex items-center justify-between border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-white text-xs">
                  <Package className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div 
                    onClick={() => handleElementClick('title', false, 'The contact name says "Express Courier Alert", but look below at the actual phone number.')}
                    className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Express Courier Alert</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">SMS</span>
                  </div>

                  {/* SENDER NUMBER (Dead Giveaway hotspot): Tapping triggers discovery */}
                  <div
                    onClick={() => handleElementClick('suspicious_sender', true)}
                    className={`text-[11px] font-mono cursor-pointer rounded px-1.5 py-0.5 transition-colors inline-block ${
                      isSenderFound
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Tap to inspect sender identity"
                  >
                    +91 98765 43210
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-500">Today 9:38 AM</span>
            </div>

            {/* Courier SMS Bubble */}
            <div className="space-y-3 mb-4">
              <div className="rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 p-4 text-xs text-slate-200 space-y-3 shadow-lg select-none">
                <div 
                  onClick={() => handleElementClick('bubble_heading', false, 'Package alert subject header designed to create urgency.')}
                  className="flex items-center gap-2 font-bold text-white text-xs cursor-pointer"
                >
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Parcel Status: Pending Customs</span>
                </div>

                {/* Micro-payment Hook hotspot */}
                <p
                  onClick={() => handleElementClick('suspicious_fee', true)}
                  className={`leading-relaxed rounded p-2 transition-colors cursor-pointer ${
                    isFeeFound
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-semibold'
                      : 'text-slate-200 hover:bg-slate-800/40'
                  }`}
                  title="Tap to inspect this requirement"
                >
                  Your package is pending customs clearance. Pay a small delivery rescheduling fee of ₹25 to release it.
                </p>

                {/* Destination Link */}
                <div className="pt-1">
                  <div
                    onClick={handleLinkClick}
                    className="p-2.5 rounded-xl cursor-pointer bg-slate-950 border border-slate-800 hover:border-slate-700 text-cyan-400 transition-colors"
                  >
                    <div className="font-bold flex items-center justify-between text-xs">
                      <span>delivery-support.example/reschedule</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Tracking ID: #IN-8921-PKG
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Decision Toolbar */}
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <div className="text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                Decide your response:
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => handleAction('delete_block')}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    chosenAction === 'delete_block'
                      ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delete & Block Number</span>
                </button>

                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => handleAction('pay_fee')}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    chosenAction === 'pay_fee'
                      ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pay ₹25 fee via link</span>
                </button>

                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => handleAction('reply')}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    chosenAction === 'reply'
                      ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reply to Message</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Legitimate Thread Preview (HDFC Bank or IndiGo) */
          <div className="space-y-3 py-2">
            <div className="py-2.5 flex items-center justify-between border-b border-slate-800/80 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                  {activeThreadId === 'thread-hdfc' ? 'HB' : '6E'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {activeThreadId === 'thread-hdfc' ? 'HDFC Bank' : 'IndiGo Airlines'}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Official Header: {activeThreadId === 'thread-hdfc' ? 'VM-HDFCBK' : 'AX-INDIGO'}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Verified Entity</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              {activeThreadId === 'thread-hdfc' ? (
                <p className="leading-relaxed">
                  INR 4,500.00 debited from A/c XX4120 on 12-Oct-26. Info: UPI/3291048123/MERCHANT. If this wasn't you, call 1800-202-6161.
                </p>
              ) : (
                <p className="leading-relaxed">
                  Flight 6E 402 to DEL is on schedule for departure at 17:30. Web check-in is open at goindigo.in. Please arrive 2 hours prior.
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>This is an authentic business message.</span>
              <button
                type="button"
                onClick={() => setActiveThreadId('thread-courier')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <span>Check Parcel Alert</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simulated Phished Warning Modal if user clicks tracking link */}
      {showPhishedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/60 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowPhishedWarning(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">Smishing Link Simulation</h3>
                <p className="text-xs text-slate-400">Untrusted tracking portal link tapped</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p className="font-semibold text-rose-200">
                ⚠️ In a real attack, visiting <strong className="font-mono text-rose-300">delivery-support.example/reschedule</strong> opens a fake card payment form designed to skim your credit card credentials.
              </p>
              <p className="text-slate-400">
                Legitimate logistics agencies never ask for nominal fees over random SMS links. Always track packages directly on the official merchant app.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPhishedWarning(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
            >
              Back to Message & Delete/Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
