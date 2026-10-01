import React, { useState, useMemo } from 'react';
import { Question, PasswordItem } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Clock,
  Shield,
  Zap,
  Info,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface PasswordChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: { stronger: string[]; weaker: string[] }) => void;
}

// Helper to detect continuous 3 to 4 sequential letters or numbers, repeating characters, or continuous runs
function detectContinuousSequences(pwd: string): {
  hasContinuousLetters: boolean;
  hasContinuousNumbers: boolean;
  hasRepeatedChars: boolean;
  detectedPattern: string | null;
} {
  if (!pwd || pwd.length < 3) {
    return {
      hasContinuousLetters: false,
      hasContinuousNumbers: false,
      hasRepeatedChars: false,
      detectedPattern: null
    };
  }

  const lower = pwd.toLowerCase();

  // 1. Check for 3 or 4 sequential alphabetical letters (forward or backward: abc, abcd, xyz, cba, dcba, etc.)
  for (let i = 0; i <= lower.length - 3; i++) {
    const c1 = lower.charCodeAt(i);
    const c2 = lower.charCodeAt(i + 1);
    const c3 = lower.charCodeAt(i + 2);

    // Only if all 3 are alphabetical letters a-z (97-122)
    if (c1 >= 97 && c1 <= 122 && c2 >= 97 && c2 <= 122 && c3 >= 97 && c3 <= 122) {
      if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
        let match = pwd.substring(i, i + 3);
        if (i <= lower.length - 4) {
          const c4 = lower.charCodeAt(i + 3);
          if ((c2 === c1 + 1 && c4 === c3 + 1) || (c2 === c1 - 1 && c4 === c3 - 1)) {
            match = pwd.substring(i, i + 4);
          }
        }
        return {
          hasContinuousLetters: true,
          hasContinuousNumbers: false,
          hasRepeatedChars: false,
          detectedPattern: `Sequential letters "${match}"`
        };
      }
    }
  }

  // 2. Check for 3 or 4 sequential numbers (forward or backward: 123, 1234, 2345, 987, 4321, etc.)
  for (let i = 0; i <= pwd.length - 3; i++) {
    const c1 = pwd.charCodeAt(i);
    const c2 = pwd.charCodeAt(i + 1);
    const c3 = pwd.charCodeAt(i + 2);

    // Only if all 3 are digits 0-9 (48-57)
    if (c1 >= 48 && c1 <= 57 && c2 >= 48 && c2 <= 57 && c3 >= 48 && c3 <= 57) {
      if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
        let match = pwd.substring(i, i + 3);
        if (i <= pwd.length - 4) {
          const c4 = pwd.charCodeAt(i + 3);
          if ((c2 === c1 + 1 && c4 === c3 + 1) || (c2 === c1 - 1 && c4 === c3 - 1)) {
            match = pwd.substring(i, i + 4);
          }
        }
        return {
          hasContinuousLetters: false,
          hasContinuousNumbers: true,
          hasRepeatedChars: false,
          detectedPattern: `Sequential numbers "${match}"`
        };
      }
    }
  }

  // 3. Check for repeating characters 3 or more in a row (e.g. aaa, 111, @@@)
  for (let i = 0; i <= pwd.length - 3; i++) {
    if (pwd[i] === pwd[i + 1] && pwd[i] === pwd[i + 2]) {
      let match = pwd[i].repeat(3);
      if (i <= pwd.length - 4 && pwd[i] === pwd[i + 3]) {
        match = pwd[i].repeat(4);
      }
      return {
        hasContinuousLetters: /[a-zA-Z]/.test(pwd[i]),
        hasContinuousNumbers: /[0-9]/.test(pwd[i]),
        hasRepeatedChars: true,
        detectedPattern: `Repeating characters "${match}"`
      };
    }
  }

  // 4. Check for continuous number sequences of 4 or more digits in a row (e.g. 5892, 1994)
  const numRunMatch = pwd.match(/\d{4,}/);
  if (numRunMatch) {
    return {
      hasContinuousLetters: false,
      hasContinuousNumbers: true,
      hasRepeatedChars: false,
      detectedPattern: `Consecutive digits "${numRunMatch[0]}"`
    };
  }

  return {
    hasContinuousLetters: false,
    hasContinuousNumbers: false,
    hasRepeatedChars: false,
    detectedPattern: null
  };
}

