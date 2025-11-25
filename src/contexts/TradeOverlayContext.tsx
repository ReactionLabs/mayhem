import React, { createContext, useContext, useState } from 'react';

type TradeOverlayContextType = {
  projectedProfitPercent: number | null; // e.g. 50 for 50%
  setProjectedProfitPercent: (percent: number | null) => void;
};

const TradeOverlayContext = createContext<TradeOverlayContextType | null>(null);

export const TradeOverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [projectedProfitPercent, setProjectedProfitPercent] = useState<number | null>(null);

  return (
    <TradeOverlayContext.Provider value={{ projectedProfitPercent, setProjectedProfitPercent }}>
      {children}
    </TradeOverlayContext.Provider>
  );
};

export const useTradeOverlay = () => {
  const context = useContext(TradeOverlayContext);
  if (!context) {
    throw new Error('useTradeOverlay must be used within TradeOverlayProvider');
  }
  return context;
};

