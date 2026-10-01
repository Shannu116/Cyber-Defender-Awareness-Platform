import React from 'react';
import { Shield, Award, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentStep: 'welcome' | 'briefing' | 'quiz' | 'results' | 'admin';
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  maxScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigateAdmin?: () => void;
  onNavigateHome: () => void;
  isPracticeMode?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  currentQuestionIndex,
  totalQuestions,
  score,
  maxScore,
  soundEnabled,
  onToggleSound,
  onNavigateHome,
  isPracticeMode,
  theme,
  onToggleTheme
}) => {
  const progressPercent = currentStep === 'quiz'
    ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
    : currentStep === 'results' ? 100 : 0;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-base lg:text-lg bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                CYBER DEFENDER
              </span>
              {isPracticeMode && (
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  Practice
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Corporate Awareness Platform
            </p>
          </div>
        </div>

        {/* Center Progress Bar (Shown during Quiz) */}
        {currentStep === 'quiz' && (
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Mission {String(currentQuestionIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
              </span>
              <span className="text-slate-400">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-sm shadow-cyan-500/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Right Section: Score, Sound & Admin Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Cyber Score Badge */}
          {(currentStep === 'quiz' || currentStep === 'results') && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 shadow-inner">
              <Award className="w-4 h-4 text-cyan-400 animate-bounce" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Cyber Score</span>
                <span className="text-xs sm:text-sm font-bold text-white font-mono tracking-tight">
                  <span className="text-cyan-400">{score}</span>
                  <span className="text-slate-500"> / {maxScore}</span>
                </span>
              </div>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title={soundEnabled ? 'Mute Audio Effects' : 'Enable Audio Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Color Theme"
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Back to Quiz (Only visible when actively in Admin mode) */}
          {currentStep === 'admin' && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
            >
              <span>Back to Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Progress Bar (Shown below navbar on small screens during Quiz) */}
      {currentStep === 'quiz' && (
        <div className="w-full mt-2.5 pt-2 border-t border-slate-900 md:hidden">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
            <span className="text-cyan-400 font-medium">
              Mission {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
};
