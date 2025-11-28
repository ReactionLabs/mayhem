import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { categorySortBy, categorySortDir, createPoolSorter } from '@/components/Explore/pool-utils';
import { ApeQueries, GemsTokenListQueryArgs, QueryData } from '@/components/Explore/queries';
import { ExploreTab, TokenListSortByField, normalizeSortByField, Pool, Launchpad } from '@/components/Explore/types';
import { TokenCardList } from '@/components/TokenCard/TokenCardList';
import { useExploreGemsTokenList } from '@/hooks/useExploreGemsTokenList';
import { EXPLORE_FIXED_TIMEFRAME, useExplore } from '@/contexts/ExploreProvider';
import { isHoverableDevice, useBreakpoint } from '@/lib/device';
import { PausedIndicator } from './PausedIndicator';
import { usePumpStream } from '@/contexts/PumpStreamProvider';
import { Input } from '@/components/ui/input';
import { Search, Filter, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ExploreColumnProps = {
  tab: ExploreTab;
  onSelectToken?: (mint: string) => void;
};

export const ExploreTabTitleMap: Record<ExploreTab, string> = {
  [ExploreTab.NEW]: `New`,
  [ExploreTab.GRADUATING]: `Soon`,
  [ExploreTab.GRADUATED]: `Bonded`,
};

const ALL_SOURCES = [
  { id: Launchpad.PUMPFUN, label: 'Pump.fun' },
  // { id: Launchpad.LETSBONKFUN, label: 'Bonk.fun' },
  // { id: 'met-dbc', label: 'Meteora' },
];

export const ExploreColumn: React.FC<ExploreColumnProps> = ({ tab, onSelectToken }) => {
  const { pausedTabs, setTabPaused, request } = useExplore();
  const isPaused = pausedTabs[tab];
  const setIsPaused = useCallback(
    (paused: boolean) => setTabPaused(tab, paused),
    [setTabPaused, tab]
  );

  const [searchTerm, setSearchTerm] = useState('');
  // Default exclude non-pump sources if we want to hide them, 
  // but actually we will just NOT merge the currentData (Meteora) in the container below.
  const [excludedSources, setExcludedSources] = useState<string[]>([]);

  const toggleSource = (sourceId: string) => {
    setExcludedSources((prev) => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId) 
        : [...prev, sourceId]
    );
  };

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-300px)]">
      {/* Desktop Column Header */}
      <div className="flex flex-col p-3 max-lg:hidden gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <h2 className="font-bold text-neutral-300">{ExploreTabTitleMap[tab]}</h2>
            {isPaused && <PausedIndicator />}
          </div>
          
          {/* Filter Dropdown */}
          {/* Hidden for now as we only show Pump.fun */}
          {/* <DropdownMenu> ... </DropdownMenu> */}
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-neutral-900/50 border-neutral-800 h-9 text-xs"
          />
        </div>
        
        {/* Advanced Filters - Pass filters to container */}
        {/* Filters are applied in TokenCardListContainer */}
      </div>

      {/* List */}
      <div className="relative flex-1 border-neutral-850 text-xs lg:border-t h-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-2 bg-gradient-to-b from-neutral-950 to-transparent" />
        <TokenCardListContainer
          tab={tab}
          request={request}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          searchTerm={searchTerm}
          excludedSources={excludedSources}
          onSelectToken={onSelectToken}
        />
      </div>
    </div>
  );
};

type TokenCardListContainerProps = {
  tab: ExploreTab;
  request: Required<GemsTokenListQueryArgs>;
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
  searchTerm: string;
  excludedSources: string[];
  onSelectToken?: (mint: string) => void;
};

const timeframe = EXPLORE_FIXED_TIMEFRAME;

