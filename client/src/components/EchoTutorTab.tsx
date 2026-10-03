import React, { useState, useRef, useEffect } from 'react';
import { useEcho } from '../context/EchoContext';
import { Send, X, Trash2, ChevronDown } from 'lucide-react';

// ─── Ghost Mascot SVG (Accurate vector of the green hooded ghost blueprint) ───
// Features:
//   • Pointed curved hood tip at top-left
//   • Vibrant lime-green cloak with depth shadow folds
//   • Deep black face cavity inside the hood
//   • Two bright white vertical pill eyes
//   • Flowing wavy ghost tail / cape trailing to the left
//   • Heavy dark outline with rounded joins

interface GhostSVGProps {
  className?: string;
  style?: React.CSSProperties;
}

export const GhostSVG: React.FC<GhostSVGProps> = ({ className = '', style }) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {/* Under-cloak depth / inner shadow */}
    <path
      d="M 33 60 C 27 63, 23 68, 28 72 C 34 76, 42 70, 48 76 C 54 81, 62 76, 64 71 C 55 72, 44 68, 38 61 Z"
      fill="#52af05"
      className="echo-cape-wave"
    />

    {/* Main Green Hood & Body */}
    <path
      d="M 46 27
         C 40 25, 34 26, 30 30
         C 26 34, 27 38, 32 37
         C 37 36, 38 33, 42 36
         C 44 38, 42 43, 40 48
         C 36 53, 29 55, 25 58
         C 20 62, 22 69, 28 71
         C 33 73, 38 69, 43 72
         C 48 76, 54 78, 60 73
         C 63 70, 64 66, 67 63
         C 72 61, 76 56, 76 48
         C 76 36, 68 22, 54 22
         C 49 22, 47 25, 46 27 Z"
      fill="#7ce011"
      stroke="#121612"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="echo-cape-wave"
    />

    {/* Highlight sheen on top of hood */}
    <path
      d="M 52 25 C 62 25, 71 34, 72 44"
      fill="none"
      stroke="#a4f442"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.85"
    />

    {/* Black Face Opening / Cavity inside Hood */}
    <path
      d="M 50 40
         C 53 33, 68 31, 72 38
         C 76 43, 76 52, 70 56
         C 64 60, 55 58, 50 52
         C 47 48, 48 44, 50 40 Z"
      fill="#0c0f0a"
      stroke="#121612"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Left Eye (pure white vertical oval pill) */}
    <ellipse
      cx="57.5"
      cy="45.5"
      rx="3.5"
      ry="6.5"
      transform="rotate(-5 57.5 45.5)"
      fill="#ffffff"
    />

    {/* Right Eye (pure white vertical oval pill) */}
    <ellipse
      cx="66.5"
      cy="44.5"
      rx="3.5"
      ry="6.5"
      transform="rotate(6 66.5 44.5)"
      fill="#ffffff"
    />
  </svg>
);

// ─── Floating Ghost Avatar (Trigger & Large Header) ───────────────────────────
const FloatingGhost: React.FC<{ size: number; pulse?: boolean }> = ({ size, pulse }) => (
  <div
    className="relative echo-ghost-float flex items-center justify-center shrink-0"
    style={{ width: size, height: size }}
  >
    {pulse && (
      <span
        className="absolute inset-0 rounded-full echo-glow-ring pointer-events-none"
      />
    )}
    <GhostSVG className="w-full h-full select-none" />
  </div>
);

// ─── Small Ghost for Chat Bubbles ─────────────────────────────────────────────
const TinyGhost: React.FC = () => (
  <div className="w-7 h-7 shrink-0 echo-ghost-float-slow select-none">
    <GhostSVG className="w-full h-full" />
  </div>
);

// ─── Animated Typing Dots ─────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1.5 px-1 py-1 h-5">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-green-400 echo-typing-dot"
        style={{ animationDelay: `${i * 160}ms` }}
      />
    ))}
  </div>
);