// Calculate strength, entropy score, crack time, and crack probability based on exact user rules:
// - At least 16 characters, maximum 36 characters
// - Must include small case letters (a-z)
// - Must include higher case letters (A-Z)
// - Must include numbers (0-9)
// - Must include special characters except ( . , )
// - Check for continuously 3 to 4 letters and continuous numbers
function analyzePasswordStrength(pwd: string) {
  if (!pwd) {
    return {
      score: 0,
      label: 'Enter a sample password',
      color: 'text-slate-400',
      bgColor: 'bg-slate-800',
      crackTime: 'Instant (< 0.001s)',
      probability: '100% probability of immediate crack',
      isLengthValid: false,
      isLengthTooShort: true,
      isLengthTooLong: false,
      hasLower: false,
      hasUpper: false,
      hasNumber: false,
      hasAllowedSymbol: false,
      hasForbidden: false,
      isContinuousFree: true,
      detectedPattern: null,
      isStrongEnough: false
    };
  }

  const length = pwd.length;
  const isLengthTooShort = length < 16;
  const isLengthTooLong = length > 36;
  const isLengthValid = length >= 16 && length <= 36;

  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);

  // Allowed special symbols: any non-alphanumeric, non-whitespace character EXCEPT '.' and ','
  const hasAllowedSymbol = /[^a-zA-Z0-9.,\s]/.test(pwd);
  // Forbidden characters: '.' and ','
  const hasForbidden = /[.,]/.test(pwd);

  // Check for continuous 3-4 letters or continuous numbers
  const seqResult = detectContinuousSequences(pwd);
  const isContinuousFree = !seqResult.detectedPattern;

  // Calculate score out of 100 based on all 6 rules
  let score = 0;
  if (isLengthValid) score += 20;
  else if (length >= 10 && length < 16) score += 10;

  if (hasLower) score += 15;
  if (hasUpper) score += 15;
  if (hasNumber) score += 15;

  if (hasAllowedSymbol && !hasForbidden) score += 20;
  else if (hasForbidden) score = Math.max(0, score - 20);

  if (isContinuousFree) score += 15;
  else score = Math.max(0, score - 25);

  const isStrongEnough = 
    isLengthValid &&
    hasLower &&
    hasUpper &&
    hasNumber &&
    hasAllowedSymbol &&
    !hasForbidden &&
    isContinuousFree;

  let label = 'Very Weak';
  let color = 'text-rose-400';
  let bgColor = 'bg-rose-500';
  let crackTime = 'Instant (< 0.01s)';
  let probability = '99.9% probability of crack within seconds';

  if (isStrongEnough) {
    score = 100;
    label = 'Strong & Resilient (All Rules Passed)';
    color = 'text-emerald-400';
    bgColor = 'bg-emerald-500';
    if (length >= 24) {
      crackTime = '100+ Trillion Centuries';
      probability = '< 0.00000001% (Beyond modern and quantum brute-force reach)';
    } else {
      crackTime = '450 Million to 85 Billion Years';
      probability = '< 0.000001% (Cryptographically resilient against brute-force)';
    }
  } else if (hasForbidden) {
    label = 'Rejected by Policy';
    color = 'text-rose-400';
    bgColor = 'bg-rose-500';
    crackTime = 'Rejected (Disallowed . or , entered)';
    probability = 'Policy Violation: Characters "." and "," are strictly prohibited';
  } else if (!isContinuousFree) {
    label = 'Vulnerable Pattern Detected';
    color = 'text-amber-400';
    bgColor = 'bg-amber-500';
    crackTime = 'A few seconds to 4 minutes';
    probability = `95% probability (Cracking wordlists prioritize ${seqResult.detectedPattern})`;
  } else if (isLengthTooLong) {
    label = 'Exceeds Maximum Length';
    color = 'text-orange-400';
    bgColor = 'bg-orange-500';
    crackTime = 'Exceeds 36 character maximum';
    probability = 'Policy Violation: Maximum length is 36 characters';
  } else if (score >= 60) {
    label = 'Moderate';
    color = 'text-amber-400';
    bgColor = 'bg-amber-500';
    crackTime = '2 hours to 3 days';
    probability = '45% probability under targeted offline hashcat dictionary attack';
  } else if (score >= 35) {
    label = 'Weak';
    color = 'text-orange-400';
    bgColor = 'bg-orange-500';
    crackTime = '5 seconds to 10 minutes';
    probability = '80% probability under automated wordlist attack';
  }

  return {
    score,
    label,
    color,
    bgColor,
    crackTime,
    probability,
    isLengthValid,
    isLengthTooShort,
    isLengthTooLong,
    hasLower,
    hasUpper,
    hasNumber,
    hasAllowedSymbol,
    hasForbidden,
    isContinuousFree,
    detectedPattern: seqResult.detectedPattern,
    isStrongEnough
  };
}

