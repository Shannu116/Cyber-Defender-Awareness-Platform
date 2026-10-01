import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Smartphone, 
  Search, 
  ExternalLink, 
  Trash2, 
  Flag, 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  UserX,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface MessageInvestigateChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const MessageInvestigateChallenge: React.FC<MessageInvestigateChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral } = useEcho();
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [chosenAction, setChosenAction] = useState<string | null>(null);

  const totalSuspiciousCount = 3;

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setFoundIds([]);
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
          title: 'Personal 10-Digit Mobile Number (+91 98765 43210)',
          subtitle: 'Unauthorized Courier Sender Identity',
          severity: 'high',
          explanation: 'Legitimate courier companies (e.g., India Post, BlueDart, DHL) communicate using verified alphanumeric enterprise sender IDs (e.g. VK-BLUEDART), never personal mobile SIM cards.',
          attackerObjective: 'To impersonate logistics services cheaply using untraceable prepaid SIM cards.',
          proTip: 'Never trust delivery notifications arriving from personal 10-digit mobile numbers.'
        });
      } else if (elementId === 'suspicious_fee') {
        explainThreat({
          id: 'suspicious_fee',
          title: 'Arbitrary Redelivery Fee Demand (₹25)',
          subtitle: 'Micro-Payment Phishing Pretext',
          severity: 'high',
          explanation: 'Legitimate couriers do not require payment of small arbitrary "redelivery fees" over SMS to complete a delivery. Attackers use nominal amounts so victims won\'t hesitate, allowing the fake portal to steal card credentials.',
          attackerObjective: 'To steal credit/debit card numbers, expiration dates, CVVs, and banking OTPs.',
          proTip: 'Courier services never withhold parcels for ₹20-50 online credit card payments.'
        });
      } else if (elementId === 'suspicious_link') {
        explainThreat({
          id: 'suspicious_link',
          title: 'Counterfeit Tracking Portal Link',
          subtitle: 'Rogue Domain: delivery-support.example/reschedule',
          severity: 'critical',
          explanation: 'The domain "delivery-support.example" is a fraudulent site, not an official courier tracking portal. Entering info here sends your credentials directly to cyber criminals.',
          attackerObjective: 'To harvest banking details and install unauthorized mobile profile payloads.',
          proTip: 'Always track packages directly through the merchant\'s app or official website bookmark.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralHint || 'This part appears standard. Keep examining the sender number and links for deceptive cues.',
        'Authentic SMS Element'
      );
    }
  };

  const handleAction = (actionKey: 'report' | 'delete' | 'pay' | 'reply') => {
    if (submitted) return;
    sounds.playClick();
    setChosenAction(actionKey);

    const isCorrect = actionKey === 'report' || (actionKey === 'delete' && foundIds.length >= 2);
    const scoreAwarded = isCorrect
      ? Math.round(50 + (foundIds.length / totalSuspiciousCount) * 50)
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
  const isLinkFound = foundIds.includes('suspicious_link');

  return (
    <div className="space-y-6">
      {/* Top Scenario & Investigation Objective */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is an SMS received on your smartphone. Find the suspicious elements within it.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tap directly on the phone number, text lines, or links to uncover indicators of fraud.
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

      {/* Realistic Smartphone Screen */}
      <div className="max-w-md mx-auto rounded-[36px] bg-slate-950 border-[6px] border-slate-800 p-5 shadow-2xl relative overflow-hidden">
        {/* Device Notch & Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 pb-3 border-b border-slate-900">
          <span>9:41 AM</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-800" />
          </div>
          <span className="flex items-center gap-1">5G 📶 100%</span>
        </div>

        {/* Messaging App Top Bar (Plain text appearance, NO inspect buttons) */}
        <div className="py-3 flex items-center justify-between border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
              <Package className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <div 
                onClick={() => handleElementClick('title', false, 'The title claims to be a courier service, but check the actual phone number.')}
                className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span>Express Courier Alert</span>
                <span className="text-[10px] px-1.5 rounded bg-slate-800 text-slate-400">SMS</span>
              </div>

              {/* SENDER NUMBER: Completely uniform, NO hover color giveaway */}
              <div
                onClick={() => handleElementClick('suspicious_sender', true)}
                className={`text-[11px] font-mono cursor-pointer rounded px-1 py-0.2 transition-colors ${
                  isSenderFound
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-bold'
                    : 'text-slate-400'
                }`}
              >
                +91 98765 43210
              </div>
            </div>
          </div>
        </div>

        {/* SMS Bubble (Plain text, NO hover color giveaways) */}
        <div className="space-y-2 mb-4">
          <div className="text-center text-[10px] font-mono text-slate-500">Today • 9:38 AM</div>

          <div className="rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 p-4 text-xs text-slate-200 space-y-3 shadow-lg cursor-pointer select-none">
            <div 
              onClick={() => handleElementClick('bubble_heading', false, 'Generic package alert heading used to capture attention.')}
              className="flex items-center gap-2 font-bold text-white text-sm"
            >
              <span>📦</span>
              <span>Delivery Alert</span>
            </div>

            <p 
              onClick={() => handleElementClick('bubble_body', false, 'A common pretext claiming an incomplete address to justify rescheduling.')}
              className="leading-relaxed text-slate-300"
            >
              Your package could not be delivered to your registered address due to an incomplete street number.
            </p>

            {/* FEE DEMAND PHRASE: Looks identical to surrounding text, NO hover giveaway */}
            <p
              onClick={() => handleElementClick('suspicious_fee', true)}
              className={`leading-relaxed rounded px-1.5 py-1 transition-colors ${
                isFeeFound
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-semibold'
                  : 'text-slate-300'
              }`}
            >
              A delivery fee of ₹25 is required to reschedule your delivery.
            </p>

            {/* LINK: Standard link appearance, NO special hover glow */}
            <div className="pt-1">
              <div
                onClick={() => handleElementClick('suspicious_link', true)}
                className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isLinkFound
                    ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-200'
                    : 'bg-slate-950 border border-slate-800 text-cyan-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>Track / Reschedule Package</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  delivery-support.example/reschedule?pkg=9821
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-900">
          <div className="text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
            Decide your response:
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleAction('report')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                chosenAction === 'report'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <span>Report & Block</span>
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleAction('delete')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                chosenAction === 'delete'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Delete SMS</span>
            </button>
          </div>

          <button
            type="button"
            disabled={submitted}
            onClick={() => handleAction('pay')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              chosenAction === 'pay'
                ? 'bg-slate-800 text-white border-2 border-cyan-400'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span>Pay ₹25 fee via link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