// ─── Markdown Bold Parser ─────────────────────────────────────────────────────
function parseBold(raw: string): React.ReactNode[] {
  return raw.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-slate-100 font-semibold">{part}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

// ─── Single Chat Bubble ───────────────────────────────────────────────────────
const ChatBubble: React.FC<{ role: 'echo' | 'user'; text: string; isTyping?: boolean }> = ({
  role, text, isTyping,
}) => {
  const isEcho = role === 'echo';
  return (
    <div className={`flex items-end gap-2.5 ${isEcho ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
      {isEcho && <TinyGhost />}
      <div
        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isEcho
            ? 'bg-slate-850 text-slate-200 rounded-bl-sm border border-slate-800 shadow-sm'
            : 'bg-emerald-600 text-white rounded-br-sm shadow-md'
        }`}
      >
        {isTyping ? <TypingDots /> : (isEcho ? parseBold(text) : text)}
      </div>
    </div>
  );
};

// ─── Main EchoTutorTab Component ──────────────────────────────────────────────
export const EchoTutorTab: React.FC = () => {
  const {
    isOpen,
    closeEcho,
    toggleEcho,
    messages,
    isEchoTyping,
    unreadCount,
    sendUserMessage,
    clearEchoHistory,
  } = useEcho();

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom whenever messages change or drawer opens
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus text input upon opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceToBottom > 110);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isEchoTyping) return;
    sendUserMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      {/* ── Floating trigger button (when closed) ───────────────────────── */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleEcho}
          aria-label="Open Echo Security Tutor"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-850 text-slate-100 border border-emerald-500/40 shadow-2xl shadow-emerald-950/20 hover:shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-md cursor-pointer"
        >
          <FloatingGhost size={42} pulse={unreadCount > 0} />

          <div className="text-left font-mono">
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Echo</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                AI Tutor
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Tap for hints & guidance
            </div>
          </div>

          {unreadCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile backdrop overlay ───────────────────────────────────────── */}
      {isOpen && (
        <div
          onClick={closeEcho}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden transition-opacity"
        />
      )}

      {/* ── Sidebar drawer ────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[410px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header Bar */}
        <div className="shrink-0 px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <FloatingGhost size={38} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 font-mono">Echo</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                Security Tutor
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Type <strong className="text-emerald-600 dark:text-emerald-400 font-mono">hint</strong> if you get stuck
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 1 && (
              <button
                type="button"
                onClick={clearEchoHistory}
                aria-label="Clear chat"
                title="Clear chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={closeEcho}
              aria-label="Close Echo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-900"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3.5 py-10 px-4">
              <FloatingGhost size={74} pulse />
              <div>
                <p className="text-base font-bold text-slate-100 mb-1">Hey, I'm Echo 👋</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                  Your personal security tutor. Click anything suspicious in the challenge and I'll explain the threat — without spoiling the answer.
                </p>
              </div>
              <div className="w-full p-3 rounded-xl bg-emerald-950/15 dark:bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 text-left mt-2">
                💡 Tip: Check sender domains, URL links, and urgent language first.
              </div>
            </div>
          )}

          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              text={msg.text}
              isTyping={msg.isTyping}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Scroll-to-bottom Floating Button */}
        {showScrollBtn && isOpen && (
          <div className="absolute bottom-[76px] right-4">
            <button
              type="button"
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:bg-slate-700 hover:text-slate-100 shadow-lg backdrop-blur-sm transition-all"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Latest</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="shrink-0 px-3.5 py-3 bg-slate-950/90 border-t border-slate-800">
          <div className="flex items-center gap-2 bg-slate-850 dark:bg-slate-950 rounded-xl border border-slate-700/60 dark:border-slate-800 focus-within:border-emerald-500/60 transition-colors px-3 py-2 shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isEchoTyping ? 'Echo is thinking…' : 'Ask Echo or type "hint"…'}
              disabled={isEchoTyping}
              aria-label="Message Echo"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none min-w-0 disabled:opacity-40"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isEchoTyping}
              aria-label="Send message"
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1.5 font-mono">
            Echo gives hints — not answers
          </p>
        </div>
      </aside>
    </>
  );
};
