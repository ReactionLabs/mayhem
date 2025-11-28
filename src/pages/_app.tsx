import '@/styles/globals.css';
import { Adapter, UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import type { AppProps } from 'next/app';
import { Toaster } from 'sonner';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWindowWidthListener } from '@/lib/device';
import { ThemeProvider } from 'next-themes';
import { PumpStreamProvider } from '@/contexts/PumpStreamProvider';
import { WalletManagerProvider } from '@/contexts/WalletManagerContext';
import { ManiaFeedProvider } from '@/contexts/ManiaFeedProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

/**
 * App Providers Component
 * 
 * Wallet-only authentication using Jupiter's Unified Wallet Adapter.
 * Users connect their Solana wallet (Phantom, Solflare, etc.) to access the platform.
 */
export default function App({ Component, pageProps }: AppProps) {
  const wallets = useMemo(() => {
    return [new PhantomWalletAdapter(), new SolflareWalletAdapter()].filter(
      (item) => item && item.name && item.icon
    );
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  useWindowWidthListener();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <style jsx global>{`
          :root {
            --font-inter: ${inter.style.fontFamily};
          }
          body {
            font-family: var(--font-inter), sans-serif;
          }
        `}</style>
        <ErrorBoundary>
          <UnifiedWalletProvider
            wallets={wallets}
            config={{
              env: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'mainnet-beta' | 'devnet') || 'mainnet-beta',
              autoConnect: true,
              metadata: {
                name: 'Mayhem',
                description: 'Pump.fun Token Launchpad & Trading Platform',
                url: typeof window !== 'undefined' ? window.location.origin : 'https://mayhem.vercel.app',
                iconUrls: typeof window !== 'undefined' ? [`${window.location.origin}/favicon.ico`] : ['/favicon.ico'],
              },
              theme: 'dark',
              lang: 'en',
            }}
          >
            <WalletManagerProvider>
              <PumpStreamProvider>
                <ManiaFeedProvider>
                  <Toaster />
                  <Component {...pageProps} />
                </ManiaFeedProvider>
              </PumpStreamProvider>
            </WalletManagerProvider>
          </UnifiedWalletProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
