import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export interface EchoMessage {
  id: string;
  role: 'echo' | 'user';
  text: string;
  isTyping?: boolean;   // true while the animated typing dots are showing
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

interface EchoContextType {
  isOpen: boolean;
  openEcho: () => void;
  closeEcho: () => void;
  toggleEcho: () => void;
  messages: EchoMessage[];
  unreadCount: number;
  isEchoTyping: boolean;
  activeFinding: EchoExplanation | null;
  history: EchoExplanation[];
  explainThreat: (finding: Omit<EchoExplanation, 'type'>) => void;
  explainNeutral: (message: string, title?: string) => void;
  sendUserMessage: (text: string) => void;
  selectHistoryItem: (item: EchoExplanation) => void;
  clearEchoHistory: () => void;
}

const EchoContext = createContext<EchoContextType | undefined>(undefined);

/** Simulates Echo typing then revealing a message with a realistic delay */
function useEchoTypingEffect() {
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isEchoTyping, setIsEchoTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushEchoMessage = useCallback((text: string) => {
    const typingId = `typing-${Date.now()}`;
    setIsEchoTyping(true);

    // Show typing indicator
    setMessages(prev => [...prev, { id: typingId, role: 'echo', text: '', isTyping: true }]);

    // Calculate reading-speed delay (80–120 ms per word, min 800ms)
    const wordCount = text.split(' ').length;
    const delay = Math.max(800, Math.min(wordCount * 95, 2800));

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === typingId ? { ...m, text, isTyping: false } : m)
      );
      setIsEchoTyping(false);
    }, delay);
  }, []);

  const pushUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text }]);
  }, []);

  const clearMessages = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setMessages([]);
    setIsEchoTyping(false);
  }, []);

  return { messages, isEchoTyping, pushEchoMessage, pushUserMessage, clearMessages };
}

export const EchoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFinding, setActiveFinding] = useState<EchoExplanation | null>(null);
  const [history, setHistory] = useState<EchoExplanation[]>([]);

  const { messages, isEchoTyping, pushEchoMessage, pushUserMessage, clearMessages } = useEchoTypingEffect();

  const openEcho = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeEcho = useCallback(() => setIsOpen(false), []);

  const toggleEcho = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const explainThreat = useCallback((finding: Omit<EchoExplanation, 'type'>) => {
    const fullFinding: EchoExplanation = {
      ...finding,
      type: 'threat',
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveFinding(fullFinding);
    setHistory(prev => {
      const exists = prev.some(item => item.id === finding.id);
      return exists
        ? prev.map(item => item.id === finding.id ? fullFinding : item)
        : [fullFinding, ...prev];
    });

    // Build Echo's conversational message
    let echoText = `🚨 **${fullFinding.title}**\n\n${fullFinding.explanation}`;
    if (fullFinding.attackerObjective) {
      echoText += `\n\n🎯 **Attacker's goal:** ${fullFinding.attackerObjective}`;
    }
    if (fullFinding.proTip) {
      echoText += `\n\n💡 **How to spot it next time:** ${fullFinding.proTip}`;
    }

    pushEchoMessage(echoText);
    setIsOpen(true);
    setUnreadCount(0);
  }, [pushEchoMessage]);

  const explainNeutral = useCallback((message: string, title?: string) => {
    const neutralFinding: EchoExplanation = {
      id: `neutral-${Date.now()}`,
      type: 'neutral',
      title: title || 'Good observation!',
      explanation: message,
      severity: 'neutral',
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveFinding(neutralFinding);
    pushEchoMessage(`✅ **${neutralFinding.title}**\n\n${message}`);
    setIsOpen(true);
    setUnreadCount(0);
  }, [pushEchoMessage]);

  const sendUserMessage = useCallback((text: string) => {
    pushUserMessage(text);
    // Echo gives a contextual nudge without spoiling the answer
    const nudges = [
      "Good question! Think about what makes a legitimate sender address different from a spoofed one. Check the domain carefully — sometimes attackers replace letters with numbers.",
      "That's a great thing to investigate. Look at the urgency in the language — real organizations rarely threaten account closure within 24 hours.",
      "I can give you a nudge: hover over links before clicking. What does the URL actually say versus what the link text shows you?",
      "Interesting observation! Consider who is asking for the information, through what channel, and whether that's normal behavior for that person or system.",
      "Think about the context: would your IT department normally contact you through this channel? If something feels off, trust that instinct — it usually is.",
    ];
    const reply = nudges[Math.floor(Math.random() * nudges.length)];
    setTimeout(() => pushEchoMessage(reply), 300);
  }, [pushUserMessage, pushEchoMessage]);

  const selectHistoryItem = useCallback((item: EchoExplanation) => {
    setActiveFinding(item);
    let text = `Revisiting: **${item.title}**\n\n${item.explanation}`;
    if (item.proTip) text += `\n\n💡 ${item.proTip}`;
    pushEchoMessage(text);
  }, [pushEchoMessage]);

  const clearEchoHistory = useCallback(() => {
    setActiveFinding(null);
    setHistory([]);
    clearMessages();
    setUnreadCount(0);
  }, [clearMessages]);

  // Greet user when Echo is first opened
  const hasGreeted = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !hasGreeted.current && messages.length === 0) {
      hasGreeted.current = true;
      pushEchoMessage("Hey! I'm Echo, your security tutor. Click on anything in the challenge that looks suspicious and I'll break it down for you — no spoilers, just guidance. 🔍");
    }
  }, [isOpen, messages.length, pushEchoMessage]);

  return (
    <EchoContext.Provider
      value={{
        isOpen, openEcho, closeEcho, toggleEcho,
        messages, unreadCount, isEchoTyping,
        activeFinding, history,
        explainThreat, explainNeutral,
        sendUserMessage, selectHistoryItem, clearEchoHistory,
      }}
    >
      {children}
    </EchoContext.Provider>
  );
};

export const useEcho = (): EchoContextType => {
  const ctx = useContext(EchoContext);
  if (!ctx) throw new Error('useEcho must be used within an EchoProvider');
  return ctx;
};
