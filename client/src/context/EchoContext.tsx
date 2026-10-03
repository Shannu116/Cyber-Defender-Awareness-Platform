import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  label: string;       // short name shown in the checklist, e.g. "Suspicious sender domain"
  hint: string;        // what Echo says when hinting at this unfound item
  severity?: 'critical' | 'high' | 'medium' | 'neutral';
}

export interface EchoMessage {
  id: string;
  role: 'echo' | 'user';
  text: string;
  isTyping?: boolean;
}

export interface EchoExplanation {
  id: string;
  type: 'threat' | 'neutral' | 'tip';
  title: string;
  subtitle?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'neutral';
  explanation: string;
  attackerObjective?: string;
  proTip?: string;
  detectedAt?: string;
}

// Keywords that trigger "give me a hint" behaviour
const HELP_KEYWORDS = [
  'help', 'hint', 'stuck', 'clue', 'next', 'guide', 'lost', 'tip',
  'what', 'where', 'how', 'find', 'look', 'show', 'more', '?',
  "don't know", "dont know", 'no idea', 'confused', 'give up',
];

function isHelpRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return HELP_KEYWORDS.some(k => lower.includes(k));
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface EchoContextType {
  isOpen: boolean;
  openEcho: () => void;
  closeEcho: () => void;
  toggleEcho: () => void;
  // Chat
  messages: EchoMessage[];
  unreadCount: number;
  isEchoTyping: boolean;
  sendUserMessage: (text: string) => void;
  // Findings / Checklist
  checklist: ChecklistItem[];
  foundIds: string[];
  registerChecklist: (items: ChecklistItem[]) => void;
  clearChecklist: () => void;
  // Threat/Neutral explain (called by challenges)
  explainThreat: (finding: Omit<EchoExplanation, 'type'>) => void;
  explainNeutral: (message: string, title?: string) => void;
  // Legacy (kept for backward compat with existing challenge components)
  activeFinding: EchoExplanation | null;
  history: EchoExplanation[];
  selectHistoryItem: (item: EchoExplanation) => void;
  clearEchoHistory: () => void;
}

const EchoContext = createContext<EchoContextType | undefined>(undefined);

// ─── Typing animation hook ────────────────────────────────────────────────────

