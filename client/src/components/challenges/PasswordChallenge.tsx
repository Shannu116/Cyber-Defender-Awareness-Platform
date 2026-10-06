import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Lock,
  Clock,
  Zap,
  Check,
  X,
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  Award,
  Plus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Dices,
  Hand
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface PasswordChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA SETS FOR PASSWORD MODE & PASSPHRASE MODE
// ─────────────────────────────────────────────────────────────────────────────

// PASSWORD MODE (4 CONCENTRIC CIRCLES):
// Circle 1: Higher Case (Uppercase Letters)
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
// Circle 2: Small Case (Lowercase Letters)
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'.split('');
// Circle 3: Numbers
const NUMBER_CHARS = '0123456789'.split('');
// Circle 4: Special Characters
const SYMBOL_CHARS = '!@#$%^&*_-+=?'.split('');

// PASSPHRASE MODE (3 CONCENTRIC CIRCLES):
// Circle 1: Words (High-contrast everyday nouns)
const PASSPHRASE_WORDS = [
  'Breeze', 'Tiger', 'Mountain', 'Coffee', 'Silver', 'Galaxy', 
  'Window', 'River', 'Falcon', 'Ocean', 'Planet', 'Forest'
];
// Circle 2: Numbers
const PASSPHRASE_NUMBERS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '42', '77', '99', '2026'
];
// Circle 3: Special Characters
const PASSPHRASE_SYMBOLS = [
  '-', '!', '#', '$', '@', '_', '*', '&', '%', '+', '~', '?'
];

