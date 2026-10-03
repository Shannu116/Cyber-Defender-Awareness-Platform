import React, { useState } from 'react';
import { 
  Clock, 
  Target, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  UserCheck, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Mail,
  KeyRound,
  X,
  Building
} from 'lucide-react';
import { DEPARTMENTS } from '../constants/departments';

interface WelcomeScreenProps {
  onStartMission: (participantName: string, department: string, email?: string) => Promise<void> | void;
  onResumeMission?: (participantName: string, department: string, resumeCode?: string, email?: string) => Promise<void> | void;
  onOpenAdmin: () => void;
  isStarting?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onStartMission,
  onResumeMission,
  isStarting = false
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<string>('Operations');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

  // Resume modal state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [resumeDept, setResumeDept] = useState('Operations');
  const [resumeCodeOrEmail, setResumeCodeOrEmail] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [isResumingLoading, setIsResumingLoading] = useState(false);

  // Client-side name format check
  const validateNameInput = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length < 2 || trimmed.length > 60) return false;
    const nameRegex = /^[\p{L}\p{M}\s.'-]+$/u;
    return nameRegex.test(trimmed);
  };

  // Client-side email format check
  const validateEmailInput = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length === 0) return true; // optional
    if (trimmed.length > 254) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  const handleStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setDuplicateMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name before starting the mission.');
      return;
    }

    if (!validateNameInput(trimmedName)) {
      setError('Please enter a valid full name (2 to 60 characters, letters only).');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !validateEmailInput(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      await onStartMission(trimmedName, department, trimmedEmail || undefined);
    } catch (err: any) {
      if (err.isDuplicate) {
        setDuplicateMessage(err.message);
        // Pre-fill resume modal
        setResumeName(trimmedName);
        setResumeDept(department);
      } else {
        setError(err.message || 'Failed to start test session. Please try again.');
      }
    }
  };

  const handleOpenResume = (prefillName = '', prefillDept = '') => {
    setResumeName(prefillName || name || '');
    setResumeDept(prefillDept || department || 'Operations');
    setResumeCodeOrEmail('');
    setResumeError('');
    setShowResumeModal(true);
  };

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError('');

    if (!resumeName.trim()) {
      setResumeError('Please enter your registered full name.');
      return;
    }

    if (!resumeCodeOrEmail.trim()) {
      setResumeError('Please enter your 8-character resume code or work email.');
      return;
    }

    if (!onResumeMission) return;

    setIsResumingLoading(true);
    try {
      const input = resumeCodeOrEmail.trim();
      const isEmailInput = input.includes('@');
      const resumeCodeParam = isEmailInput ? undefined : input;
      const emailParam = isEmailInput ? input : undefined;

      await onResumeMission(resumeName.trim(), resumeDept, resumeCodeParam, emailParam);
      setShowResumeModal(false);
    } catch (err: any) {
      setResumeError(err.message || 'Details do not match any active session. Please check your credentials.');
    } finally {
      setIsResumingLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full mx-auto text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-medium mb-6 shadow-sm shadow-cyan-950">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Interactive Cybersecurity Awareness Experience</span>
        </div>

        {/* Main Title & Slogan */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-3">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            Cyber Aware 2026
          </span>
        </h1>

        <div className="text-xl sm:text-2xl font-bold text-cyan-300 tracking-wider uppercase mb-4">
          “You are the Firewall”
        </div>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Test how well you spot everyday cybersecurity risks. Designed specifically for non-technical employees navigating real-world workplace scenarios.
        </p>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 max-w-2xl mx-auto mb-8 text-left">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Estimated Time</div>
              <div className="text-sm sm:text-base font-bold text-white">8–10 Minutes</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Challenges</div>
              <div className="text-sm sm:text-base font-bold text-white">10 Missions</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Difficulty</div>
              <div className="text-sm sm:text-base font-bold text-emerald-400">Beginner Friendly</div>
            </div>
          </div>
        </div>

        {/* Participant Registration Form */}
        <form onSubmit={handleStart} className="max-w-md w-full mx-auto mb-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-left space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                Participant Information
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              * Required fields
            </span>
          </div>

          {/* Friendly Duplicate Conflict Guidance */}
          {duplicateMessage && (
            <div className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{duplicateMessage}</p>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenResume(name, department)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume Your Test</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name Input (Mandatory) */}
          <div>
            <label htmlFor="participant-name" className="block text-xs uppercase text-slate-300 mb-1.5 font-semibold">
              Full Name <span className="text-cyan-400 font-bold">*</span>
            </label>
            <input
              id="participant-name"
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
                if (duplicateMessage) setDuplicateMessage(null);
              }}
              className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Department Select (Mandatory) */}
          <div>
            <label htmlFor="participant-department" className="block text-xs uppercase text-slate-300 mb-1.5 font-semibold">
              Department <span className="text-cyan-400 font-bold">*</span>
            </label>
            <select
              id="participant-department"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                if (duplicateMessage) setDuplicateMessage(null);
              }}
              className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Work Email Input (Optional, without tacky label) */}
          <div>
            <label htmlFor="participant-email" className="block text-xs uppercase text-slate-300 mb-1 font-semibold">
              Work Email
            </label>
            <input
              id="participant-email"
              type="email"
              placeholder="e.g. alex.morgan@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Only used to help you resume your test. Never shown on screen.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isStarting}
              className="w-full min-h-[48px] py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Initializing Mission...</span>
                </>
              ) : (
                <>
                  <span>Start Mission</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Cross-Device Resume Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => handleOpenResume()}
            className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-medium transition-colors"
          >
            Already started on another device? Resume your test →
          </button>
        </div>

        {/* Security / Privacy Guarantee */}
        <div className="pt-6 border-t border-slate-900/90 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero real passwords requested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% simulated workplace training</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autosaved Test Sessions</span>
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowResumeModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close resume dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resume Test Session</h3>
                <p className="text-xs text-slate-400">Continue from where you left off on any device.</p>
              </div>
            </div>

            {resumeError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resumeError}</span>
              </div>
            )}

            <form onSubmit={handleResumeSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1 font-semibold">
                  Registered Full Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1 font-semibold">
                  Department <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={resumeDept}
                  onChange={(e) => setResumeDept(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1 font-semibold">
                  Resume Code or Work Email <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K7M2-QX4P or name@company.com"
                  value={resumeCodeOrEmail}
                  onChange={(e) => setResumeCodeOrEmail(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the 8-character code shown during your test, or the work email you registered with.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isResumingLoading}
                  className="w-full min-h-[44px] py-3 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                >
                  {isResumingLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Resume Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
