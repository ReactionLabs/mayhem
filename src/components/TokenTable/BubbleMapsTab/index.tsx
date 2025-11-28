import { useTokenAddress } from '@/hooks/queries';
import { useEffect, useState } from 'react';

export const BubbleMapsTab = () => {
  const tokenAddress = useTokenAddress();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (tokenAddress) {
      setIsLoading(false);
      setHasError(false);
    }
  }, [tokenAddress]);

  if (!tokenAddress) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No token address available</p>
      </div>
    );
  }

  const iframeSrc = `https://iframe.bubblemaps.io/map?address=${tokenAddress}&chain=solana&partnerId=demo`;

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-4 p-8">
          <p className="text-muted-foreground">Failed to load Bubble Maps</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : (
        <iframe
          src={iframeSrc}
          className="w-full h-full min-h-[600px] border-0 rounded-lg"
          title="Bubble Maps"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          allow="clipboard-read; clipboard-write"
        />
      )}
    </div>
  );
};

