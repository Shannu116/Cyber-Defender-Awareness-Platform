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
  RotateCcw,
  Radio,
  ArrowRight,
  Info,
  RefreshCw,
  Trash2
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
  const { explainThreat, explainNeutral, registerChecklist, clearChecklist } = useEcho();

  // Navigation steps in the labyrinth
  const [currentStep, setCurrentStep] = useState<'alert' | 'triage' | 'credentials' | 'compromised'>('alert');
  const [foundIds, setFoundIds] = useState<string[]>([]);
  
  // Selection states for decisions
  const [selectedTriage, setSelectedTriage] = useState<string | null>(null);
  const [selectedCredAction, setSelectedCredAction] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);

  const totalSuspiciousCount = 3;

  // Register Echo checklist on mount
  useEffect(() => {
    registerChecklist([
      {
        id: 'suspicious_fatigue',
        label: 'MFA Push Bombing / Fatigue storm',
        hint: 'Observe the frequency of notifications on the lockscreen. What does it mean when 5 authorization alerts hit your phone in 2 minutes?',
        severity: 'critical',
      },
      {
        id: 'suspicious_location',
        label: 'Impossible travel geographic anomaly',
        hint: 'Inspect the location listed in the sign-in details. Are you anywhere near Frankfurt, Germany right now?',
        severity: 'high',
      },
      {
        id: 'suspicious_device',
        label: 'Rogue device and anonymous Tor node',
        hint: 'Examine the operating system and device information in the prompt. Does Chrome / Linux Tor Node look like your usual workplace machine?',
        severity: 'high',
      },
    ]);
    return () => clearChecklist();
  }, [registerChecklist, clearChecklist]);

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setCurrentStep('alert');
    setFoundIds([]);
    setSelectedTriage(null);
    setSelectedCredAction(null);
    setTriageError(null);
    setCredError(null);
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

      if (elementId === 'suspicious_fatigue') {
        explainThreat({
          id: 'suspicious_fatigue',
          title: 'MFA Fatigue Attack (Push Bombing)',
          subtitle: 'Alert 5 of 5 — 5 repeated prompts in 2 minutes',
          severity: 'critical',
          explanation: 'The attacker already possesses your corporate password. They are spamming your phone with repeated push requests, betting that annoyance, panic, or a hasty tap will cause you to hit "Approve" just to silence the buzzing.',
          attackerObjective: 'To bypass Multi-Factor Authentication by wearing down user vigilance through prompt fatigue.',
          proTip: 'Never approve an unexpected MFA prompt. Always deny and trigger incident remediation immediately.'
        });
      } else if (elementId === 'suspicious_location') {
        explainThreat({
          id: 'suspicious_location',
          title: 'Geographic Impossible Travel Anomaly',
          subtitle: 'Location: Frankfurt, Germany',
          severity: 'high',
          explanation: 'The sign-in attempt originates thousands of miles away in Germany while you are in your local office. This geographic impossibility indicates a remote adversary attempting unauthorized session takeover.',
          attackerObjective: 'To access corporate networks from international IP pools or cloud infrastructure.',
          proTip: 'Always verify the city, state, and country shown in your mobile authenticator.'
        });
      } else if (elementId === 'suspicious_device') {
        explainThreat({
          id: 'suspicious_device',
          title: 'Rogue Device via Anonymizing Tor Node',
          subtitle: 'Device: Chrome / Linux (Tor Node)',
          severity: 'high',
          explanation: 'The requesting workstation is running Linux over the Tor anonymity network rather than your corporate-managed enterprise laptop image.',
          attackerObjective: 'To obscure identity and mask the adversary\'s physical workstation.',
          proTip: 'Compare device operating systems and browser types against your own hardware.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralHint || 'This is typical authenticator lockscreen data. Focus on inspecting the alerts and following the 3-step escape path.',
        'Lockscreen Element'
      );
    }
  };

  // Phase 1 Decision: Tapping Approve (Trap) vs Deny (Advance to Phase 2)
  const handleApproveTrap = () => {
    if (submitted) return;
    sounds.playWarning();
    setCurrentStep('compromised');
  };

  const handleDenyStep = () => {
    if (submitted) return;
    sounds.playSuccess();
    setCurrentStep('triage');
  };

  // Phase 2 Decision: Handling the post-denial incident
  const handleTriageSubmit = (choiceId: string) => {
    if (submitted) return;
    sounds.playClick();
    setSelectedTriage(choiceId);

    if (choiceId === 'report_it') {
      setTriageError(null);
      sounds.playSuccess();
      setCurrentStep('credentials');
    } else if (choiceId === 'silent') {
      sounds.playWarning();
      setTriageError('Muting your phone leaves your account vulnerable. The attacker still possesses your valid credentials!');
    } else if (choiceId === 'restart') {
      sounds.playWarning();
      setTriageError('Restarting your phone does not protect your account. The unauthorized login attempts are occurring on corporate servers.');
    }
  };

  // Phase 3 Decision: Final Credential Remediation
  const handleCredentialSubmit = (choiceId: string) => {
    if (submitted) return;
    sounds.playClick();
    setSelectedCredAction(choiceId);

    if (choiceId === 'reset_password') {
      setCredError(null);
      sounds.playSuccess();

      const isCorrect = true;
      const scoreAwarded = Math.round(60 + (foundIds.length / totalSuspiciousCount) * 40);
      const bonusAwarded = foundIds.length === totalSuspiciousCount ? (question.bonusPoints || 20) : 0;

      onSubmitAnswer({
        action: 'escaped_mfa_labyrinth',
        step1_denied: true,
        step2_reported: true,
        step3_password_reset: true,
        foundIds,
        foundCount: foundIds.length,
        isCorrect,
        scoreAwarded,
        bonusAwarded
      });
    } else if (choiceId === 'keep_password') {
      sounds.playWarning();
      setCredError('Keeping the same password allows the attacker to continue attempting logins whenever they wish.');
    } else if (choiceId === 'reinstall_app') {
      sounds.playWarning();
      setCredError('Reinstalling the app resets your local 2FA tokens but does NOT revoke the compromised corporate password.');
    }
  };

  const isFatigueFound = foundIds.includes('suspicious_fatigue');
  const isLocationFound = foundIds.includes('suspicious_location');
  const isDeviceFound = foundIds.includes('suspicious_device');

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <BellRing className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Your phone begins buzzing with repeated authenticator sign-in requests from a foreign location while you are away from your computer. Handle the alert storm safely.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Puzzle Metaphor: "Navigating the Labyrinth" — Safely resolve the sign-in barrage and protect your corporate credentials without falling into the trap.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(foundIds.length > 0 || currentStep !== 'alert') && !submitted && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Labyrinth</span>
            </button>
          )}

          {/* Counter Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Suspicious Clues Found:</span>
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

      {/* Neutral Phase Tracker (NO Answer Spoilers) */}
      <div className="max-w-xl mx-auto grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
          currentStep === 'alert'
            ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
            : currentStep === 'compromised'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <span>Phase 1: Alert Handling</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
          currentStep === 'triage'
            ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
            : currentStep === 'credentials'
            ? 'bg-slate-900 border-slate-800 text-slate-400'
            : 'bg-slate-950/60 border-slate-800/60 text-slate-500'
        }`}>
          <span>Phase 2: Incident Triage</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
          currentStep === 'credentials'
            ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
            : 'bg-slate-950/60 border-slate-800/60 text-slate-500'
        }`}>
          <span>Phase 3: Credential Defense</span>
        </div>
      </div>

      {/* Trap Failure Modal: "Account Compromised" if user tapped Approve */}
      {currentStep === 'compromised' && (
        <div className="max-w-md mx-auto rounded-3xl bg-rose-950/80 border-2 border-rose-500 p-6 shadow-2xl space-y-4 animate-shake">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-200">Account Compromised!</h3>
              <p className="text-xs text-rose-300">Prompt fatigue trap triggered</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 text-xs text-slate-200 space-y-2 leading-relaxed">
            <p className="font-semibold text-rose-200">
              ⚠️ You tapped "Approve" on an unexpected prompt.
            </p>
            <p className="text-slate-300">
              The attacker in <strong>Frankfurt, Germany</strong> now has active access to your corporate account, email, and files. In MFA push bombing, attackers rely on users tapping "Approve" just to stop their phone from buzzing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearSelection}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (Follow the Escape Path)</span>
          </button>
        </div>
      )}

      {/* Screen 1: Smartphone Lock Screen Simulator with Notification Storm */}
      {currentStep === 'alert' && (
        <div className="max-w-md mx-auto rounded-[40px] bg-slate-950 border-[6px] border-slate-800 p-5 shadow-2xl relative overflow-hidden">
          {/* Lock Screen Status Header */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 pb-3 border-b border-slate-900">
            <span>2:14 PM</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-800" />
            </div>
            <span className="flex items-center gap-1 font-semibold text-slate-300">5G 📶 98%</span>
          </div>

          {/* Lock Screen Clock Display */}
          <div className="py-4 text-center select-none border-b border-slate-900 mb-3">
            <div className="text-3xl font-light text-slate-200 tracking-tight">2:14</div>
            <div className="text-xs text-slate-400 font-medium">Tuesday, October 6</div>
          </div>

          {/* Visual Warning Badge / Storm Notification Stack */}
          <div className="space-y-2.5 mb-4">
            {/* Rapid storm banner Hotspot */}
            <div
              onClick={() => handleElementClick('suspicious_fatigue', true)}
              className={`p-3 rounded-2xl cursor-pointer transition-colors border select-none ${
                isFatigueFound
                  ? 'bg-rose-950 text-rose-300 border-rose-500 font-bold'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200 hover:bg-rose-950/80'
              }`}
              title="Click to inspect this storm pattern"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-tight">MFA Alert Storm (5 in 2 mins)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200">
                  Alert 5 of 5
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Your phone is buzzing repeatedly with consecutive sign-in requests!
              </div>
            </div>

            {/* Authenticator Push Notification Card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-xl select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Identity Authenticator</div>
                    <div className="text-[10px] text-slate-400 font-mono">Sign-in Approval Request</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Just now</span>
              </div>

              {/* Impossible Travel & Tor Node Metadata Hotspots */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                <div
                  onClick={() => handleElementClick('suspicious_location', true)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${
                    isLocationFound
                      ? 'bg-rose-950 text-rose-300 border border-rose-500 font-bold'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                  title="Click to inspect location"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Location: <strong>Frankfurt, Germany</strong></span>
                </div>

                <div
                  onClick={() => handleElementClick('suspicious_device', true)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${
                    isDeviceFound
                      ? 'bg-rose-950 text-rose-300 border border-rose-500 font-bold'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                  title="Click to inspect device"
                >
                  <Laptop className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Device: <strong>Chrome / Linux (Tor Node)</strong></span>
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed">
                Someone entered your correct password from this remote device. Was this you?
              </div>

              {/* Phase 1 Decision: Completely UNIFORM Neutral Styling (NO Answer Giveaways) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={handleDenyStep}
                  className="py-3 px-3 rounded-xl font-medium text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Deny</span>
                </button>

                <button
                  type="button"
                  disabled={submitted}
                  onClick={handleApproveTrap}
                  className="py-3 px-3 rounded-xl font-medium text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-400" />
                  <span>Approve</span>
                </button>
              </div>
            </div>

            {/* Previous stacked notifications in the storm */}
            <div className="space-y-1.5 opacity-60">
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400">
                <span>Alert 4 • Sign-in request pending</span>
                <span>2:13 PM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-500">
                <span>Alert 3 • Sign-in request pending</span>
                <span>2:13 PM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Incident Triage (Uniform Neutral Options) */}
      {currentStep === 'triage' && (
        <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sign-in Request Handled</h3>
              <p className="text-xs text-slate-400">What is the required response protocol for unauthorized login storms?</p>
            </div>
          </div>

          {triageError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{triageError}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleTriageSubmit('report_it')}
              className={`w-full p-4 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedTriage === 'report_it'
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-slate-400" />
                <span className="text-xs">Report security incident to IT Security</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleTriageSubmit('silent')}
              className={`w-full p-4 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedTriage === 'silent'
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-xs">Put phone on silent and do nothing further</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleTriageSubmit('restart')}
              className={`w-full p-4 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedTriage === 'restart'
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span className="text-xs">Restart phone and wait to see if alerts stop</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Credential Defense (Uniform Neutral Options) */}
      {currentStep === 'credentials' && (
        <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Incident Reported to Security</h3>
              <p className="text-xs text-slate-400">Because the intruder successfully provided your credentials, how must you secure access?</p>
            </div>
          </div>

          {credError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{credError}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleCredentialSubmit('reset_password')}
              className={`w-full p-4 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedCredAction === 'reset_password'
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-slate-400" />
                <span className="text-xs">Reset corporate account password immediately</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleCredentialSubmit('keep_password')}
              className={`w-full p-4 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedCredAction === 'keep_password'
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-xs">Keep existing password since MFA successfully held</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              disabled={submitted}
              onClick={() => handleCredentialSubmit('reinstall_app')}
              className={`w-full p-4 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedCredAction === 'reinstall_app'
                  ? 'bg-slate-800 text-white border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span className="text-xs">Delete and reinstall the mobile authenticator app</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
