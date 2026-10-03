import React, { useState, useRef, useEffect } from 'react';
import { useEcho } from '../context/EchoContext';
import { Send, X, Trash2, ChevronDown } from 'lucide-react';

// ─── Echo Avatar ─────────────────────────────────────────────────────────────
const EchoAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; pulse?: boolean }> = ({
  size = 'md',
  pulse = false,
}) => {
  const dims = size === 'sm' ? 'w-7 h-7 text-base' : size === 'lg' ? 'w-12 h-12 text-2xl' : 'w-9 h-9 text-xl';
  return (
    <div className={`relative shrink-0 ${dims}`}>
      {pulse && (
        <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping" />
      )}
      <div className={`relative ${dims} rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 font-bold text-slate-900 select-none`}>
        E
      </div>
    </div>
  );
};

// ─── Typing Dots ──────────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
        style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
      />
    ))}
  </div>
);

// ─── Parse bold markdown (**text**) into JSX ──────────────────────────────────
function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
  );
}

// ─── Render a single chat message ─────────────────────────────────────────────
const ChatBubble: React.FC<{ role: 'echo' | 'user'; text: string; isTyping?: boolean }> = ({
  role,
  text,
  isTyping,
}) => {
  const isEcho = role === 'echo';

  return (
    <div className={`flex items-end gap-2.5 ${isEcho ? 'justify-start' : 'justify-end'}`}>
      {isEcho && <EchoAvatar size="sm" />}

      <div
        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isEcho
            ? 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/60'
            : 'bg-green-600 text-white rounded-br-sm'
        }`}
      >
        {isTyping ? (
          <TypingDots />
        ) : (
          isEcho
            ? parseBold(text)
            : text
        )}
      </div>
    </div>
  );
};

// ─── Main EchoTutorTab component ──────────────────────────────────────────────
export const EchoTutorTab: React.FC = () => {
  const {
    isOpen,
    closeEcho,
    toggleEcho,
    messages,
    isEchoTyping,
    unreadCount,
    history,
    sendUserMessage,
    clearEchoHistory,
  } = useEcho();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isEchoTyping) return;
    sendUserMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const threatCount = history.filter(h => h.type === 'threat').length;

  return (
    <>
      {/* ── Floating trigger button (when closed) ───────────────────────── */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleEcho}
          aria-label="Open Echo AI Tutor"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl bg-[#1c2333] hover:bg-[#212d40] text-white border border-green-500/40 shadow-xl shadow-green-900/30 hover:shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <EchoAvatar size="sm" pulse={unreadCount > 0} />

          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              Echo
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-mono">
                AI Tutor
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {threatCount > 0
                ? `${threatCount} threat${threatCount > 1 ? 's' : ''} found`
                : 'Ask me anything'}
            </div>
          </div>

          {unreadCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-green-500 text-slate-900 text-[10px] font-black flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile backdrop ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          onClick={closeEcho}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      {/* ── Sidebar drawer ───────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#1c2333] border-l border-slate-700/60 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 bg-[#161d2e] border-b border-slate-700/60 flex items-center gap-3">
          <EchoAvatar size="md" pulse />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Echo</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                Security Tutor
              </span>
              {/* Online dot */}
              <span className="flex items-center gap-1 ml-auto text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Click any suspicious element · I'll explain it
            </p>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearEchoHistory}
                aria-label="Clear chat history"
                title="Clear chat"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={closeEcho}
              aria-label="Close Echo"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        >
          {messages.length === 0 && (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <EchoAvatar size="lg" pulse />
              <div>
                <p className="text-sm font-semibold text-white mb-1">I'm Echo</p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">
                  Your personal security tutor. Tap any part of the challenge that seems suspicious and I'll explain the threat — without spoiling the answer.
                </p>
              </div>
              <div className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] font-mono text-green-300 text-left">
                💡 Tip: Look at sender addresses, link URLs, and urgent language first.
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

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom pill */}
        {showScrollBtn && isOpen && (
          <div className="absolute bottom-[72px] right-4">
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-700 border border-slate-600 text-xs text-slate-300 hover:bg-slate-600 shadow-md transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Latest</span>
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="shrink-0 px-3 py-3 bg-[#161d2e] border-t border-slate-700/60">
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl border border-slate-700/60 focus-within:border-green-500/60 transition-colors px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEchoTyping ? 'Echo is typing…' : 'Ask Echo anything…'}
              disabled={isEchoTyping}
              aria-label="Message Echo"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none min-w-0 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isEchoTyping}
              aria-label="Send message"
              className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-1.5">
            Echo gives hints — not answers
          </p>
        </div>
      </aside>
    </>
  );
};
