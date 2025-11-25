import Head from 'next/head';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { PositionsTable } from '@/components/Dashboard/PositionsTable';
import { ExploreColumn } from '@/components/Explore/ExploreColumn';
import { ExploreTab } from '@/components/Explore/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { TokenChart } from '@/components/TokenChart/TokenChart';
import { TokenChartProvider } from '@/contexts/TokenChartProvider';
import { DataStreamProvider } from '@/contexts/DataStreamProvider';

export default function DashboardPage() {
  const [activeMint, setActiveMint] = useState<string | undefined>(undefined);

  return (
    <DataStreamProvider>
      <Head>
        <title>Pro Terminal - Fun Launch</title>
      </Head>

      <DashboardLayout activeMint={activeMint} onSelectToken={setActiveMint}>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chart / Main Area */}
          <div className="flex-1 min-h-0 flex flex-col">
             {/* Tabbed Interface for Main View */}
             <Tabs defaultValue="chart" className="flex-1 flex flex-col">
               <div className="border-b border-border px-4 pt-2">
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

               <TabsContent value="chart" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                 {activeMint ? (
                    <div className="flex-1 h-full bg-background">
                        <TokenChartProvider>
                            {/* Note: TokenChart typically reads ID from URL query, we might need to adapt it to accept a prop or we push router state */}
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                {/* Placeholder until Chart component accepts direct props, or we sync URL */}
                                <div className="text-center">
                                    <p className="mb-2">Active Token: <span className="font-mono font-bold text-primary">{activeMint}</span></p>
                                    <p className="text-xs opacity-50">(Chart integration pending prop update)</p>
                                </div>
                            </div>
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

               <TabsContent value="scanner" className="flex-1 m-0 overflow-hidden flex flex-col">
                  {/* Pass setActiveMint to ExploreColumn so clicking a row selects it */}
                  <ExploreColumn tab={ExploreTab.NEW} />
               </TabsContent>
             </Tabs>
          </div>

          {/* Bottom Panel */}
          <PositionsTable />
        </div>
      </DashboardLayout>
    </DataStreamProvider>
  );
}