const TokenCardListContainer: React.FC<TokenCardListContainerProps> = memo(
  ({ tab, request, isPaused, setIsPaused, searchTerm, excludedSources, onSelectToken, filters: externalFilters }) => {
    const queryClient = useQueryClient();
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'md' || breakpoint === 'sm' || breakpoint === 'xs';

    const listRef = useRef<HTMLDivElement>(null);

    // Original Meteora Data - DISABLED for now as per user request
    // const { data: currentData, status } = useExploreGemsTokenList((data) => data[tab]);

    // PumpPortal WebSocket Integration - Real-time data from Pump.fun & Bonk
    // Reference: https://pumpportal.fun/data-api/real-time
    const { 
      subscribeNewTokens, 
      subscribeMigrations,
      lastCreateEvent, 
      lastTradeEvent,
      lastMigrationEvent,
      isConnected, 
      subscribeTokenTrades 
    } = usePumpStream();
    const [pumpPools, setPumpPools] = useState<Pool[]>([]);
    // Use external filters if provided, otherwise use searchTerm for basic filtering
    const filters = externalFilters || {};

    useEffect(() => {
      if (isConnected) {
        subscribeNewTokens(); // Subscribe to Pump.fun new tokens
        subscribeMigrations(); // Subscribe to Bonk migration events
      }
    }, [isConnected, subscribeNewTokens, subscribeMigrations]);

    const resolveMetadataImage = useCallback(async (uri: string | undefined) => {
      if (!uri) return { image: null, socials: null };
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          return { image: null, socials: null };
        }
        const data = await response.json();
        const image = data?.image || data?.logo || data?.imageUrl || null;
        
        // Extract social links from metadata
        const socials = {
          website: data?.website || data?.extensions?.website || null,
          twitter: data?.twitter || data?.extensions?.twitter || data?.twitter_url || null,
          telegram: data?.telegram || data?.extensions?.telegram || data?.telegram_url || null,
        };
        
        return { image, socials };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to resolve metadata', error);
        }
        return { image: null, socials: null };
      }
    }, []);

    // Handle New Token Creation (Pump.fun & Bonk)
    useEffect(() => {
      if (lastCreateEvent) {
        // Apply filters before adding token
        const mcapSol = lastCreateEvent.marketCapSol;
        const initialBuy = lastCreateEvent.initialBuy;
        const bondingCurve = (mcapSol / 85) * 100; // Approximate bonding curve progress
        
        // Filter checks
        if (filters.minMarketCap && mcapSol < filters.minMarketCap) return;
        if (filters.maxMarketCap && mcapSol > filters.maxMarketCap) return;
        if (filters.minInitialBuy && initialBuy < filters.minInitialBuy) return;
        if (filters.pool && filters.pool !== 'all' && lastCreateEvent.pool !== filters.pool) return;
        if (filters.minBondingCurve && bondingCurve < filters.minBondingCurve) return;
        if (filters.maxBondingCurve && bondingCurve > filters.maxBondingCurve) return;
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          if (!lastCreateEvent.name.toLowerCase().includes(term) && 
              !lastCreateEvent.symbol.toLowerCase().includes(term) &&
              !lastCreateEvent.mint.toLowerCase().includes(term)) {
            return;
          }
        }

        const poolType = lastCreateEvent.pool || 'pump';
        const newPool: Pool = {
          id: lastCreateEvent.mint,
          chain: 'solana',
          dex: poolType === 'bonk' ? 'bonk.fun' : 'pump.fun',
          type: poolType,
          createdAt: new Date().toISOString(),
          bondingCurve: bondingCurve,
          volume24h: 0,
          isUnreliable: false,
          updatedAt: new Date().toISOString(),
          baseAsset: {
            id: lastCreateEvent.mint,
            name: lastCreateEvent.name,
            symbol: lastCreateEvent.symbol,
            icon: lastCreateEvent.uri, 
            decimals: 6,
            tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            mcap: lastCreateEvent.marketCapSol * 200, 
            liquidity: lastCreateEvent.vSolInBondingCurve * 200,
            usdPrice: 0,
            launchpad: poolType === 'bonk' ? Launchpad.LETSBONKFUN : Launchpad.PUMPFUN,
          },
          streamed: true,
        };

        setPumpPools((prev) => {
          if (prev.some((p) => p.id === newPool.id)) return prev;
          // Remove limit to allow endless streaming
          return [newPool, ...prev];
        });
        
        subscribeTokenTrades([lastCreateEvent.mint]);

        // Resolve metadata image and social links immediately
        (async () => {
          try {
            const { image, socials } = await resolveMetadataImage(lastCreateEvent.uri);
            setPumpPools((prev) =>
              prev.map((pool) =>
                pool.id === lastCreateEvent.mint
                  ? {
                      ...pool,
                      baseAsset: {
                        ...pool.baseAsset,
                        icon: image || (lastCreateEvent.uri && (lastCreateEvent.uri.startsWith('http') || lastCreateEvent.uri.startsWith('ipfs://')) ? lastCreateEvent.uri : pool.baseAsset.icon),
                        website: socials?.website || pool.baseAsset.website,
                        twitter: socials?.twitter || pool.baseAsset.twitter,
                        telegram: socials?.telegram || pool.baseAsset.telegram,
                      },
                    }
                  : pool
              )
            );
          } catch (error) {
            // Silently fail - will show placeholder image
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to resolve metadata for', lastCreateEvent.mint, error);
            }
          }
        })();
      }
    }, [lastCreateEvent, subscribeTokenTrades, resolveMetadataImage, filters]);

    // Handle Migration Events (Bonk tokens graduating)
    useEffect(() => {
      if (lastMigrationEvent) {
        // Update pool status when token migrates
        setPumpPools((prev) =>
          prev.map((pool) =>
            pool.id === lastMigrationEvent.mint
              ? {
                  ...pool,
                  updatedAt: new Date().toISOString(),
                  // Mark as migrated/graduated
                }
              : pool
          )
        );
      }
    }, [lastMigrationEvent]);

    // Handle Trades (Updates)
    useEffect(() => {
      if (lastTradeEvent) {
        setPumpPools((prev) => {
          return prev.map((pool) => {
            if (pool.id === lastTradeEvent.mint) {
              return {
                ...pool,
                updatedAt: new Date().toISOString(),
                bondingCurve: (lastTradeEvent.marketCapSol / 85) * 100,
                baseAsset: {
                  ...pool.baseAsset,
                  mcap: lastTradeEvent.marketCapSol * 200,
                  liquidity: lastTradeEvent.vSolInBondingCurve * 200,
                }
              };
            }
            return pool;
          });
        });
      }
    }, [lastTradeEvent]);

    // Filter Pump Pools based on Tab
    const filteredPumpPools = pumpPools.filter((pool) => {
      const mcapUsd = pool.baseAsset.mcap || 0;

      if (tab === ExploreTab.NEW) return true;

      if (tab === ExploreTab.GRADUATING) {
        return mcapUsd >= 40000 && mcapUsd < 80000;
      }

      if (tab === ExploreTab.GRADUATED) {
        return mcapUsd >= 80000;
      }

      return false;
    });

    const [snapshotData, setSnapshotData] = useState<Pool[]>();

    const handleMouseEnter = useCallback(() => {
      if (!isHoverableDevice()) return;

      if (!isPaused) {
        // ONLY Pump Pools
        const combined = [...filteredPumpPools];
        setSnapshotData(combined);
      }
      setIsPaused(true);
    }, [filteredPumpPools, isPaused, setIsPaused]);

    const handleMouseLeave = useCallback(() => {
      if (!isHoverableDevice()) return;
      setIsPaused(false);
    }, [setIsPaused]);

    const handleScroll = useCallback(() => {
      if (!isMobile || !listRef.current) return;

      const top = listRef.current.getBoundingClientRect().top;

      if (top <= 0) {
        if (!isPaused) {
          const combined = [...filteredPumpPools];
          setSnapshotData(combined);
        }
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    }, [filteredPumpPools, isPaused, setIsPaused, isMobile]);

    useEffect(() => {
      if (!isMobile) return;
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        setIsPaused(false);
      };
    }, [isMobile, setIsPaused, handleScroll]);

    // ONLY use Pump Data
    const finalCurrentData = [...filteredPumpPools];
    
    const applyFilters = (pools: Pool[]) => {
      let filtered = pools;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
          p.baseAsset.name.toLowerCase().includes(term) || 
          p.baseAsset.symbol.toLowerCase().includes(term) ||
          p.baseAsset.id.toLowerCase().includes(term)
        );
      }
      return filtered;
    };

    const filteredFinalData = applyFilters(finalCurrentData);
    
    const displayData = isPaused
      ? snapshotData?.map((snapshotPool) => {
          const currentPump = filteredPumpPools.find(p => p.id === snapshotPool.id);
          if (currentPump) return currentPump;
          return snapshotPool;
        })
      : filteredFinalData;

    const finalDisplayData = isPaused ? applyFilters(displayData || []) : displayData;

    return (
      <TokenCardList
        ref={listRef}
        data={finalDisplayData}
        status={'success'} // Always success since we stream
        timeframe={timeframe}
        trackPools
        className="lg:h-0 lg:min-h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onSelectToken={onSelectToken}
      />
    );
  }
);

TokenCardListContainer.displayName = 'TokenCardListContainer';
