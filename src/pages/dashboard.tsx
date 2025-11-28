import Head from 'next/head';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { PositionsTable } from '@/components/Dashboard/PositionsTable';
import { ExploreColumn } from '@/components/Explore/ExploreColumn';
import { ExploreTab } from '@/components/Explore/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { TokenChart } from '@/components/TokenChart/TokenChart';
import { TokenChartProvider } from '@/contexts/TokenChartProvider';
import { DataStreamProvider } from '@/contexts/DataStreamProvider';
import { useRouter } from 'next/router';
import { TradingCompanion } from '@/components/Dashboard/TradingCompanion';
import { useQuery } from '@tanstack/react-query';
import { ApeQueries } from '@/components/Explore/queries';

export default function DashboardPage() {
  const router = useRouter();
  const [activeMint, setActiveMint] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('chart');
  
  // Fetch token info for AI companion
  const { data: tokenInfo } = useQuery({
    ...ApeQueries.tokenInfo({ id: activeMint || '' }),
    refetchInterval: 60 * 1000,
    enabled: !!activeMint,
  });

  // Sync router query with activeMint so chart can read it
  useEffect(() => {
    if (activeMint) {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, tokenId: activeMint },
        },
        undefined,
        { shallow: true }
      );
      // Switch to chart tab when token is selected
      setActiveTab('chart');
    } else {
      // Remove tokenId from query if no active mint
      const { tokenId, ...restQuery } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: restQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [activeMint, router]);

  return (
    <DataStreamProvider>
      <Head>
        <title>Pro Terminal - Fun Launch</title>
      </Head>

      <DashboardLayout activeMint={activeMint} onSelectToken={setActiveMint}>
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Chart / Main Area - Takes remaining space */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
             {/* Tabbed Interface for Main View */}
             <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
               <div className="flex-shrink-0 border-b border-border px-4 pt-2">
                 <TabsList className="bg-transparent p-0 h-auto space-x-4">
                   <TabsTrigger 
                     value="chart"
                     className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-xs font-bold uppercase tracking-wider"
                   >
                     Chart
                   </TabsTrigger>
                   <TabsTrigger 
                     value="scanner" 
                     className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-xs font-bold uppercase tracking-wider"
                   >
                     Scanner
                   </TabsTrigger>
                 </TabsList>
               </div>

               <TabsContent value="chart" className="flex-1 p-0 m-0 overflow-hidden flex flex-col min-h-0">
                 {activeMint ? (
                    <div className="flex-1 w-full h-full min-h-0 max-h-full bg-background overflow-hidden">
                        <TokenChartProvider>
                            <TokenChart renderingId={activeMint} />
                        </TokenChartProvider>
                    </div>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/5 border-dashed border-border">
                        <div className="text-center">
                            <p className="text-muted-foreground text-sm mb-2">Select a token from the watchlist to start trading</p>
                            <p className="text-xs text-muted-foreground/50">Live data feed is active</p>
                        </div>
                    </div>
                 )}
               </TabsContent>

               <TabsContent value="scanner" className="flex-1 m-0 overflow-hidden flex flex-col min-h-0">
                  {/* Pass setActiveMint to ExploreColumn so clicking a row selects it */}
                  <ExploreColumn tab={ExploreTab.NEW} onSelectToken={setActiveMint} />
               </TabsContent>
             </Tabs>
          </div>

          {/* Bottom Panel - Fixed height at bottom */}
          <div className="flex-shrink-0">
            <PositionsTable />
          </div>
        </div>
        
        {/* AI Trading Companion */}
        <TradingCompanion
          activeMint={activeMint}
          tokenName={tokenInfo?.baseAsset?.name || tokenInfo?.baseAsset?.symbol}
          currentPrice={tokenInfo?.baseAsset?.usdPrice}
          priceChange24h={tokenInfo?.baseAsset?.stats24h?.priceChange}
          volume24h={tokenInfo?.baseAsset?.stats24h ? 
            (tokenInfo.baseAsset.stats24h.buyVolume || 0) + (tokenInfo.baseAsset.stats24h.sellVolume || 0) 
            : undefined}
          marketCap={tokenInfo?.baseAsset?.mcap}
        />
      </DashboardLayout>
    </DataStreamProvider>
  );
}
