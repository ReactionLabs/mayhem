/**
 * Real-time PnL Hook
 * Tracks user's token positions and calculates profit/loss in real-time
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@jup-ag/wallet-adapter';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { jupiterService } from '@/services/api/jupiter';

export type TokenPosition = {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  entryPrice: number; // Average entry price in USD
  currentPrice: number; // Current price in USD
  value: number; // Current value in USD
  pnl: number; // Profit/Loss in USD
  pnlPercent: number; // Profit/Loss percentage
  lastUpdate: number;
};

type UseRealTimePnLReturn = {
  positions: TokenPosition[];
  totalPnL: number;
  totalPnLPercent: number;
  totalValue: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ENTRY_PRICE_STORAGE_KEY = 'token_entry_prices';

/**
 * Get or calculate entry price for a token
 * Stores entry prices in localStorage based on first purchase
 */
function getEntryPrice(mint: string, currentPrice: number): number {
  if (typeof window === 'undefined') return currentPrice;
  
  try {
    const stored = localStorage.getItem(ENTRY_PRICE_STORAGE_KEY);
    const entryPrices = stored ? JSON.parse(stored) : {};
    
    // If we have a stored entry price, use it
    if (entryPrices[mint]) {
      return entryPrices[mint];
    }
    
    // Otherwise, use current price as entry (first time seeing this token)
    entryPrices[mint] = currentPrice;
    localStorage.setItem(ENTRY_PRICE_STORAGE_KEY, JSON.stringify(entryPrices));
    return currentPrice;
  } catch {
    return currentPrice;
  }
}

/**
 * Update entry price when user buys more tokens (weighted average)
 */
export function updateEntryPrice(mint: string, newAmount: number, newPrice: number, existingAmount: number, existingEntryPrice: number): number {
  if (typeof window === 'undefined') return newPrice;
  
  try {
    const totalAmount = existingAmount + newAmount;
    if (totalAmount === 0) return newPrice;
    
    // Weighted average: (existingAmount * existingPrice + newAmount * newPrice) / totalAmount
    const weightedPrice = (existingAmount * existingEntryPrice + newAmount * newPrice) / totalAmount;
    
    const stored = localStorage.getItem(ENTRY_PRICE_STORAGE_KEY);
    const entryPrices = stored ? JSON.parse(stored) : {};
    entryPrices[mint] = weightedPrice;
    localStorage.setItem(ENTRY_PRICE_STORAGE_KEY, JSON.stringify(entryPrices));
    
    return weightedPrice;
  } catch {
    return newPrice;
  }
}

export function useRealTimePnL(): UseRealTimePnLReturn {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [positions, setPositions] = useState<TokenPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!publicKey || !connection) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get all token accounts owned by the user
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      if (tokenAccounts.value.length === 0) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

      // Extract token mints and balances
      const tokenMints = tokenAccounts.value
        .map(account => {
          const parsedInfo = account.account.data.parsed.info;
          const mint = parsedInfo.mint;
          const balance = parsedInfo.tokenAmount.uiAmount || 0;
          const decimals = parsedInfo.tokenAmount.decimals;
          
          // Filter out zero balances
          if (balance === 0 || balance === null) return null;
          
          return { mint, balance, decimals };
        })
        .filter((item): item is { mint: string; balance: number; decimals: number } => item !== null);

      if (tokenMints.length === 0) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

      // Fetch prices for all tokens in parallel
      const prices = await jupiterService.getTokenPrices(tokenMints.map(t => t.mint));

      // Build positions array
      const positionsData: TokenPosition[] = tokenMints
        .map(({ mint, balance, decimals }) => {
          const priceData = prices[mint];
          const currentPrice = priceData?.price || 0;
          
          // Get entry price from storage
          const entryPrice = getEntryPrice(mint, currentPrice);
          
          // Calculate value and PnL
          const value = balance * currentPrice;
          const costBasis = balance * entryPrice;
          const pnl = value - costBasis;
          const pnlPercent = entryPrice > 0 ? (pnl / costBasis) * 100 : 0;

          // Try to get token metadata (name/symbol) from price data or use mint
          const symbol = priceData?.mintSymbol || mint.slice(0, 4).toUpperCase();
          const name = priceData?.mintSymbol || symbol;

          return {
            mint,
            symbol,
            name,
            balance,
            decimals,
            entryPrice,
            currentPrice,
            value,
            pnl,
            pnlPercent,
            lastUpdate: Date.now(),
          };
        })
        .filter(pos => pos.currentPrice > 0) // Only include tokens with valid prices
        .sort((a, b) => b.value - a.value); // Sort by value descending

      setPositions(positionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching positions:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  // Initial fetch
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Refresh prices every 10 seconds
  useEffect(() => {
    if (!publicKey || !connection || positions.length === 0) return;

    const refreshPrices = async () => {
      try {
        const mints = positions.map(p => p.mint);
        const prices = await jupiterService.getTokenPrices(mints);

        setPositions(prev => prev.map(pos => {
          const priceData = prices[pos.mint];
          if (!priceData) return pos; // Keep existing data if no new price
          
          const currentPrice = priceData.price || pos.currentPrice;
          
          const value = pos.balance * currentPrice;
          const costBasis = pos.balance * pos.entryPrice;
          const pnl = value - costBasis;
          const pnlPercent = pos.entryPrice > 0 ? (pnl / costBasis) * 100 : 0;

          return {
            ...pos,
            currentPrice,
            value,
            pnl,
            pnlPercent,
            lastUpdate: Date.now(),
          };
        }));
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error refreshing prices:', err);
        }
      }
    };

    const interval = setInterval(refreshPrices, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [publicKey, connection, positions.length]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalCostBasis = positions.reduce((sum, pos) => sum + (pos.balance * pos.entryPrice), 0);
    const totalPnL = totalValue - totalCostBasis;
    const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return {
      totalValue,
      totalPnL,
      totalPnLPercent,
    };
  }, [positions]);

  return {
    positions,
    totalPnL: totals.totalPnL,
    totalPnLPercent: totals.totalPnLPercent,
    totalValue: totals.totalValue,
    isLoading,
    error,
    refresh: fetchPositions,
  };
}

