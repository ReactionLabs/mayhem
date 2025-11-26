import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'wss://pumpportal.fun/api/data';

export type PumpTokenCreateEvent = {
  txType: 'create';
  mint: string;
  traderPublicKey: string;
  name: string;
  symbol: string;
  uri: string;
  initialBuy: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
};

export type PumpTradeEvent = {
  txType: 'buy' | 'sell';
  mint: string;
  traderPublicKey: string;
  tokenAmount: number;
  solAmount: number;
  newTokenBalance: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
};

type PumpStreamContextType = {
  subscribeNewTokens: () => void;
  unsubscribeNewTokens: () => void;
  subscribeTokenTrades: (mints: string[]) => void;
  unsubscribeTokenTrades: (mints: string[]) => void;
  lastCreateEvent: PumpTokenCreateEvent | null;
  lastTradeEvent: PumpTradeEvent | null;
  isConnected: boolean;
};

const PumpStreamContext = createContext<PumpStreamContextType | null>(null);

export const PumpStreamProvider = ({ children }: { children: React.ReactNode }) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastCreateEvent, setLastCreateEvent] = useState<PumpTokenCreateEvent | null>(null);
  const [lastTradeEvent, setLastTradeEvent] = useState<PumpTradeEvent | null>(null);
  
  // Track subscriptions to resubscribe on reconnect
  const isSubscribedToNewTokens = useRef(false);
  const subscribedTokenMints = useRef<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Connected to PumpPortal WebSocket');
      }
      setIsConnected(true);

      // Resubscribe if needed
      if (isSubscribedToNewTokens.current) {
        socket.send(JSON.stringify({ method: 'subscribeNewToken' }));
      }
      if (subscribedTokenMints.current.size > 0) {
        socket.send(JSON.stringify({ 
          method: 'subscribeTokenTrade', 
          keys: Array.from(subscribedTokenMints.current) 
        }));
      }
    };

    socket.onclose = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Disconnected from PumpPortal WebSocket');
      }
      setIsConnected(false);
      // Exponential backoff for reconnection
      const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Max 30s
      reconnectAttempts.current += 1;
      setTimeout(() => {
        reconnectAttempts.current = 0; // Reset on successful connection
        connect();
      }, reconnectDelay);
    };

    socket.onerror = (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('PumpPortal WebSocket error:', error);
      }
      socket.close();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different event types
        if (data.txType === 'create') {
          // Check if it's an SPL token event (Pump tokens are SPL, but verify context if needed)
          setLastCreateEvent(data);
        } else if (data.txType === 'buy' || data.txType === 'sell') {
          setLastTradeEvent(data);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing PumpPortal message:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const subscribeNewTokens = useCallback(() => {
    isSubscribedToNewTokens.current = true;
    if (ws.current?.readyState === WebSocket.OPEN) {
      // This subscribes to ALL new token creations on Pump.fun
      ws.current.send(JSON.stringify({ method: 'subscribeNewToken' }));
    }
  }, []);

  const unsubscribeNewTokens = useCallback(() => {
    isSubscribedToNewTokens.current = false;
  }, []);

  const subscribeTokenTrades = useCallback((mints: string[]) => {
    mints.forEach(mint => subscribedTokenMints.current.add(mint));
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        method: 'subscribeTokenTrade', 
        keys: mints 
      }));
    }
  }, []);

  const unsubscribeTokenTrades = useCallback((mints: string[]) => {
    mints.forEach(mint => subscribedTokenMints.current.delete(mint));
  }, []);

  return (
    <PumpStreamContext.Provider
      value={{
        subscribeNewTokens,
        unsubscribeNewTokens,
        subscribeTokenTrades,
        unsubscribeTokenTrades,
        lastCreateEvent,
        lastTradeEvent,
        isConnected,
      }}
    >
      {children}
    </PumpStreamContext.Provider>
  );
};

export const usePumpStream = () => {
  const context = useContext(PumpStreamContext);
  if (!context) {
    throw new Error('usePumpStream must be used within PumpStreamProvider');
  }
  return context;
};
