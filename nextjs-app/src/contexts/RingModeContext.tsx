'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type RingMode = 'decimal' | 'normal';

interface RingModeContextType {
  ringMode: RingMode;
  setRingMode: (mode: RingMode) => void;
  toggleRingMode: () => void;
  formatScore: (ring: number, ring01: number) => string;
}

const RingModeContext = createContext<RingModeContextType | undefined>(undefined);

export function RingModeProvider({ children }: { children: ReactNode }) {
  const [ringMode, setRingModeState] = useState<RingMode>('decimal');
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ringMode') as RingMode;
    if (saved === 'normal' || saved === 'decimal') {
      setRingModeState(saved);
    }
  }, []);
  
  const setRingMode = (mode: RingMode) => {
    setRingModeState(mode);
    localStorage.setItem('ringMode', mode);
  };

  const toggleRingMode = () => {
    const newMode = ringMode === 'decimal' ? 'normal' : 'decimal';
    setRingMode(newMode);
  };
  
  const formatScore = (ring: number, ring01: number): string => {
    if (ringMode === 'decimal') {
      return (ring01 / 10).toFixed(1); // "10.5"
    } else {
      return ring.toString(); // "10"
    }
  };
  
  return (
    <RingModeContext.Provider value={{ ringMode, setRingMode, toggleRingMode, formatScore }}>
      {children}
    </RingModeContext.Provider>
  );
}

export const useRingMode = () => {
  const context = useContext(RingModeContext);
  if (!context) {
    throw new Error('useRingMode must be used within RingModeProvider');
  }
  return context;
};

