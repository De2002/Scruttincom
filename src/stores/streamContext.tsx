import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ConversationStarter } from '@/types';

interface StreamState {
  currentConversationIndex: number;
  currentScrutIndex: number;
  seenScrutIds: Set<string>;
  pinned: string[];
  dailyStarterUsed: boolean;
}

interface StreamContextValue extends StreamState {
  goNextScrut: () => void;
  goNextConversation: () => void;
  markSeen: (id: string) => void;
  togglePin: (id: string) => void;
  setDailyStarterUsed: () => void;
  setConversation: (idx: number) => void;
}

const StreamContext = createContext<StreamContextValue | null>(null);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>({
    currentConversationIndex: 0,
    currentScrutIndex: 0,
    seenScrutIds: new Set(),
    pinned: [],
    dailyStarterUsed: false,
  });

  const goNextScrut = useCallback(() => {
    setState(s => ({ ...s, currentScrutIndex: s.currentScrutIndex + 1 }));
  }, []);

  const goNextConversation = useCallback(() => {
    setState(s => ({
      ...s,
      currentConversationIndex: s.currentConversationIndex + 1,
      currentScrutIndex: 0,
    }));
  }, []);

  const markSeen = useCallback((id: string) => {
    setState(s => ({ ...s, seenScrutIds: new Set([...s.seenScrutIds, id]) }));
  }, []);

  const togglePin = useCallback((id: string) => {
    setState(s => ({
      ...s,
      pinned: s.pinned.includes(id) ? s.pinned.filter(p => p !== id) : [...s.pinned, id],
    }));
  }, []);

  const setDailyStarterUsed = useCallback(() => {
    setState(s => ({ ...s, dailyStarterUsed: true }));
  }, []);

  const setConversation = useCallback((idx: number) => {
    setState(s => ({ ...s, currentConversationIndex: idx, currentScrutIndex: 0 }));
  }, []);

  return (
    <StreamContext.Provider value={{ ...state, goNextScrut, goNextConversation, markSeen, togglePin, setDailyStarterUsed, setConversation }}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error('useStream must be used within StreamProvider');
  return ctx;
}
