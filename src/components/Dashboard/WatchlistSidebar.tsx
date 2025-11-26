import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Star, Activity } from 'lucide-react';
import { usePumpStream, PumpTokenCreateEvent, PumpTradeEvent } from '@/contexts/PumpStreamProvider';

type WatchlistItem = {
  symbol: string;
  mint: string;
  price: number;
  change: number;
  lastUpdate: number;
};

interface WatchlistSidebarProps {
    onSelectToken?: (mint: string) => void;
}

const WatchlistSidebarComponent: React.FC<WatchlistSidebarProps> = ({ onSelectToken }) => {
  const { 
    subscribeNewTokens, 
    subscribeTokenTrades, 
    lastCreateEvent, 
    lastTradeEvent, 
    isConnected 
  } = usePumpStream();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Initialize stream
  useEffect(() => {
    if (isConnected) {
      subscribeNewTokens();
    }
  }, [isConnected, subscribeNewTokens]);

  // Listen for new tokens
  useEffect(() => {
    if (lastCreateEvent) {
      setWatchlist(prev => {
        if (prev.some(item => item.mint === lastCreateEvent.mint)) return prev;
        
        const newItem: WatchlistItem = {
          symbol: lastCreateEvent.symbol,
          mint: lastCreateEvent.mint,
          price: lastCreateEvent.marketCapSol / 1000000000, 
          change: 0,
          lastUpdate: Date.now()
        };
        
        const newList = [newItem, ...prev].slice(0, 15);
        subscribeTokenTrades([lastCreateEvent.mint]);
        return newList;
      });
    }
  }, [lastCreateEvent, subscribeTokenTrades]);

  // Update prices
  useEffect(() => {
    if (lastTradeEvent) {
      setWatchlist(prev => {
        return prev.map(item => {
          if (item.mint === lastTradeEvent.mint) {
            const newPrice = lastTradeEvent.marketCapSol / 1000000000; 
            const change = ((newPrice - item.price) / item.price) * 100;
            
            return {
              ...item,
              price: newPrice,
              change: isNaN(change) ? 0 : change,
              lastUpdate: Date.now()
            };
          }
          return item;
        });
      });
    }
  }, [lastTradeEvent]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
          {isConnected ? 'Live Feed' : 'Connecting...'}
        </span>
      </div>

      {watchlist.length === 0 && (
        <div className="p-4 text-center border border-dashed rounded-lg border-border">
            <Activity className="w-6 h-6 mx-auto text-muted-foreground mb-2 animate-spin" />
            <p className="text-xs text-muted-foreground">Waiting for new pairs...</p>
        </div>
      )}

      {watchlist.map((token) => (
        <div 
          key={token.mint}
          onClick={() => onSelectToken?.(token.mint)}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer group transition-colors animate-in fade-in slide-in-from-left duration-300 border border-transparent hover:border-border"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Star className="w-3 h-3 text-muted-foreground group-hover:text-yellow-500 transition-colors shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate">{token.symbol}</span>
                <span className="text-[10px] text-muted-foreground truncate w-16">{token.mint.slice(0, 4)}...</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-mono">{token.price.toFixed(9)}</div>
            <div className={`text-[10px] flex items-center justify-end gap-1 ${token.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {token.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(token.change).toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const WatchlistSidebar = memo(WatchlistSidebarComponent);