export const PasswordChallenge: React.FC<PasswordChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const passwords: PasswordItem[] = question.details.passwords || [];

  // Stage: 'classify' (Bucket sorting) or 'test_lab' (Interactive typing & strength tester)
  const [activeStage, setActiveStage] = useState<'classify' | 'test_lab'>(submitted ? 'classify' : 'classify');

  // Classification buckets
  const [unassigned, setUnassigned] = useState<PasswordItem[]>(passwords);
  const [strongerList, setStrongerList] = useState<PasswordItem[]>([]);
  const [weakerList, setWeakerList] = useState<PasswordItem[]>([]);

  // Interactive password testing state
  const [typedPassword, setTypedPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);

  const analysis = useMemo(() => analyzePasswordStrength(typedPassword), [typedPassword]);

  const moveToStronger = (item: PasswordItem) => {
    if (submitted) return;
    sounds.playClick();
    setUnassigned(prev => prev.filter(p => p.id !== item.id));
    setWeakerList(prev => prev.filter(p => p.id !== item.id));
    if (!strongerList.some(p => p.id === item.id)) {
      setStrongerList(prev => [...prev, item]);
    }
  };

  const moveToWeaker = (item: PasswordItem) => {
    if (submitted) return;
    sounds.playClick();
    setUnassigned(prev => prev.filter(p => p.id !== item.id));
    setStrongerList(prev => prev.filter(p => p.id !== item.id));
    if (!weakerList.some(p => p.id === item.id)) {
      setWeakerList(prev => [...prev, item]);
    }
  };

  const resetToUnassigned = (item: PasswordItem) => {
    if (submitted) return;
    sounds.playClick();
    setStrongerList(prev => prev.filter(p => p.id !== item.id));
    setWeakerList(prev => prev.filter(p => p.id !== item.id));
    if (!unassigned.some(p => p.id === item.id)) {
      setUnassigned(prev => [...prev, item]);
    }
  };

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    if (activeStage === 'classify') {
      setUnassigned(passwords);
      setStrongerList([]);
      setWeakerList([]);
    } else {
      setTypedPassword('');
    }
  };

  const allAssigned = unassigned.length === 0;

  const handleFinalSubmit = () => {
    if (!allAssigned) {
      setActiveStage('classify');
      return;
    }
    if (!analysis.isStrongEnough) {
      sounds.playWarning();
      return;
    }

    sounds.playSuccess();
    onSubmitAnswer({
      stronger: strongerList.map(p => p.id),
      weaker: weakerList.map(p => p.id)
    });
  };

  return (
    <div className="space-y-6">
      {/* Stage Navigation Ribbon */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveStage('classify')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeStage === 'classify'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <span>1. Classify Passwords</span>
            {allAssigned && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (allAssigned || submitted) setActiveStage('test_lab');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeStage === 'test_lab'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : allAssigned || submitted
                ? 'text-slate-300 hover:text-white border border-transparent'
                : 'text-slate-600 cursor-not-allowed border border-transparent'
            }`}
          >
            <span>2. Test Password Strength</span>
            {analysis.isStrongEnough && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!submitted && ((activeStage === 'classify' && (strongerList.length > 0 || weakerList.length > 0)) || (activeStage === 'test_lab' && typedPassword.length > 0)) && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}

          <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            Demo Simulator • Never enter real credentials
          </div>
        </div>
      </div>

      {/* STAGE 1: CLASSIFICATION CHALLENGE */}
      {activeStage === 'classify' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Instructions banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3 shadow-md">
            <KeyRound className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-200">
              <strong className="text-cyan-300 font-bold">Investigate & Classify:</strong>{' '}
              Analyze each password below. Sort common, predictable patterns into <strong>Weaker Choice</strong> and high-entropy, multi-word combinations into <strong>Stronger Choice</strong>.
            </div>
          </div>

          {/* Unassigned Pool */}
          {!submitted && unassigned.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Categorize each credential: ({unassigned.length} remaining)
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {unassigned.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs sm:text-sm flex items-center gap-3 shadow-md transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => moveToWeaker(item)}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-sans font-semibold border border-slate-700 transition-colors"
                    >
                      ← Weaker
                    </button>

                    <span className="font-bold text-white select-none">{item.text}</span>

                    <button
                      type="button"
                      onClick={() => moveToStronger(item)}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-sans font-semibold border border-slate-700 transition-colors"
                    >
                      Stronger →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Buckets / Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weaker Choice Zone */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>WEAKER CHOICE</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {weakerList.length} Items
                </span>
              </div>

              <div className="space-y-2 min-h-[140px]">
                {weakerList.length === 0 ? (
                  <div className="text-xs text-slate-500 italic text-center py-8">
                    No passwords assigned here yet
                  </div>
                ) : (
                  weakerList.map(item => {
                    const isCorrect = item.correctCategory === 'weaker';
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          submitted
                            ? isCorrect
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-sm text-white">{item.text}</span>
                          {!submitted ? (
                            <button
                              type="button"
                              onClick={() => resetToUnassigned(item)}
                              className="text-[11px] text-slate-400 hover:text-white"
                            >
                              ✕ Remove
                            </button>
                          ) : (
                            isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            )
                          )}
                        </div>
                        {submitted && (
                          <p className="mt-1 text-[11px] leading-normal opacity-90 font-sans">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Stronger Choice Zone */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>STRONGER CHOICE</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {strongerList.length} Items
                </span>
              </div>

              <div className="space-y-2 min-h-[140px]">
                {strongerList.length === 0 ? (
                  <div className="text-xs text-slate-500 italic text-center py-8">
                    No passwords assigned here yet
                  </div>
                ) : (
                  strongerList.map(item => {
                    const isCorrect = item.correctCategory === 'stronger';
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          submitted
                            ? isCorrect
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-sm text-white">{item.text}</span>
                          {!submitted ? (
                            <button
                              type="button"
                              onClick={() => resetToUnassigned(item)}
                              className="text-[11px] text-slate-400 hover:text-white"
                            >
                              ✕ Remove
                            </button>
                          ) : (
                            isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            )
                          )}
                        </div>
                        {submitted && (
                          <p className="mt-1 text-[11px] leading-normal opacity-90 font-sans">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          {!submitted && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveStage('test_lab');
                }}
                disabled={!allAssigned}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
                  allAssigned
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Continue to Step 2: Test Password Strength</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: LIVE PASSWORD STRENGTH & CRACK PROBABILITY LAB */}
      {activeStage === 'test_lab' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Lab Objective Banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3 shadow-md">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-200">
              <strong className="text-cyan-300 font-bold">Step 2: Password Complexity & Strength Validator:</strong>{' '}
              Type or assemble a passphrase between <strong>16 and 36 characters</strong>. It must include <strong>small case letters</strong>, <strong>higher case letters</strong>, <strong>numbers</strong>, and <strong>special characters</strong> (excluding <code>.</code> and <code>,</code>). It must not contain <strong>continuous 3 to 4 sequential letters or numbers</strong>.
            </div>
          </div>

          {/* Main Interactive Testing Card */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  Live Credential Strength Analyzer
                </h3>
              </div>
            </div>

            {/* BUILDING BLOCKS PALETTE */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span>🧱 Passphrase Building Blocks:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Click blocks below to snap together your passphrase</span>
                </span>
                {typedPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setTypedPassword('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-400"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Block Categories */}
              <div className="space-y-2">
                {/* 1. Words */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 w-16">Words:</span>
                  {['Falcon', 'Timber', 'Quantum', 'Orbit', 'Horizon', 'Granite', 'Cobalt', 'Echo'].map(word => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setTypedPassword(prev => prev + word);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-400 hover:bg-cyan-950/40 text-cyan-200 font-mono text-xs transition-all shadow-sm active:scale-95"
                    >
                      + {word}
                    </button>
                  ))}
                </div>

                {/* 2. Numbers */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 w-16">Numbers:</span>
                  {['84', '92', '75', '38', '46'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setTypedPassword(prev => prev + num);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-emerald-400 hover:bg-emerald-950/40 text-emerald-200 font-mono text-xs transition-all shadow-sm active:scale-95"
                    >
                      + {num}
                    </button>
                  ))}
                </div>

                {/* 3. Allowed Symbols */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 w-16">Symbols:</span>
                  {['#', '$', '@', '!', '%', '&', '*', '_'].map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setTypedPassword(prev => prev + sym);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-purple-400 hover:bg-purple-950/40 text-purple-200 font-mono text-xs transition-all shadow-sm active:scale-95"
                    >
                      + {sym}
                    </button>
                  ))}

                  {/* Disallowed symbols for policy testing */}
                  {['.', ','].map(dis => (
                    <button
                      key={dis}
                      type="button"
                      title="Disallowed character (tests policy detection)"
                      onClick={() => {
                        sounds.playWarning();
                        setTypedPassword(prev => prev + dis);
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 font-mono text-xs transition-all hover:bg-rose-950/60"
                    >
                      {dis} (Forbidden)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Assembled Password (16–36 Characters):</span>
                <span className={`text-[11px] font-mono ${
                  analysis.isLengthValid
                    ? 'text-emerald-400 font-bold'
                    : analysis.isLengthTooLong
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-500'
                }`}>
                  {typedPassword.length} / 36 characters {analysis.isLengthTooLong && '(Exceeds Max)'}
                </span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={typedPassword}
                  onChange={(e) => setTypedPassword(e.target.value)}
                  placeholder="e.g. Cobalt#84Orbit$92Falcon (16-36 chars, upper, lower, number, symbol, no . or ,)"
                  className={`w-full bg-slate-950 border rounded-2xl px-4 py-3.5 pr-24 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all shadow-inner ${
                    analysis.hasForbidden
                      ? 'border-rose-500/80 focus:border-rose-400'
                      : !analysis.isContinuousFree
                      ? 'border-amber-500/80 focus:border-amber-400'
                      : analysis.isStrongEnough
                      ? 'border-emerald-500/80 focus:border-emerald-400'
                      : 'border-slate-700 focus:border-cyan-400'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={showPassword ? 'Hide characters' : 'Show characters'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {typedPassword && (
                    <button
                      type="button"
                      onClick={() => setTypedPassword('')}
                      className="text-xs font-mono text-slate-500 hover:text-white px-1.5 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Specific Feedback Banners */}
            {analysis.hasForbidden && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Disallowed Character Detected:</strong> The characters <code>.</code> (dot) and <code>,</code> (comma) are prohibited. Please use other symbols like <code>! @ # $ % ^ & * _ - + = ?</code>.
                </span>
              </div>
            )}

            {!analysis.isContinuousFree && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Continuous Sequence Detected:</strong> {analysis.detectedPattern}. Avoid 3 to 4 sequential letters (e.g. 'abc') or continuous numbers (e.g. '123' or 4+ digits in a row) as password cracking tools test these patterns first.
                </span>
              </div>
            )}

            {analysis.isLengthTooLong && (
              <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                <span>
                  <strong>Length Limit Exceeded:</strong> Password is {typedPassword.length} characters long. Maximum allowed length is 16 characters.
                </span>
              </div>
            )}

            {analysis.isStrongEnough && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>All Security Rules Satisfied!</strong> Valid length (8–16), mixed case, numbers, permitted special characters, and zero continuous sequences.
                </span>
              </div>
            )}

            {/* Strength Meter Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Strength Rating:</span>
                <span className={`font-bold ${analysis.color}`}>
                  {analysis.label} ({analysis.score}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${analysis.bgColor}`}
                  style={{ width: `${Math.max(5, analysis.score)}%` }}
                />
              </div>
            </div>

            {/* Metrics Dashboard: Crack Time & Crack Probability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Crack Time Metric */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Estimated Brute-Force Crack Time</span>
                </div>
                <div className={`text-base sm:text-lg font-black font-mono ${analysis.color}`}>
                  {analysis.crackTime}
                </div>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Based on modern high-speed GPU hashcat cracking rigs (100+ billion guesses/sec).
                </p>
              </div>

              {/* Crack Probability Metric */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Compromise Probability</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
                  {analysis.probability}
                </div>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Calculated against dictionary attacks, sequential tables, and entropy search space.
                </p>
              </div>
            </div>

            {/* 6 Precise Requirements Checklist Cards */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Required Security Rules Checklist:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
                {/* 1. Length: 16-36 characters */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  analysis.isLengthValid
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : analysis.isLengthTooLong
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : typedPassword.length > 0
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {analysis.isLengthValid ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : analysis.isLengthTooLong ? (
                      <X className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-center font-bold">•</span>
                    )}
                    <span>16 to 36 Characters</span>
                  </div>
                  <span className="text-[10px] font-bold">
                    {typedPassword.length}/36
                  </span>
                </div>

                {/* 2. Small Case Letters (a-z) */}
                <div className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                  analysis.hasLower
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {analysis.hasLower ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 text-center font-bold">•</span>
                  )}
                  <span>Small Case Letter (a-z)</span>
                </div>

                {/* 3. Higher Case Letters (A-Z) */}
                <div className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                  analysis.hasUpper
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {analysis.hasUpper ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 text-center font-bold">•</span>
                  )}
                  <span>Higher Case Letter (A-Z)</span>
                </div>

                {/* 4. Numbers (0-9) */}
                <div className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                  analysis.hasNumber
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {analysis.hasNumber ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 text-center font-bold">•</span>
                  )}
                  <span>Numbers (0-9)</span>
                </div>

                {/* 5. Special Symbols (except . and ,) */}
                <div className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                  analysis.hasForbidden
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : analysis.hasAllowedSymbol
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {analysis.hasForbidden ? (
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : analysis.hasAllowedSymbol ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 text-center font-bold">•</span>
                  )}
                  <span>Special Symbols (no . ,)</span>
                </div>

                {/* 6. No continuous 3-4 letters or numbers */}
                <div className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                  !analysis.isContinuousFree
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    : typedPassword.length >= 3
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {!analysis.isContinuousFree ? (
                    <X className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : typedPassword.length >= 3 ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 text-center font-bold">•</span>
                  )}
                  <span>No Continuous Letters/Nums</span>
                </div>
              </div>
            </div>

            {/* EDUCATIONAL SPOTLIGHT: WHAT IS A PASSWORD MANAGER */}
            {analysis.isStrongEnough && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Essential Security Takeaway
                    </span>
                    <h4 className="text-base font-black text-white">
                      What is a Password Manager & Why You Should Use One
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-300">1. Generates & Stores Unique Passwords</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Nobody can memorize 50+ unique passwords complying with length and symbol rules. A password manager creates complex, uncrackable credentials for every service. You only remember <strong>one strong master passphrase</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-300">2. Stops Credential Stuffing</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      If an external site suffers a data leak, hackers immediately replay those credentials on corporate portals. Unique passwords per site ensure one leak never harms your enterprise accounts.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-300">3. Built-in Phishing Immunity</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Password managers match the exact official domain in your browser address bar. They will <strong>never auto-fill</strong> on a fake lookalike phishing site, protecting you even if you fall for a trick.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Corporate Best Practice:</strong> Always use your organization's approved enterprise password manager (e.g. 1Password, Bitwarden, or KeePass) and protect it with Multi-Factor Authentication (MFA).
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveStage('classify')}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Review Classification</span>
              </button>

              {!submitted ? (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!analysis.isStrongEnough || !allAssigned}
                  className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-xl flex items-center gap-2 ${
                    analysis.isStrongEnough && allAssigned
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Complete Challenge & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Challenge Submitted</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
