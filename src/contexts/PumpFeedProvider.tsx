import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePumpStream } from './PumpStreamProvider';
import { Launchpad, Pool } from '@/components/Explore/types';
import { saveTokenToCSV, TokenRecord } from '@/lib/csv-tracker';

const STORAGE_KEY = 'pump_feed_cache_v1';
const MAX_POOL_CACHE = 60;

type PumpFeedContextValue = {
  pools: Pool[];
};

const PumpFeedContext = createContext<PumpFeedContextValue | null>(null);

export const PumpFeedProvider = ({ children }: { children: React.ReactNode }) => {
  const { subscribeNewTokens, subscribeTokenTrades, lastCreateEvent, lastTradeEvent, isConnected } =
    usePumpStream();
  const [pools, setPools] = useState<Pool[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPools(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to restore pump feed cache', error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pools.slice(0, MAX_POOL_CACHE)));
    } catch (error) {
      console.warn('Failed to persist pump feed cache', error);
    }
  }, [pools, hasHydrated]);

  useEffect(() => {
    if (isConnected) {
      subscribeNewTokens();
    }
  }, [isConnected, subscribeNewTokens]);

  const resolveMetadataImage = useCallback(async (uri: string | undefined) => {
    if (!uri) return null;
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data?.image || data?.logo || data?.imageUrl || null;
    } catch (error) {
      console.warn('Failed to resolve metadata image', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!lastCreateEvent) return;

    const timestamp = new Date().toISOString();
    // Initial buy-in is the SOL amount used to create the token (initialBuy field)
    const initialBuyInSOL = lastCreateEvent.initialBuy || 0;
    const initialBuyInUSD = initialBuyInSOL * 200; // Assuming 1 SOL = $200
    const initialMarketCapSOL = lastCreateEvent.marketCapSol || 0;
    const initialMarketCapUSD = initialMarketCapSOL * 200;

    // Save to CSV for analytics
    const csvRecord: TokenRecord = {
      timestamp,
      name: lastCreateEvent.name || 'Unknown',
      ticker: lastCreateEvent.symbol || 'UNKNOWN',
      contractAddress: lastCreateEvent.mint,
      initialBuyInSOL,
      initialBuyInUSD,
      initialMarketCapSOL,
      initialMarketCapUSD,
      metadataUri: lastCreateEvent.uri,
    };

    // Save asynchronously - don't block UI
    saveTokenToCSV(csvRecord).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to save token to CSV:', error);
      }
    });

    const newPool: Pool = {
      id: lastCreateEvent.mint,
      chain: 'solana',
      dex: 'pump.fun',
      type: 'pump',
      createdAt: timestamp,
      bondingCurve: 0,
      volume24h: 0,
      isUnreliable: false,
      updatedAt: timestamp,
      baseAsset: {
        id: lastCreateEvent.mint,
        name: lastCreateEvent.name,
        symbol: lastCreateEvent.symbol,
        icon: lastCreateEvent.uri,
        decimals: 6,
        tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        mcap: initialMarketCapUSD,
        liquidity: initialBuyInUSD,
        usdPrice: 0,
        launchpad: Launchpad.PUMPFUN,
      },
      streamed: true,
    };

    setPools((prev) => {
      if (prev.some((pool) => pool.id === newPool.id)) return prev;
      return [newPool, ...prev].slice(0, MAX_POOL_CACHE);
    });

    subscribeTokenTrades([lastCreateEvent.mint]);

    (async () => {
      const resolved = await resolveMetadataImage(lastCreateEvent.uri);
      if (resolved) {
        setPools((prev) =>
          prev.map((pool) =>
            pool.id === lastCreateEvent.mint
              ? {
                  ...pool,
                  baseAsset: {
                    ...pool.baseAsset,
                    icon: resolved,
                  },
                }
              : pool
          )
        );
      }
    })();
  }, [lastCreateEvent, subscribeTokenTrades, resolveMetadataImage]);

  useEffect(() => {
    if (!lastTradeEvent) return;
    setPools((prev) =>
      prev.map((pool) => {
        if (pool.id === lastTradeEvent.mint) {
          return {
            ...pool,
            updatedAt: new Date().toISOString(),
            bondingCurve: (lastTradeEvent.marketCapSol / 85) * 100,
            baseAsset: {
              ...pool.baseAsset,
              mcap: lastTradeEvent.marketCapSol * 200,
              liquidity: lastTradeEvent.vSolInBondingCurve * 200,
            },
          };
        }
        return pool;
      })
    );
  }, [lastTradeEvent]);

  const value = useMemo(() => ({ pools }), [pools]);

  return <PumpFeedContext.Provider value={value}>{children}</PumpFeedContext.Provider>;
};

export const usePumpFeed = () => {
  const ctx = useContext(PumpFeedContext);
  if (!ctx) {
    throw new Error('usePumpFeed must be used within PumpFeedProvider');
  }
  return ctx;
};


