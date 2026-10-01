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
  AlertTriangle 
} from 'lucide-react';

interface WelcomeScreenProps {
  onStartMission: (participantName: string, department: string) => void;
  onOpenAdmin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onStartMission,
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [error, setError] = useState('');

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name before starting the mission.');
      return;
    }
    setError('');
    onStartMission(name.trim(), department);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background cyber gradient accents */}
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

        <div className="text-xl sm:text-2xl font-bold text-cyan-300 font-mono tracking-wider uppercase mb-4">
          “You are the Firewall”
        </div>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Test how well you can spot everyday cybersecurity risks. Designed specifically for non-technical employees navigating real-world workplace scenarios.
        </p>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 max-w-2xl mx-auto mb-8 text-left">
          {/* Estimated Time */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Estimated Time</div>
              <div className="text-sm sm:text-base font-bold text-white">8–10 Minutes</div>
            </div>
          </div>

          {/* Challenges */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Challenges</div>
              <div className="text-sm sm:text-base font-bold text-white">10 Missions</div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Difficulty</div>
              <div className="text-sm sm:text-base font-bold text-emerald-400">Beginner Friendly</div>
            </div>
          </div>
        </div>

        {/* Participant Name & Department Form (Required before starting) */}
        <form onSubmit={handleStart} className="max-w-md w-full mx-auto mb-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-left space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Participant Information
            </h3>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-semibold">
              Full Name <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-semibold">
              Department <span className="text-cyan-400">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <option value="Operations">Operations</option>
              <option value="Finance & Accounting">Finance & Accounting</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Legal & Compliance">Legal & Compliance</option>
              <option value="IT & Engineering">IT & Engineering</option>
              <option value="Executive & Management">Executive & Management</option>
              <option value="General Staff">General Staff</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
            >
              <span>Start Mission</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Security / Privacy Guarantee */}
        <div className="mt-6 pt-6 border-t border-slate-900/90 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero real credentials ever requested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% simulated workplace scenarios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Database Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
