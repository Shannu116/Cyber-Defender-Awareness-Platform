import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { 
  BellRing, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Key, 
  Lock, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  Check, 
  Smartphone,
  MapPin,
  Laptop,
  Info,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface MfaStormChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const MfaStormChallenge: React.FC<MfaStormChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral } = useEcho();
  const [stage, setStage] = useState<'inspect' | 'remediate'>('inspect');
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [attemptedApprove, setAttemptedApprove] = useState(false);
  const [selectedRemediations, setSelectedRemediations] = useState<string[]>([]);
  const [primaryAction, setPrimaryAction] = useState<'deny' | 'report' | 'approve' | null>(null);

  const totalSuspiciousCount = 3;

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setStage('inspect');
    setFoundIds([]);
    setAttemptedApprove(false);
    setSelectedRemediations([]);
    setPrimaryAction(null);
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

      if (elementId === 'suspicious_storm') {
        explainThreat({
          id: 'suspicious_storm',
          title: 'MFA Fatigue Attack (Push Bombing)',
          subtitle: '5th consecutive notification in 2 minutes',
          severity: 'critical',
          explanation: 'The attacker already possesses your valid password and is spamming your smartphone with repeated 2FA/MFA push alerts. They rely on annoyance, panic, or accidental taps to wear you down until you hit "Approve".',
          attackerObjective: 'To bypass multi-factor authentication through psychological wear-down and prompt fatigue.',
          proTip: 'Never approve an unexpected MFA prompt just to make it go away. Deny it and report immediately.'
        });
      } else if (elementId === 'suspicious_location') {
        explainThreat({
          id: 'suspicious_location',
          title: 'Geographic Impossible Travel Anomaly',
          subtitle: 'Origin: Frankfurt, Germany',
          severity: 'high',
          explanation: 'The authentication request originates from Germany while you are stationed locally. Unless you are actively connected to an authorized international corporate VPN gateway, this indicates an overseas intruder.',
          attackerObjective: 'Remote unauthorized account takeover by foreign adversary or relay node.',
          proTip: 'Always check the city and country listed on mobile authenticator verification prompts.'
        });
      } else if (elementId === 'suspicious_device') {
        explainThreat({
          id: 'suspicious_device',
          title: 'Rogue Device & Anonymous Tor/VPN Proxy',
          subtitle: 'Chrome / Linux (IP: 185.220.101.5)',
          severity: 'high',
          explanation: 'The requesting system does not match your enrolled corporate endpoint device. The IP address corresponds to a known exit node or unmanaged cloud host rather than your office network.',
          attackerObjective: 'To mask the attacker\'s true physical location while hijacking your session.',
          proTip: 'Check the browser, OS, and IP address reported by your authenticator before approving.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralHint || 'This is typical authenticator metadata. Focus on indicators that do not match your current activity.',
        'Standard Authenticator Data'
      );
    }
  };

  const handlePrimaryAction = (action: 'deny' | 'report' | 'approve') => {
    if (submitted) return;
    setPrimaryAction(action);

    if (action === 'approve') {
      sounds.playWarning();
      setAttemptedApprove(true);
      return;
    }

    sounds.playSuccess();
    setStage('remediate');
  };

  const toggleRemediation = (actionId: string) => {
    if (submitted) return;
    sounds.playClick();
    setSelectedRemediations(prev => 
      prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]
    );
  };

  const handleFinalSubmit = () => {
    if (submitted) return;
    sounds.playClick();

    const isCorrect = (primaryAction === 'deny' || primaryAction === 'report') &&
      selectedRemediations.includes('change_password') &&
      selectedRemediations.includes('report_soc');

    const scoreAwarded = isCorrect
      ? Math.round(50 + (foundIds.length / totalSuspiciousCount) * 50)
      : Math.round((foundIds.length / totalSuspiciousCount) * 35);

    const bonusAwarded = isCorrect && foundIds.length >= 2 ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      primaryAction,
      foundIds,
      selectedRemediations,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const isLocationFound = foundIds.includes('suspicious_location');
  const isDeviceFound = foundIds.includes('suspicious_device');
  const isStormFound = foundIds.includes('suspicious_storm');

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <BellRing className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is an incoming MFA authentication alert. Find the suspicious elements within it.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Click on details in the notification that prove this sign-in attempt is unauthorized.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(foundIds.length > 0 || stage === 'remediate' || selectedRemediations.length > 0 || primaryAction !== null || attemptedApprove) && !submitted && (
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

      {/* Stage 1: Authenticator Prompt Inspection */}
      {stage === 'inspect' && (
        <div className="max-w-md mx-auto rounded-[36px] bg-slate-950 border-[6px] border-slate-800 p-5 shadow-2xl relative overflow-hidden">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 pb-3 border-b border-slate-900">
            <span>2:14 PM</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-800" />
            </div>
            {/* RAPID STORM BANNER: Clickable red flag, NO hover giveaway */}
            <span
              onClick={() => handleElementClick('suspicious_storm', true)}
              className={`cursor-pointer text-[10px] px-2 py-0.5 rounded transition-colors ${
                isStormFound
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-bold'
                  : 'text-rose-400'
              }`}
            >
              ⚡ 5th notification in 2 mins
            </span>
          </div>

          {/* Prompt Body Card */}
          <div className="py-4 space-y-3">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-lg select-none">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Sign-in Approval Request</div>
                  <div className="text-[10px] text-slate-400 font-mono">Corporate Identity Authenticator</div>
                </div>
              </div>

              {/* LOCATION & DEVICE METADATA: Looks like normal text, NO hover color giveaway */}
              <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 font-mono">
                {/* Location row */}
                <div
                  onClick={() => handleElementClick('suspicious_location', true)}
                  className={`flex items-center gap-1.5 cursor-pointer rounded p-1 transition-colors ${
                    isLocationFound
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Location: Frankfurt, Germany</span>
                </div>

                {/* Device row */}
                <div
                  onClick={() => handleElementClick('suspicious_device', true)}
                  className={`flex items-center gap-1.5 cursor-pointer rounded p-1 transition-colors ${
                    isDeviceFound
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Device: Chrome / Linux (IP: 185.220.101.5)</span>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                You did not initiate this login. Decide what to do with this request:
              </p>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePrimaryAction('deny')}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deny Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrimaryAction('approve')}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  <span>Approve Request</span>
                </button>
              </div>
            </div>

            {/* Warning if user tapped Approve */}
            {attemptedApprove && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-xs text-rose-200 animate-fadeIn space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Wait! You did not sign in!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Approving this prompt gives the hacker immediate entry to your account. Deny the request immediately!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stage 2: Post-Denial Remediation */}
      {stage === 'remediate' && (
        <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Login Request Denied</h4>
              <p className="text-xs text-slate-400">Because the attacker knows your password, what must you do immediately?</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => toggleRemediation('change_password')}
              className={`w-full p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                selectedRemediations.includes('change_password')
                  ? 'bg-emerald-950/60 border-2 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Immediately change my corporate password</span>
              </div>
              {selectedRemediations.includes('change_password') && <Check className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => toggleRemediation('report_soc')}
              className={`w-full p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                selectedRemediations.includes('report_soc')
                  ? 'bg-emerald-950/60 border-2 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flag className="w-4 h-4 text-purple-400" />
                <span>Report the compromised password and MFA storm to IT Security</span>
              </div>
              {selectedRemediations.includes('report_soc') && <Check className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => toggleRemediation('mute_phone')}
              className={`w-full p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                selectedRemediations.includes('mute_phone')
                  ? 'bg-rose-950 border-2 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>Put phone on Silent and do nothing else</span>
              </div>
              {selectedRemediations.includes('mute_phone') && <XCircle className="w-4 h-4 text-rose-400" />}
            </button>
          </div>

          <button
            type="button"
            disabled={submitted || selectedRemediations.length === 0}
            onClick={handleFinalSubmit}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg transition-all"
          >
            Submit Security Actions
          </button>
        </div>
      )}
    </div>
  );
};