function useTypingEffect() {
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback((text: string, delayOverride?: number) => {
    const id = `echo-${Date.now()}-${Math.random()}`;
    setIsTyping(true);
    setMessages(prev => [...prev, { id, role: 'echo', text: '', isTyping: true }]);

    const delay = delayOverride ?? Math.max(700, Math.min(text.split(' ').length * 90, 2500));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text, isTyping: false } : m));
      setIsTyping(false);
    }, delay);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text }]);
  }, []);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setMessages([]);
    setIsTyping(false);
  }, []);

  return { messages, isTyping, push, pushUser, clear };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const EchoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [activeFinding, setActiveFinding] = useState<EchoExplanation | null>(null);
  const [history, setHistory] = useState<EchoExplanation[]>([]);

  const { messages, isTyping: isEchoTyping, push, pushUser, clear } = useTypingEffect();
  const hasGreeted = useRef(false);

  // ── Open / close ────────────────────────────────────────────────────────────
  const openEcho = useCallback(() => { setIsOpen(true); setUnreadCount(0); }, []);
  const closeEcho = useCallback(() => setIsOpen(false), []);
  const toggleEcho = useCallback(() => {
    setIsOpen(prev => { if (!prev) setUnreadCount(0); return !prev; });
  }, []);

  // ── Greet on first open ──────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isOpen && !hasGreeted.current && messages.length === 0) {
      hasGreeted.current = true;
      push(
        "Hey! I'm Echo 👻 your security tutor.\n\nClick on anything in the challenge that looks suspicious — I'll add it to your checklist and explain the threat.\n\nType **help** or **hint** any time and I'll nudge you toward the next thing to find.",
        900
      );
    }
  }, [isOpen, messages.length, push]);

  // ── Checklist registration ────────────────────────────────────────────────────
  const registerChecklist = useCallback((items: ChecklistItem[]) => {
    setChecklist(items);
    setFoundIds([]);
  }, []);

  const clearChecklist = useCallback(() => {
    setChecklist([]);
    setFoundIds([]);
  }, []);

  // ── Mark a finding discovered ─────────────────────────────────────────────────
  const markFound = useCallback((id: string) => {
    setFoundIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  // ── Explain threat (called by challenge components) ───────────────────────────
  const explainThreat = useCallback((finding: Omit<EchoExplanation, 'type'>) => {
    const full: EchoExplanation = {
      ...finding,
      type: 'threat',
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveFinding(full);
    setHistory(prev => {
      const exists = prev.some(i => i.id === finding.id);
      return exists ? prev.map(i => i.id === finding.id ? full : i) : [full, ...prev];
    });

    // Mark found in checklist
    markFound(finding.id);

    // Build chat message
    let text = `🚨 **${full.title}** — found!\n\n${full.explanation}`;
    if (full.attackerObjective) text += `\n\n🎯 **Attacker's goal:** ${full.attackerObjective}`;
    if (full.proTip) text += `\n\n💡 **Remember:** ${full.proTip}`;

    push(text);
    setIsOpen(true);
    setUnreadCount(0);
  }, [push, markFound]);

  const explainNeutral = useCallback((message: string, title?: string) => {
    const neutral: EchoExplanation = {
      id: `neutral-${Date.now()}`,
      type: 'neutral',
      title: title || 'Good eye!',
      explanation: message,
      severity: 'neutral',
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveFinding(neutral);
    push(`✅ **${neutral.title}**\n\n${message}`);
    setIsOpen(true);
    setUnreadCount(0);
  }, [push]);

  // ── Send user message + hint engine ──────────────────────────────────────────
  const sendUserMessage = useCallback((text: string) => {
    pushUser(text);

    if (isHelpRequest(text)) {
      // Find first unfound checklist item
      const unfound = checklist.filter(item => !foundIds.includes(item.id));

      if (unfound.length === 0 && checklist.length > 0) {
        setTimeout(() => push(
          "You've found **everything** in this challenge! 🎉 Make your final decision and submit your answer."
        ), 300);
        return;
      }

      if (unfound.length > 0) {
        const next = unfound[0];
        const remaining = unfound.length;
        setTimeout(() => push(
          `You still have **${remaining}** finding${remaining > 1 ? 's' : ''} to discover.\n\n🔍 **Hint for the next one:**\n${next.hint}\n\n*(Don't worry — I won't tell you exactly where it is. Keep exploring!)*`
        ), 350);
        return;
      }

      // No checklist registered — generic nudge
      const nudges = [
        "Look carefully at the sender address — is the domain exactly right, or does it use lookalike characters?",
        "Hover over any link before clicking it. What does the actual destination URL say?",
        "Is the tone of the message unusually urgent or threatening? Legitimate systems rarely threaten you.",
        "Check the greeting — does it use your real name, or just 'Hello,'?",
        "Look for spelling mistakes, strange formatting, or anything that feels slightly off.",
      ];
      setTimeout(() => push(nudges[Math.floor(Math.random() * nudges.length)]), 350);
      return;
    }

    // Non-help message — acknowledge and guide
    setTimeout(() => push(
      "Good thinking! Keep exploring the challenge. Click anything that looks suspicious and I'll analyse it for you. Type **hint** if you need a nudge."
    ), 350);
  }, [pushUser, push, checklist, foundIds]);

  // ── Legacy compat ─────────────────────────────────────────────────────────────
  const selectHistoryItem = useCallback((item: EchoExplanation) => {
    setActiveFinding(item);
    push(`Revisiting: **${item.title}**\n\n${item.explanation}${item.proTip ? `\n\n💡 ${item.proTip}` : ''}`);
  }, [push]);

  const clearEchoHistory = useCallback(() => {
    setActiveFinding(null);
    setHistory([]);
    clear();
    setUnreadCount(0);
    hasGreeted.current = false;
  }, [clear]);

  return (
    <EchoContext.Provider value={{
      isOpen, openEcho, closeEcho, toggleEcho,
      messages, unreadCount, isEchoTyping, sendUserMessage,
      checklist, foundIds, registerChecklist, clearChecklist,
      explainThreat, explainNeutral,
      activeFinding, history, selectHistoryItem, clearEchoHistory,
    }}>
      {children}
    </EchoContext.Provider>
  );
};

export const useEcho = (): EchoContextType => {
  const ctx = useContext(EchoContext);
  if (!ctx) throw new Error('useEcho must be used within an EchoProvider');
  return ctx;
};