export const PasswordChallenge: React.FC<PasswordChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral, registerChecklist, clearChecklist } = useEcho();

  // Mode Selection: null (initial prompt screen) | 'password' | 'passphrase'
  const [selectedMode, setSelectedMode] = useState<'password' | 'passphrase' | null>(null);

  // SVG Ref for drag-to-rotate calculation
  const svgRef = useRef<SVGSVGElement | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: PASSWORD MODE (4 CONCENTRIC CIRCLES)
  // ───────────────────────────────────────────────────────────────────────────
  const [passwordString, setPasswordString] = useState<string>('');
  
  // Indices of aligned character (at 12 o'clock sight-line)
  const [passRing1Index, setPassRing1Index] = useState(0); // Higher Case
  const [passRing2Index, setPassRing2Index] = useState(0); // Small Case
  const [passRing3Index, setPassRing3Index] = useState(0); // Numbers
  const [passRing4Index, setPassRing4Index] = useState(0); // Special Chars

  // Rotation angles in degrees for each circle
  const [passRing1Angle, setPassRing1Angle] = useState(0);
  const [passRing2Angle, setPassRing2Angle] = useState(0);
  const [passRing3Angle, setPassRing3Angle] = useState(0);
  const [passRing4Angle, setPassRing4Angle] = useState(0);

  // Which circle is actively selected in the Middle Region (1=Upper, 2=Lower, 3=Num, 4=Special)
  const [activePasswordRing, setActivePasswordRing] = useState<1 | 2 | 3 | 4>(1);

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: PASSPHRASE MODE (3 CONCENTRIC CIRCLES + CUSTOM USER WORDS)
  // ───────────────────────────────────────────────────────────────────────────
  const [passphraseTokens, setPassphraseTokens] = useState<string[]>([]);
  const [customWordInput, setCustomWordInput] = useState<string>('');

  // Indices of aligned items
  const [ppRing1Index, setPpRing1Index] = useState(0); // Words
  const [ppRing2Index, setPpRing2Index] = useState(0); // Numbers
  const [ppRing3Index, setPpRing3Index] = useState(0); // Special Chars

  // Rotation angles for passphrase circles
  const [ppRing1Angle, setPpRing1Angle] = useState(0);
  const [ppRing2Angle, setPpRing2Angle] = useState(0);
  const [ppRing3Angle, setPpRing3Angle] = useState(0);

  // Active ring in Middle Region for passphrase (1=Words, 2=Numbers, 3=Special)
  const [activePassphraseRing, setActivePassphraseRing] = useState<1 | 2 | 3>(1);

  // ───────────────────────────────────────────────────────────────────────────
  // DRAG-TO-ROTATE STATE
  // ───────────────────────────────────────────────────────────────────────────
  const [draggingRing, setDraggingRing] = useState<number | null>(null);
  const dragStartAngle = useRef<number>(0);
  const dragStartRingAngle = useRef<number>(0);

  // ───────────────────────────────────────────────────────────────────────────
  // EVALUATION & BRUTE FORCE TESTING STATE
  // ───────────────────────────────────────────────────────────────────────────
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    isSecure: boolean;
    crackTime: string;
    message: string;
    issues?: string[];
  } | null>(null);

  // Register Echo checklist on mount
  useEffect(() => {
    registerChecklist([
      {
        id: 'length_check',
        label: 'Minimum 12–16 characters (Length over complexity)',
        hint: 'NIST SP 800-63B emphasizes that length gives exponential security. Build at least 12 characters (Password) or 3–4 tokens (Passphrase).',
        severity: 'high',
      },
      {
        id: 'entropy_check',
        label: 'High Entropy & Diversity',
        hint: 'Rotate circles to include multiple character classes or distinct words. Avoid simple sequential patterns like "1234".',
        severity: 'critical',
      },
      {
        id: 'brute_force_verified',
        label: 'Simulated brute-force attack check',
        hint: 'Click "Finalize & Check" to test your combination against automated cracking engines.',
        severity: 'high',
      },
    ]);
    return () => clearChecklist();
  }, [registerChecklist, clearChecklist]);

  // Current built output string
  const currentOutput = useMemo(() => {
    if (selectedMode === 'password') {
      return passwordString;
    }
    return passphraseTokens.join('');
  }, [selectedMode, passwordString, passphraseTokens]);

  const charLength = currentOutput.length;

  // Real-time compliance metrics
  const metrics = useMemo(() => {
    const hasUpper = /[A-Z]/.test(currentOutput);
    const hasLower = /[a-z]/.test(currentOutput);
    const hasNumber = /[0-9]/.test(currentOutput);
    const hasSymbol = /[!@#$%^&*_\-+=$?]/.test(currentOutput);

    const lengthOk = selectedMode === 'password' ? charLength >= 12 : charLength >= 14;
    const entropyOk = selectedMode === 'password'
      ? (hasUpper && hasLower && hasNumber && hasSymbol)
      : (passphraseTokens.length >= 3);

    return {
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
      lengthOk,
      entropyOk,
      tokenCount: passphraseTokens.length
    };
  }, [currentOutput, selectedMode, charLength, passphraseTokens.length]);

  // ───────────────────────────────────────────────────────────────────────────
  // MANUAL ROTATION HELPERS
  // ───────────────────────────────────────────────────────────────────────────
  
  // Rotate Password Mode Circle manually by offset (+1 / -1)
  const rotatePasswordRing = (ringId: 1 | 2 | 3 | 4, dir: 1 | -1) => {
    if (submitted) return;
    sounds.playClick();
    setActivePasswordRing(ringId);
    setTestResult(null);

    if (ringId === 1) {
      const total = UPPERCASE_CHARS.length;
      const step = 360 / total;
      const nextIdx = (passRing1Index + dir + total) % total;
      setPassRing1Index(nextIdx);
      setPassRing1Angle(-nextIdx * step);
    } else if (ringId === 2) {
      const total = LOWERCASE_CHARS.length;
      const step = 360 / total;
      const nextIdx = (passRing2Index + dir + total) % total;
      setPassRing2Index(nextIdx);
      setPassRing2Angle(-nextIdx * step);
    } else if (ringId === 3) {
      const total = NUMBER_CHARS.length;
      const step = 360 / total;
      const nextIdx = (passRing3Index + dir + total) % total;
      setPassRing3Index(nextIdx);
      setPassRing3Angle(-nextIdx * step);
    } else {
      const total = SYMBOL_CHARS.length;
      const step = 360 / total;
      const nextIdx = (passRing4Index + dir + total) % total;
      setPassRing4Index(nextIdx);
      setPassRing4Angle(-nextIdx * step);
    }
  };

  // Rotate Passphrase Mode Circle manually by offset (+1 / -1)
  const rotatePassphraseRing = (ringId: 1 | 2 | 3, dir: 1 | -1) => {
    if (submitted) return;
    sounds.playClick();
    setActivePassphraseRing(ringId);
    setTestResult(null);

    if (ringId === 1) {
      const total = PASSPHRASE_WORDS.length;
      const step = 360 / total;
      const nextIdx = (ppRing1Index + dir + total) % total;
      setPpRing1Index(nextIdx);
      setPpRing1Angle(-nextIdx * step);
    } else if (ringId === 2) {
      const total = PASSPHRASE_NUMBERS.length;
      const step = 360 / total;
      const nextIdx = (ppRing2Index + dir + total) % total;
      setPpRing2Index(nextIdx);
      setPpRing2Angle(-nextIdx * step);
    } else {
      const total = PASSPHRASE_SYMBOLS.length;
      const step = 360 / total;
      const nextIdx = (ppRing3Index + dir + total) % total;
      setPpRing3Index(nextIdx);
      setPpRing3Angle(-nextIdx * step);
    }
  };

  // Rotate circle directly to clicked character
  const setPasswordRingToChar = (ringId: 1 | 2 | 3 | 4, index: number) => {
    if (submitted) return;
    sounds.playClick();
    setActivePasswordRing(ringId);
    setTestResult(null);

    if (ringId === 1) {
      setPassRing1Index(index);
      setPassRing1Angle(-index * (360 / UPPERCASE_CHARS.length));
    } else if (ringId === 2) {
      setPassRing2Index(index);
      setPassRing2Angle(-index * (360 / LOWERCASE_CHARS.length));
    } else if (ringId === 3) {
      setPassRing3Index(index);
      setPassRing3Angle(-index * (360 / NUMBER_CHARS.length));
    } else {
      setPassRing4Index(index);
      setPassRing4Angle(-index * (360 / SYMBOL_CHARS.length));
    }
  };

  const setPassphraseRingToItem = (ringId: 1 | 2 | 3, index: number) => {
    if (submitted) return;
    sounds.playClick();
    setActivePassphraseRing(ringId);
    setTestResult(null);

    if (ringId === 1) {
      setPpRing1Index(index);
      setPpRing1Angle(-index * (360 / PASSPHRASE_WORDS.length));
    } else if (ringId === 2) {
      setPpRing2Index(index);
      setPpRing2Angle(-index * (360 / PASSPHRASE_NUMBERS.length));
    } else {
      setPpRing3Index(index);
      setPpRing3Angle(-index * (360 / PASSPHRASE_SYMBOLS.length));
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // DRAG-TO-ROTATE POINTER HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const handlePointerDown = (ringId: number, e: React.PointerEvent) => {
    if (submitted || !svgRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);

    dragStartAngle.current = angle;
    setDraggingRing(ringId);

    if (selectedMode === 'password') {
      setActivePasswordRing(ringId as 1 | 2 | 3 | 4);
      if (ringId === 1) dragStartRingAngle.current = passRing1Angle;
      else if (ringId === 2) dragStartRingAngle.current = passRing2Angle;
      else if (ringId === 3) dragStartRingAngle.current = passRing3Angle;
      else dragStartRingAngle.current = passRing4Angle;
    } else {
      setActivePassphraseRing(ringId as 1 | 2 | 3);
      if (ringId === 1) dragStartRingAngle.current = ppRing1Angle;
      else if (ringId === 2) dragStartRingAngle.current = ppRing2Angle;
      else dragStartRingAngle.current = ppRing3Angle;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingRing === null || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const delta = angle - dragStartAngle.current;
    const newAngle = dragStartRingAngle.current + delta;

    if (selectedMode === 'password') {
      if (draggingRing === 1) {
        setPassRing1Angle(newAngle);
        const total = UPPERCASE_CHARS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPassRing1Index(nearest);
      } else if (draggingRing === 2) {
        setPassRing2Angle(newAngle);
        const total = LOWERCASE_CHARS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPassRing2Index(nearest);
      } else if (draggingRing === 3) {
        setPassRing3Angle(newAngle);
        const total = NUMBER_CHARS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPassRing3Index(nearest);
      } else if (draggingRing === 4) {
        setPassRing4Angle(newAngle);
        const total = SYMBOL_CHARS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPassRing4Index(nearest);
      }
    } else {
      if (draggingRing === 1) {
        setPpRing1Angle(newAngle);
        const total = PASSPHRASE_WORDS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPpRing1Index(nearest);
      } else if (draggingRing === 2) {
        setPpRing2Angle(newAngle);
        const total = PASSPHRASE_NUMBERS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPpRing2Index(nearest);
      } else if (draggingRing === 3) {
        setPpRing3Angle(newAngle);
        const total = PASSPHRASE_SYMBOLS.length;
        const step = 360 / total;
        const nearest = (Math.round(-newAngle / step) % total + total) % total;
        setPpRing3Index(nearest);
      }
    }
  };

  const handlePointerUp = () => {
    if (draggingRing === null) return;
    sounds.playClick();

    // Snap cleanly to the nearest step
    if (selectedMode === 'password') {
      if (draggingRing === 1) setPassRing1Angle(-passRing1Index * (360 / UPPERCASE_CHARS.length));
      else if (draggingRing === 2) setPassRing2Angle(-passRing2Index * (360 / LOWERCASE_CHARS.length));
      else if (draggingRing === 3) setPassRing3Angle(-passRing3Index * (360 / NUMBER_CHARS.length));
      else setPassRing4Angle(-passRing4Index * (360 / SYMBOL_CHARS.length));
    } else {
      if (draggingRing === 1) setPpRing1Angle(-ppRing1Index * (360 / PASSPHRASE_WORDS.length));
      else if (draggingRing === 2) setPpRing2Angle(-ppRing2Index * (360 / PASSPHRASE_NUMBERS.length));
      else setPpRing3Angle(-ppRing3Index * (360 / PASSPHRASE_SYMBOLS.length));
    }

    setDraggingRing(null);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // ADD & EDIT ACTIONS
  // ───────────────────────────────────────────────────────────────────────────

  // Add currently selected character in Middle Region to Password
  const handleAddCurrentPasswordChar = (specificChar?: string) => {
    if (submitted) return;
    sounds.playClick();

    let toAdd = specificChar;
    if (!toAdd) {
      if (activePasswordRing === 1) toAdd = UPPERCASE_CHARS[passRing1Index];
      else if (activePasswordRing === 2) toAdd = LOWERCASE_CHARS[passRing2Index];
      else if (activePasswordRing === 3) toAdd = NUMBER_CHARS[passRing3Index];
      else toAdd = SYMBOL_CHARS[passRing4Index];
    }

    if (toAdd) {
      setPasswordString(prev => prev + toAdd);
      setTestResult(null);
    }
  };

  // Add currently selected token in Middle Region to Passphrase
  const handleAddCurrentPassphraseToken = (specificToken?: string) => {
    if (submitted) return;
    sounds.playClick();

    let toAdd = specificToken;
    if (!toAdd) {
      if (activePassphraseRing === 1) toAdd = PASSPHRASE_WORDS[ppRing1Index];
      else if (activePassphraseRing === 2) toAdd = PASSPHRASE_NUMBERS[ppRing2Index];
      else toAdd = PASSPHRASE_SYMBOLS[ppRing3Index];
    }

    if (toAdd) {
      setPassphraseTokens(prev => [...prev, toAdd]);
      setTestResult(null);
    }
  };

  // Add all 3 currently aligned components (Word + Symbol + Number) to Passphrase
  const handleAddCombinedPassphrase = () => {
    if (submitted) return;
    sounds.playClick();
    const word = PASSPHRASE_WORDS[ppRing1Index];
    const sym = PASSPHRASE_SYMBOLS[ppRing3Index];
    const num = PASSPHRASE_NUMBERS[ppRing2Index];
    setPassphraseTokens(prev => [...prev, word, sym, num]);
    setTestResult(null);
  };

  // Add all 4 currently aligned characters (Upper + Lower + Num + Symbol) to Password
  const handleAddCombinedPassword = () => {
    if (submitted) return;
    sounds.playClick();
    const upper = UPPERCASE_CHARS[passRing1Index];
    const lower = LOWERCASE_CHARS[passRing2Index];
    const num = NUMBER_CHARS[passRing3Index];
    const sym = SYMBOL_CHARS[passRing4Index];
    setPasswordString(prev => prev + upper + lower + num + sym);
    setTestResult(null);
  };

  // Add user's custom memorable word
  const handleAddCustomWord = () => {
    if (submitted) return;
    const cleanWord = customWordInput.trim().replace(/\s+/g, '');
    if (!cleanWord) return;

    sounds.playClick();
    setPassphraseTokens(prev => [...prev, cleanWord]);
    setCustomWordInput('');
    setTestResult(null);
    explainNeutral(
      `Added custom personal word "${cleanWord}". Personal memorable anchors combined with concentric ring separators produce unbreakable passphrases.`,
      'Custom Word Added'
    );
  };

  // Backspace / Clear
  const handleBackspace = () => {
    if (submitted) return;
    sounds.playClick();
    if (selectedMode === 'password') {
      setPasswordString(prev => prev.slice(0, -1));
    } else {
      setPassphraseTokens(prev => prev.slice(0, -1));
    }
    setTestResult(null);
  };

  const handleClearAll = () => {
    if (submitted) return;
    sounds.playClick();
    if (selectedMode === 'password') {
      setPasswordString('');
    } else {
      setPassphraseTokens([]);
    }
    setTestResult(null);
    setIsTesting(false);
  };

  const handleRemoveToken = (idxToRemove: number) => {
    if (submitted) return;
    sounds.playClick();
    setPassphraseTokens(prev => prev.filter((_, i) => i !== idxToRemove));
    setTestResult(null);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // FINALIZE & CHECK (EVALUATION & BRUTE FORCE SIMULATION)
  // ───────────────────────────────────────────────────────────────────────────
  const handleFinalizeAndCheck = () => {
    if (submitted || charLength === 0) return;
    sounds.playClick();
    setIsTesting(true);

    setTimeout(() => {
      setIsTesting(false);

      const hasSequential = /(012|123|234|345|456|567|678|789|890)/.test(currentOutput);
      const isTooShort = selectedMode === 'password' ? charLength < 12 : charLength < 14;

      if (isTooShort) {
        sounds.playWarning();
        setTestResult({
          tested: true,
          isSecure: false,
          crackTime: '0.04 Seconds',
          message: `Too short! String length is ${charLength} characters. Automated GPU clusters crack anything under 12 characters in fractions of a second. Rotate circles to add more length.`,
          issues: ['Minimum length 12 characters required', 'Vulnerable to dictionary brute-force']
        });
        explainThreat({
          id: 'short_password',
          title: 'Length Deficiency (< 12 Chars)',
          subtitle: 'Instant Automated Cracking',
          severity: 'high',
          explanation: 'Length is the primary source of cryptographic entropy. Automated cracking tools guess billions of hashes per second.',
          attackerObjective: 'Crack short passwords with rainbow tables in milliseconds.',
          proTip: 'Add more concentric wheel components to reach at least 12–16 characters.'
        });
        return;
      }

      if (hasSequential) {
        sounds.playWarning();
        setTestResult({
          tested: true,
          isSecure: false,
          crackTime: '3.8 Minutes',
          message: 'Predictable sequential pattern detected (like 123, 789)! Attackers program automated tools to prioritize sequential chains. Rotate to non-sequential items.',
          issues: ['Sequential pattern detected']
        });
        return;
      }

      // Successful verification
      sounds.playSuccess();
      const crackTime = selectedMode === 'password' ? '450+ Years' : '30,000+ Centuries';
      setTestResult({
        tested: true,
        isSecure: true,
        crackTime,
        message: selectedMode === 'password'
          ? 'Enterprise Password Policy Passed! Multi-class character diversity with 12+ characters creates a resilient defensive baseline.'
          : 'NIST SP 800-63B High-Entropy Passphrase Passed! Multi-word length with separators creates mathematically unbreakable security.'
      });
    }, 600);
  };

  // Submit Answer to quiz
  const handleConfirmSubmit = () => {
    if (submitted || !testResult?.isSecure) return;
    sounds.playClick();

    const isCorrect = true;
    const scoreAwarded = 100;
    const bonusAwarded = selectedMode === 'passphrase' ? 25 : 15;

    onSubmitAnswer({
      action: 'completed_akshara_chakram',
      mode: selectedMode,
      finalValue: currentOutput,
      charLength,
      crackTime: testResult.crackTime,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 1: ASK THE USER (PASSWORD OR PASSPHRASE CHOICE MODAL)
  // ───────────────────────────────────────────────────────────────────────────
  if (!selectedMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create Enterprise Authentication: Password or Passphrase?
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Industrial compliance standards (NIST SP 800-63B) offer two distinct paths. Which security format would you like to build using the interactive concentric rotating wheels?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 text-left">
            {/* Option 1: Password */}
            <div
              onClick={() => { sounds.playClick(); setSelectedMode('password'); }}
              className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-cyan-950/30"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:text-cyan-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                    4 Concentric Circles
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Traditional Password Mode
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rotate 4 concentric circles containing <strong>Special Characters</strong>, <strong>Numbers</strong>, <strong>Small Case Letters</strong>, and <strong>Higher Case Letters</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
                <span>Select Password Wheel</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Option 2: Passphrase (Recommended) */}
            <div
              onClick={() => { sounds.playClick(); setSelectedMode('passphrase'); }}
              className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-lg shadow-cyan-950/40"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    NIST Recommended
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                  Passphrase Mode
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Rotate 3 concentric circles containing <strong>Words</strong>, <strong>Numbers</strong>, and <strong>Special Characters</strong>, plus an option to include your own custom memorable words.
                </p>
              </div>

              <div className="pt-2 border-t border-cyan-900/60 flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
                <span>Select Passphrase Wheel</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: THE INTERACTIVE CONCENTRIC AKSHARA CHAKRAM WORKSPACE
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            {selectedMode === 'password' ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {selectedMode === 'password' ? 'Traditional Password Chakram (4 Concentric Circles)' : 'Enterprise Passphrase Chakram (3 Concentric Circles)'}
            </h3>
            <p className="text-xs text-slate-400">
              Drag or rotate circles manually to align characters with the center Selection Region.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={submitted}
          onClick={() => { sounds.playClick(); setSelectedMode(null); }}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Change Format (Password / Passphrase)</span>
        </button>
      </div>

      {/* Main Wheel Workspace (ENLARGED EXPANSIVE CONTAINER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Enlarged Concentric Rotating Wheels with Middle Selection Region */}
        <div className="lg:col-span-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center select-none relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-white font-bold text-sm">
                {selectedMode === 'password' ? '4 Concentric Circles (Higher, Small, Numbers, Symbols)' : '3 Concentric Circles (Words, Numbers, Symbols)'}
              </span>
            </div>
            <span className="text-slate-400 flex items-center gap-1.5 text-xs font-medium">
              <Hand className="w-4 h-4 text-cyan-400" />
              Drag circle to manually rotate
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ENLARGED CONCENTRIC SVG WHEEL (VIEWBOX 0 0 620 620, CENTER 310, 310)*/}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="relative w-full max-w-[620px] sm:max-w-[660px] aspect-square mx-auto flex items-center justify-center p-1 sm:p-2">
            <svg
              ref={svgRef}
              viewBox="0 0 620 620"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full drop-shadow-[0_16px_35px_rgba(0,0,0,0.9)] filter touch-none cursor-grab active:cursor-grabbing"
            >
              <defs>
                {/* Glow Filter */}
                <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Center Hub Selection Region Gradient */}
                <radialGradient id="centerHubGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#082f49" />
                  <stop offset="68%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
              </defs>

              {/* Outer Base Chassis Rim */}
              <circle cx="310" cy="310" r="304" fill="#020617" stroke="#1e293b" strokeWidth="7" />
              <circle cx="310" cy="310" r="300" fill="none" stroke="#334155" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Precision Degree Notches */}
              {[...Array(36)].map((_, idx) => {
                const angle = idx * 10;
                const rad = (angle * Math.PI) / 180;
                const x1 = 310 + 299 * Math.cos(rad);
                const y1 = 310 + 299 * Math.sin(rad);
                const x2 = 310 + 304 * Math.cos(rad);
                const y2 = 310 + 304 * Math.sin(rad);
                return (
                  <line
                    key={`dial-notch-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={idx % 9 === 0 ? '#38bdf8' : '#475569'}
                    strokeWidth={idx % 9 === 0 ? 2.5 : 1}
                  />
                );
              })}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* PASSWORD MODE: 4 CONCENTRIC CIRCLES                             */}
              {/* 1. Higher Case | 2. Small Case | 3. Numbers | 4. Special Chars   */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {selectedMode === 'password' && (
                <>
                  {/* CIRCLE 1: HIGHER CASE (UPPERCASE A–Z) */}
                  <g
                    transform={`rotate(${passRing1Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(1, e)}
                    style={{ transition: draggingRing === 1 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="272"
                      fill="none"
                      stroke={activePasswordRing === 1 ? '#0c264c' : '#061224'}
                      strokeWidth="50"
                    />
                    <circle cx="310" cy="310" r="297" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="310" cy="310" r="247" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />

                    {UPPERCASE_CHARS.map((char, i) => {
                      const angle = -90 + i * (360 / 26);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 272 * Math.cos(rad);
                      const y = 310 + 272 * Math.sin(rad);
                      const isAligned = i === passRing1Index;

                      return (
                        <g
                          key={`p-r1-${char}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPasswordRingToChar(1, i);
                          }}
                          className="cursor-pointer group"
                        >
                          {isAligned && (
                            <circle cx={x} cy={y} r="15" fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="2" filter="url(#neonGlow)" />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="14.5"
                            fontWeight="bold"
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#94a3b8"}
                            className="transition-colors group-hover:fill-cyan-300 select-none"
                          >
                            {char}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* CIRCLE 2: SMALL CASE (LOWERCASE a–z) */}
                  <g
                    transform={`rotate(${passRing2Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(2, e)}
                    style={{ transition: draggingRing === 2 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="220"
                      fill="none"
                      stroke={activePasswordRing === 2 ? '#0f2c57' : '#081730'}
                      strokeWidth="50"
                    />
                    <circle cx="310" cy="310" r="195" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />

                    {LOWERCASE_CHARS.map((char, i) => {
                      const angle = -90 + i * (360 / 26);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 220 * Math.cos(rad);
                      const y = 310 + 220 * Math.sin(rad);
                      const isAligned = i === passRing2Index;

                      return (
                        <g
                          key={`p-r2-${char}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPasswordRingToChar(2, i);
                          }}
                          className="cursor-pointer group"
                        >
                          {isAligned && (
                            <circle cx={x} cy={y} r="14" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2" filter="url(#neonGlow)" />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="13.5"
                            fontWeight="semibold"
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#cbd5e1"}
                            className="transition-colors group-hover:fill-sky-300 select-none"
                          >
                            {char}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* CIRCLE 3: NUMBERS (0–9) */}
                  <g
                    transform={`rotate(${passRing3Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(3, e)}
                    style={{ transition: draggingRing === 3 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="168"
                      fill="none"
                      stroke={activePasswordRing === 3 ? '#123769' : '#0b1d3d'}
                      strokeWidth="48"
                    />
                    <circle cx="310" cy="310" r="144" fill="none" stroke="#334155" strokeWidth="1.5" />

                    {NUMBER_CHARS.map((char, i) => {
                      const angle = -90 + i * (360 / 10);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 168 * Math.cos(rad);
                      const y = 310 + 168 * Math.sin(rad);
                      const isAligned = i === passRing3Index;

                      return (
                        <g
                          key={`p-r3-${char}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPasswordRingToChar(3, i);
                          }}
                          className="cursor-pointer group"
                        >
                          {isAligned && (
                            <circle cx={x} cy={y} r="15" fill="#06b6d4" fillOpacity="0.35" stroke="#22d3ee" strokeWidth="2" filter="url(#neonGlow)" />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="16"
                            fontWeight="black"
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#38bdf8"}
                            className="transition-colors group-hover:fill-white select-none"
                          >
                            {char}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* CIRCLE 4: SPECIAL CHARACTERS (!@#$%^&*_-+=?) */}
                  <g
                    transform={`rotate(${passRing4Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(4, e)}
                    style={{ transition: draggingRing === 4 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="118"
                      fill="none"
                      stroke={activePasswordRing === 4 ? '#2d2c4e' : '#171a2e'}
                      strokeWidth="46"
                    />
                    <circle cx="310" cy="310" r="95" fill="none" stroke="#06b6d4" strokeWidth="2" />

                    {SYMBOL_CHARS.map((char, i) => {
                      const angle = -90 + i * (360 / SYMBOL_CHARS.length);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 118 * Math.cos(rad);
                      const y = 310 + 118 * Math.sin(rad);
                      const isAligned = i === passRing4Index;

                      return (
                        <g
                          key={`p-r4-${char}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPasswordRingToChar(4, i);
                          }}
                          className="cursor-pointer group"
                        >
                          {isAligned && (
                            <circle cx={x} cy={y} r="14" fill="#f59e0b" fillOpacity="0.35" stroke="#fbbf24" strokeWidth="2" filter="url(#neonGlow)" />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="16"
                            fontWeight="black"
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#f59e0b"}
                            className="transition-colors group-hover:fill-amber-200 select-none"
                          >
                            {char}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* PASSPHRASE MODE: 3 CONCENTRIC CIRCLES (CLEAR BOLD VISIBLE WORDS) */}
              {/* 1. Words | 2. Numbers | 3. Special Characters                   */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {selectedMode === 'passphrase' && (
                <>
                  {/* CIRCLE 1: WORDS (HIGH-CONTRAST, OPEN TRACK, NO CLUNKY BADGES) */}
                  <g
                    transform={`rotate(${ppRing1Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(1, e)}
                    style={{ transition: draggingRing === 1 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="250"
                      fill="none"
                      stroke={activePassphraseRing === 1 ? '#0e2b4d' : '#07182c'}
                      strokeWidth="66"
                    />
                    <circle cx="310" cy="310" r="283" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="310" cy="310" r="217" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />

                    {PASSPHRASE_WORDS.map((word, i) => {
                      const angle = -90 + i * (360 / PASSPHRASE_WORDS.length);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 250 * Math.cos(rad);
                      const y = 310 + 250 * Math.sin(rad);
                      const isAligned = i === ppRing1Index;

                      const divAngle = -90 + (i + 0.5) * (360 / PASSPHRASE_WORDS.length);
                      const divRad = (divAngle * Math.PI) / 180;
                      const divX1 = 310 + 217 * Math.cos(divRad);
                      const divY1 = 310 + 217 * Math.sin(divRad);
                      const divX2 = 310 + 283 * Math.cos(divRad);
                      const divY2 = 310 + 283 * Math.sin(divRad);

                      return (
                        <g
                          key={`pp-r1-${word}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPassphraseRingToItem(1, i);
                          }}
                          className="cursor-pointer group"
                        >
                          <line x1={divX1} y1={divY1} x2={divX2} y2={divY2} stroke="#334155" strokeWidth="1.2" opacity="0.65" />

                          {/* Glowing Aligned Highlight Indicator */}
                          {isAligned && (
                            <g transform={`rotate(${angle + 90}, ${x}, ${y})`}>
                              <rect
                                x="-44"
                                y="-15"
                                width="88"
                                height="30"
                                rx="15"
                                fill="#06b6d4"
                                fillOpacity="0.35"
                                stroke="#22d3ee"
                                strokeWidth="2.2"
                                filter="url(#neonGlow)"
                              />
                            </g>
                          )}

                          {/* Crisp Bold Word (Directly on track, high contrast) */}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="14"
                            fontWeight={isAligned ? "black" : "bold"}
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#f1f5f9"}
                            className="transition-colors group-hover:fill-cyan-300 select-none drop-shadow"
                          >
                            {word}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* CIRCLE 2: NUMBERS */}
                  <g
                    transform={`rotate(${ppRing2Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(2, e)}
                    style={{ transition: draggingRing === 2 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="176"
                      fill="none"
                      stroke={activePassphraseRing === 2 ? '#0f315e' : '#081d3a'}
                      strokeWidth="56"
                    />
                    <circle cx="310" cy="310" r="204" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="310" cy="310" r="148" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />

                    {PASSPHRASE_NUMBERS.map((num, i) => {
                      const angle = -90 + i * (360 / PASSPHRASE_NUMBERS.length);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 176 * Math.cos(rad);
                      const y = 310 + 176 * Math.sin(rad);
                      const isAligned = i === ppRing2Index;

                      const divAngle = -90 + (i + 0.5) * (360 / PASSPHRASE_NUMBERS.length);
                      const divRad = (divAngle * Math.PI) / 180;
                      const divX1 = 310 + 148 * Math.cos(divRad);
                      const divY1 = 310 + 148 * Math.sin(divRad);
                      const divX2 = 310 + 204 * Math.cos(divRad);
                      const divY2 = 310 + 204 * Math.sin(divRad);

                      return (
                        <g
                          key={`pp-r2-${num}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPassphraseRingToItem(2, i);
                          }}
                          className="cursor-pointer group"
                        >
                          <line x1={divX1} y1={divY1} x2={divX2} y2={divY2} stroke="#334155" strokeWidth="1.2" opacity="0.65" />

                          {isAligned && (
                            <circle cx={x} cy={y} r="18" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="2" filter="url(#neonGlow)" />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="15.5"
                            fontWeight={isAligned ? "black" : "bold"}
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#38bdf8"}
                            className="transition-colors group-hover:fill-white select-none"
                          >
                            {num}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* CIRCLE 3: SPECIAL CHARACTERS */}
                  <g
                    transform={`rotate(${ppRing3Angle}, 310, 310)`}
                    onPointerDown={(e) => handlePointerDown(3, e)}
                    style={{ transition: draggingRing === 3 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)' }}
                  >
                    <circle
                      cx="310"
                      cy="310"
                      r="118"
                      fill="none"
                      stroke={activePassphraseRing === 3 ? '#2c2748' : '#15162a'}
                      strokeWidth="46"
                    />
                    <circle cx="310" cy="310" r="141" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="310" cy="310" r="95" fill="none" stroke="#06b6d4" strokeWidth="2" />

                    {PASSPHRASE_SYMBOLS.map((sym, i) => {
                      const angle = -90 + i * (360 / PASSPHRASE_SYMBOLS.length);
                      const rad = (angle * Math.PI) / 180;
                      const x = 310 + 118 * Math.cos(rad);
                      const y = 310 + 118 * Math.sin(rad);
                      const isAligned = i === ppRing3Index;

                      const divAngle = -90 + (i + 0.5) * (360 / PASSPHRASE_SYMBOLS.length);
                      const divRad = (divAngle * Math.PI) / 180;
                      const divX1 = 310 + 95 * Math.cos(divRad);
                      const divY1 = 310 + 95 * Math.sin(divRad);
                      const divX2 = 310 + 141 * Math.cos(divRad);
                      const divY2 = 310 + 141 * Math.sin(divRad);

                      return (
                        <g
                          key={`pp-r3-${sym}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPassphraseRingToItem(3, i);
                          }}
                          className="cursor-pointer group"
                        >
                          <line x1={divX1} y1={divY1} x2={divX2} y2={divY2} stroke="#334155" strokeWidth="1.2" opacity="0.65" />

                          {isAligned && (
                            <circle cx={x} cy={y} r="16" fill="#b45309" fillOpacity="0.4" stroke="#fbbf24" strokeWidth="2" filter="url(#neonGlow)" />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle + 90}, ${x}, ${y})`}
                            fontSize="17"
                            fontWeight={isAligned ? "black" : "bold"}
                            fontFamily="ui-monospace, monospace"
                            fill={isAligned ? "#ffffff" : "#fbbf24"}
                            className="transition-colors group-hover:fill-amber-200 select-none"
                          >
                            {sym}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* THE MIDDLE REGION: CLEAN CENTRAL SELECTION HUB                  */}
              {/* DISPLAYS ALIGNED ITEMS CLEANLY (NO CLUTTERED BOXES) + ADD ALL   */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {selectedMode === 'passphrase' ? (
                /* PASSPHRASE MODE SELECTION HUB: WORDS + SPECIAL CHARS + NUMBERS */
                <g>
                  {/* Background & Outer Rings */}
                  <circle cx="310" cy="310" r="88" fill="url(#centerHubGrad)" stroke="#06b6d4" strokeWidth="2.5" filter="url(#neonGlow)" />
                  <circle cx="310" cy="310" r="84" fill="#020617" fillOpacity="0.85" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" />

                  {/* Header Subtitle */}
                  <text x="310" y="250" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#38bdf8" letterSpacing="1.2">
                    SELECTION HUB
                  </text>

                  {/* 1. Aligned Word - Clean Typography (No Box) */}
                  <text
                    x="310"
                    y="278"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="black"
                    fontFamily="ui-sans-serif, system-ui, monospace"
                    fill="#ffffff"
                    className="drop-shadow-lg select-none"
                  >
                    {PASSPHRASE_WORDS[ppRing1Index]}
                  </text>

                  {/* 2. Aligned Symbol & Number - Clean Typography (No Box) */}
                  <text
                    x="310"
                    y="306"
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="black"
                    fontFamily="monospace"
                    className="drop-shadow-lg select-none"
                  >
                    <tspan fill="#fbbf24">{PASSPHRASE_SYMBOLS[ppRing3Index]}</tspan>
                    <tspan fill="#64748b" fontSize="16"> • </tspan>
                    <tspan fill="#38bdf8">{PASSPHRASE_NUMBERS[ppRing2Index]}</tspan>
                  </text>

                  {/* 3. Add Combined Button */}
                  <g
                    onClick={(e) => { e.stopPropagation(); handleAddCombinedPassphrase(); }}
                    className="cursor-pointer group/addall"
                  >
                    <rect x="242" y="327" width="136" height="28" rx="14" fill="#0891b2" className="group-hover/addall:fill-cyan-400 transition-colors shadow-lg" />
                    <text x="310" y="343" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="black" fontFamily="monospace" fill="#020617">
                      + ADD ALL 3
                    </text>
                  </g>
                </g>
              ) : (
                /* PASSWORD MODE SELECTION HUB: HIGHER + SMALL + NUMBERS + SPECIAL */
                <g>
                  {/* Background & Outer Rings */}
                  <circle cx="310" cy="310" r="88" fill="url(#centerHubGrad)" stroke="#06b6d4" strokeWidth="2.5" filter="url(#neonGlow)" />
                  <circle cx="310" cy="310" r="84" fill="#020617" fillOpacity="0.85" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" />

                  {/* Header Subtitle */}
                  <text x="310" y="250" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#38bdf8" letterSpacing="1.2">
                    SELECTION HUB
                  </text>

                  {/* Aligned 4 Characters - Clean Typography (No Box) */}
                  <text
                    x="310"
                    y="296"
                    textAnchor="middle"
                    fontSize="30"
                    fontWeight="black"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="4"
                    className="drop-shadow-xl select-none"
                  >
                    <tspan fill="#ffffff">{UPPERCASE_CHARS[passRing1Index]}</tspan>
                    <tspan fill="#e2e8f0">{LOWERCASE_CHARS[passRing2Index]}</tspan>
                    <tspan fill="#38bdf8">{NUMBER_CHARS[passRing3Index]}</tspan>
                    <tspan fill="#fbbf24">{SYMBOL_CHARS[passRing4Index]}</tspan>
                  </text>

                  {/* Add Combined Button */}
                  <g
                    onClick={(e) => { e.stopPropagation(); handleAddCombinedPassword(); }}
                    className="cursor-pointer group/addpass"
                  >
                    <rect x="242" y="327" width="136" height="28" rx="14" fill="#06b6d4" className="group-hover/addpass:fill-cyan-400 transition-colors shadow-lg" />
                    <text x="310" y="343" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="black" fontFamily="monospace" fill="#020617">
                      + ADD ALL 4
                    </text>
                  </g>
                </g>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* TOP SIGHT-LINE INDICATOR (12 O'CLOCK NEEDLE)                    */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <g pointerEvents="none">
                <line x1="310" y1="38" x2="310" y2="222" stroke="#06b6d4" strokeWidth="1.8" strokeDasharray="3 3" opacity="0.65" />
                <polygon points="310,38 300,10 320,10" fill="#06b6d4" stroke="#22d3ee" strokeWidth="2" filter="url(#neonGlow)" />
                <circle cx="310" cy="18" r="3.5" fill="#ffffff" />
                <text x="310" y="7" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  ▼ ALIGNMENT SIGHT-LINE (సూచిక) ▼
                </text>
              </g>
            </svg>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MIDDLE SELECTION REGION QUICK ACTION BAR                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 text-xs font-bold">Middle Selection Region Components:</span>
              <span className="text-cyan-400 text-[11px]">Click any component below to add</span>
            </div>

            {selectedMode === 'password' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Higher Case Card */}
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">1. Higher Case</span>
                    <span className="text-lg font-black text-white text-center py-1 bg-slate-950 rounded-xl border border-slate-800">
                      {UPPERCASE_CHARS[passRing1Index]}
                    </span>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPasswordChar(UPPERCASE_CHARS[passRing1Index])}
                      className="w-full py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Small Case Card */}
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">2. Small Case</span>
                    <span className="text-lg font-black text-white text-center py-1 bg-slate-950 rounded-xl border border-slate-800">
                      {LOWERCASE_CHARS[passRing2Index]}
                    </span>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPasswordChar(LOWERCASE_CHARS[passRing2Index])}
                      className="w-full py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Number Card */}
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">3. Number</span>
                    <span className="text-lg font-black text-cyan-300 text-center py-1 bg-slate-950 rounded-xl border border-slate-800">
                      {NUMBER_CHARS[passRing3Index]}
                    </span>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPasswordChar(NUMBER_CHARS[passRing3Index])}
                      className="w-full py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Special Card */}
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">4. Special</span>
                    <span className="text-lg font-black text-amber-300 text-center py-1 bg-slate-950 rounded-xl border border-slate-800">
                      {SYMBOL_CHARS[passRing4Index]}
                    </span>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPasswordChar(SYMBOL_CHARS[passRing4Index])}
                      className="w-full py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Combined Add Button */}
                <button
                  type="button"
                  disabled={submitted}
                  onClick={handleAddCombinedPassword}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add All 4 Aligned Characters ({UPPERCASE_CHARS[passRing1Index]}{LOWERCASE_CHARS[passRing2Index]}{NUMBER_CHARS[passRing3Index]}{SYMBOL_CHARS[passRing4Index]})
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Card 1: Aligned Word */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">1. Aligned Word</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold">Circle 1</span>
                    </div>
                    <div className="text-base font-black text-white truncate text-center py-1 bg-slate-950 rounded-xl border border-slate-800/80">
                      {PASSPHRASE_WORDS[ppRing1Index]}
                    </div>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPassphraseToken(PASSPHRASE_WORDS[ppRing1Index])}
                      className="w-full py-1.5 px-2 rounded-xl bg-cyan-700/60 hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Word</span>
                    </button>
                  </div>

                  {/* Card 2: Aligned Number */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">2. Aligned Number</span>
                      <span className="text-[10px] font-mono text-sky-400 font-semibold">Circle 2</span>
                    </div>
                    <div className="text-base font-black text-sky-300 text-center py-1 bg-slate-950 rounded-xl border border-slate-800/80">
                      {PASSPHRASE_NUMBERS[ppRing2Index]}
                    </div>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPassphraseToken(PASSPHRASE_NUMBERS[ppRing2Index])}
                      className="w-full py-1.5 px-2 rounded-xl bg-sky-700/60 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Number</span>
                    </button>
                  </div>

                  {/* Card 3: Aligned Special Character */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">3. Aligned Symbol</span>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">Circle 3</span>
                    </div>
                    <div className="text-base font-black text-amber-300 text-center py-1 bg-slate-950 rounded-xl border border-slate-800/80">
                      {PASSPHRASE_SYMBOLS[ppRing3Index]}
                    </div>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => handleAddCurrentPassphraseToken(PASSPHRASE_SYMBOLS[ppRing3Index])}
                      className="w-full py-1.5 px-2 rounded-xl bg-amber-700/60 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Symbol</span>
                    </button>
                  </div>
                </div>

                {/* Combined Add Button */}
                <button
                  type="button"
                  disabled={submitted}
                  onClick={handleAddCombinedPassphrase}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add All 3 Components to Passphrase ({PASSPHRASE_WORDS[ppRing1Index]}{PASSPHRASE_SYMBOLS[ppRing3Index]}{PASSPHRASE_NUMBERS[ppRing2Index]})
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* MANUAL ROTATE BUTTONS FOR EACH CIRCLE                               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Manual Stepper Controls (Rotate Each Circle):
            </span>

            {selectedMode === 'password' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {/* Circle 1 Controls */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Higher:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(1, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                      title="Rotate counter-clockwise"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-white w-5 text-center">{UPPERCASE_CHARS[passRing1Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(1, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                      title="Rotate clockwise"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Circle 2 Controls */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Small:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(2, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-white w-5 text-center">{LOWERCASE_CHARS[passRing2Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(2, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Circle 3 Controls */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Num:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(3, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-cyan-300 w-5 text-center">{NUMBER_CHARS[passRing3Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(3, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Circle 4 Controls */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Spec:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(4, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-amber-300 w-5 text-center">{SYMBOL_CHARS[passRing4Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePasswordRing(4, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                {/* Circle 1 Words */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">1. Words:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePassphraseRing(1, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs text-white truncate max-w-[70px]">{PASSPHRASE_WORDS[ppRing1Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePassphraseRing(1, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Circle 2 Numbers */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">2. Numbers:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePassphraseRing(2, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs text-cyan-300 w-8 text-center">{PASSPHRASE_NUMBERS[ppRing2Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePassphraseRing(2, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Circle 3 Symbols */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">3. Symbols:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePassphraseRing(3, -1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs text-amber-300 w-6 text-center">{PASSPHRASE_SYMBOLS[ppRing3Index]}</span>
                    <button
                      type="button"
                      onClick={() => rotatePassphraseRing(3, 1)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Input Custom Words (Passphrase Mode) */}
            {selectedMode === 'passphrase' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mt-3">
                <label className="text-[11px] font-mono text-slate-300 font-bold block">
                  ✏️ User Input Words Option (Type Your Own Personal Word):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={submitted}
                    value={customWordInput}
                    onChange={(e) => setCustomWordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomWord(); }}
                    placeholder="e.g. Hyderabad, Biryani, Falcon..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    disabled={submitted || !customWordInput.trim()}
                    onClick={handleAddCustomWord}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                  >
                    Add Custom Word
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Builder Bar, NIST Compliance & Finalize & Check */}
        <div className="lg:col-span-4 space-y-5">
          {/* Live String Assembly Bar */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                {selectedMode === 'password' ? 'Current Password' : 'Current Passphrase'}
              </span>
              <span className="text-slate-400 font-semibold">{charLength} Chars</span>
            </div>

            {/* Display Field with Backspace & Clear */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 min-h-[56px]">
              <div className="font-mono text-base font-bold text-white break-all flex-1 tracking-wide">
                {currentOutput || (
                  <span className="text-xs text-slate-600 font-normal italic">
                    {selectedMode === 'password' ? 'Rotate circles and click Add to assemble...' : 'Rotate circles or type custom word to assemble...'}
                  </span>
                )}
              </div>

              {charLength > 0 && !submitted && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono cursor-pointer"
                    title="Clear All"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Passphrase Clickable Token Pills */}
            {selectedMode === 'passphrase' && passphraseTokens.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {passphraseTokens.map((tok, idx) => (
                  <span
                    key={`token-${tok}-${idx}`}
                    onClick={() => handleRemoveToken(idx)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 hover:bg-rose-950/40 hover:border-rose-500/40 hover:text-rose-200 cursor-pointer transition-colors"
                    title="Click to remove component"
                  >
                    <span>{tok}</span>
                    <X className="w-3 h-3 opacity-60" />
                  </span>
                ))}
              </div>
            )}

            {/* Dynamic Compliance Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>Compliance Verification</span>
                <span className="text-cyan-400">NIST SP 800-63B</span>
              </div>

              {/* Length Metric */}
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  metrics.lengthOk ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-600'
                }`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className={metrics.lengthOk ? 'text-slate-200' : 'text-slate-500'}>
                  Length $\ge 12$ chars (Current: {charLength})
                </span>
              </div>

              {/* Entropy / Diversity */}
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  metrics.entropyOk ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-600'
                }`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className={metrics.entropyOk ? 'text-slate-200' : 'text-slate-500'}>
                  {selectedMode === 'password'
                    ? 'All 4 concentric circles utilized (Upper, Lower, Number, Symbol)'
                    : `Multi-token entropy (${metrics.tokenCount} assembled components)`}
                </span>
              </div>

              {/* Spacer / Separators */}
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  metrics.hasSymbol || metrics.hasNumber ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-600'
                }`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className={metrics.hasSymbol || metrics.hasNumber ? 'text-slate-200' : 'text-slate-500'}>
                  Special character or number included
                </span>
              </div>
            </div>

            {/* "Finalize & Check" Button */}
            <button
              type="button"
              disabled={isTesting || charLength === 0 || submitted}
              onClick={handleFinalizeAndCheck}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Cpu className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Simulating Dictionary Attack...' : 'Finalize & Check'}</span>
            </button>
          </div>

          {/* Test Results & Submission */}
          {testResult && (
            <div className={`rounded-3xl border p-5 shadow-2xl space-y-4 animate-fadeIn ${
              testResult.isSecure
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : 'bg-rose-950/50 border-rose-500/50'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  {testResult.isSecure ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-bold text-white">
                    {testResult.isSecure ? 'Security Evaluation Passed' : 'Policy Warning'}
                  </span>
                </div>
                <span className={`font-bold ${testResult.isSecure ? 'text-emerald-300' : 'text-rose-400'}`}>
                  Crack Time: {testResult.crackTime}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {testResult.message}
              </p>

              {testResult.isSecure && (
                <button
                  type="button"
                  disabled={submitted}
                  onClick={handleConfirmSubmit}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Submit Finalized Authentication & Continue</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
