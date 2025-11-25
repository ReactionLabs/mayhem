import { TokenPageMsgHandler } from '@/components/Token/TokenPageMsgHandler';
import { TokenChart } from '@/components/TokenChart/TokenChart';
import { TokenDetails } from '@/components/TokenHeader/TokenDetail';
import { TokenHeader } from '@/components/TokenHeader/TokenHeader';
import { TokenStats } from '@/components/TokenHeader/TokenStats';
import { TokenBottomPanel } from '@/components/TokenTable';
import Page from '@/components/ui/Page/Page';
import { DataStreamProvider, useDataStream } from '@/contexts/DataStreamProvider';
import { TokenChartProvider } from '@/contexts/TokenChartProvider';
import { useTokenAddress, useTokenInfo } from '@/hooks/queries';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { QuickSwap } from '@/components/Swap/QuickSwap'; // Changed from PumpTrade
import { TradeOverlayProvider } from '@/contexts/TradeOverlayContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, ArrowRightLeft } from 'lucide-react';

const Terminal = dynamic(() => import('@/components/Terminal'), { ssr: false });

const SwapWidget = () => {
  const tokenId = useTokenAddress();

  if (!tokenId) {
    return null;
  }

  return <Terminal mint={tokenId} />;
};

export const TokenPageWithContext = () => {
  const tokenId = useTokenAddress();
  const { data: tokenInfo } = useTokenInfo();
  const poolId = tokenInfo?.id;
  const { subscribeTxns, unsubscribeTxns, subscribePools, unsubscribePools } = useDataStream();

  const isPumpToken = !poolId || (tokenInfo as any)?.launchpad === 'pump.fun'; 
  const [activeTab, setActiveTab] = useState(isPumpToken ? 'pump' : 'jupiter');

  useEffect(() => {
    if (isPumpToken) {
        setActiveTab('pump');
    } else {
        setActiveTab('jupiter');
    }
  }, [isPumpToken]);

  // Subscribe to token txns
  useEffect(() => {
    if (!tokenId) {
      return;
    }
    subscribeTxns([tokenId]);
    return () => {
      unsubscribeTxns([tokenId]);
    };
  }, [tokenId, subscribeTxns, unsubscribeTxns]);

  useEffect(() => {
    if (!poolId) {
      return;
    }

    subscribePools([poolId]);
    return () => {
      unsubscribePools([poolId]);
    };
  }, [poolId, subscribePools, unsubscribePools]);

  return (
    <Page>
      <TokenPageMsgHandler />

      <div className="max-h-screen">
        <div className="flex mb-4 rounded-lg border border-neutral-700 p-3">
          <TokenHeader className="max-sm:order-1" />
        </div>

        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          <TradeOverlayProvider>
            <div className="flex flex-col gap-4 mb-8 max-sm:w-full lg:min-w-[400px] max-sm:order-3">
              <TokenDetails />
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
                  <TabsTrigger value="pump" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Zap className="w-4 h-4" /> Quick Swap
                  </TabsTrigger>
                  <TabsTrigger value="jupiter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <ArrowRightLeft className="w-4 h-4" /> Jupiter
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pump" className="mt-2">
                   {tokenId ? <QuickSwap mint={tokenId} /> : <div className="p-4 text-center text-muted-foreground">Loading...</div>}
                </TabsContent>
                
                <TabsContent value="jupiter" className="mt-2">
                   <SwapWidget />
                </TabsContent>
              </Tabs>
            </div>

            <div className={'border-neutral-850 w-full max-sm:order-2'}>
              <TokenStats key={`token-stats-${poolId}`} />

              <div className="flex flex-col h-[300px] lg:h-[500px] w-full">
                <TokenChartProvider>
                  <TokenChart />
                </TokenChartProvider>
              </div>

              <TokenBottomPanel className="flex h-0 min-h-full flex-col overflow-hidden" />
            </div>
          </TradeOverlayProvider>
        </div>
      </div>
    </Page>
  );
};

export default function TokenPage() {
  return (
    <DataStreamProvider>
      <TokenPageWithContext />
    </DataStreamProvider>
  );
}
