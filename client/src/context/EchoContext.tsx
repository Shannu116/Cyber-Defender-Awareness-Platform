import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { sounds } from '../utils/sound';

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
  activeFinding: EchoExplanation | null;
  history: EchoExplanation[];
  unreadCount: number;
  explainThreat: (finding: Omit<EchoExplanation, 'type'>) => void;
  explainNeutral: (message: string, title?: string) => void;
  selectHistoryItem: (item: EchoExplanation) => void;
  clearEchoHistory: () => void;
}

const EchoContext = createContext<EchoContextType | undefined>(undefined);

export const EchoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFinding, setActiveFinding] = useState<EchoExplanation | null>(null);
  const [history, setHistory] = useState<EchoExplanation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const openEcho = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeEcho = useCallback(() => {
    setIsOpen(false);
  }, []);

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
      if (exists) {
        return prev.map(item => item.id === finding.id ? fullFinding : item);
      }
      return [fullFinding, ...prev];
    });

    // Auto-open Echo side tab when a threat is identified
    setIsOpen(true);
    setUnreadCount(0);
    sounds.playSuccess();
  }, []);

  const explainNeutral = useCallback((message: string, title?: string) => {
    const neutralFinding: EchoExplanation = {
      id: `neutral-${Date.now()}`,
      type: 'neutral',
      title: title || 'Standard Verification Note',
      explanation: message,
      severity: 'neutral',
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveFinding(neutralFinding);
    setIsOpen(true);
    setUnreadCount(0);
    sounds.playClick();
  }, []);

  const selectHistoryItem = useCallback((item: EchoExplanation) => {
    setActiveFinding(item);
    sounds.playClick();
  }, []);

  const clearEchoHistory = useCallback(() => {
    setActiveFinding(null);
    setHistory([]);
    setUnreadCount(0);
  }, []);

  return (
    <EchoContext.Provider
      value={{
        isOpen,
        openEcho,
        closeEcho,
        toggleEcho,
        activeFinding,
        history,
        unreadCount,
        explainThreat,
        explainNeutral,
        selectHistoryItem,
        clearEchoHistory,
      }}
    >
      {children}
    </EchoContext.Provider>
  );
};

export const useEcho = (): EchoContextType => {
  const context = useContext(EchoContext);
  if (!context) {
    throw new Error('useEcho must be used within an EchoProvider');
  }
  return context;
};
