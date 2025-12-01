import ExploreGrid from './ExploreGrid';
import { DataStreamProvider } from '@/contexts/DataStreamProvider';
import { ExploreMsgHandler } from './ExploreMsgHandler';
import { ExploreProvider } from '@/contexts/ExploreProvider';
import { PropsWithChildren, useEffect } from 'react';
import { PumpFeedProvider } from '@/contexts/PumpFeedProvider';

const Explore = () => {
  return (
    <ExploreContext>
      <div className="py-8">
        <ExploreGrid className="flex-1" />
      </div>
    </ExploreContext>
  );
};

const ExploreContext = ({ children }: PropsWithChildren) => {
  if (process.env.NODE_ENV === 'development') {
    // Runtime check to ensure all providers are defined
    // eslint-disable-next-line no-console
    console.log('[ExploreContext] mounts with providers:', {
      ExploreProvider,
      DataStreamProvider,
      PumpFeedProvider,
      ExploreMsgHandler,
    });
  }

  return (
    <div className="flex flex-col h-full">
      <ExploreMsgHandler />

      <ExploreProvider>
        <DataStreamProvider>
          <PumpFeedProvider>{children}</PumpFeedProvider>
        </DataStreamProvider>
      </ExploreProvider>
    </div>
  );
};

export default Explore;
