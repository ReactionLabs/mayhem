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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClerkProvider } from '@clerk/nextjs';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

/**
 * App Providers Component
 * 
 * This component wraps the app with all necessary providers:
 * - ClerkProvider: Identity and session management (outer layer)
 * - UnifiedWalletProvider: Solana wallet connection (inner layer)
 * 
 * This pattern keeps Clerk as the base identity layer and Web3 wallets
 * as a first-class native feature for blockchain interactions.
 */
export default function App({ Component, pageProps }: AppProps) {
  const wallets: Adapter[] = useMemo(() => {
    return [new PhantomWalletAdapter(), new SolflareWalletAdapter()].filter(
      (item) => item && item.name && item.icon
    ) as Adapter[];
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  useWindowWidthListener();

  return (
    <ClerkProvider>
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
                  <Toaster />
                  <Component {...pageProps} />
                </PumpStreamProvider>
              </WalletManagerProvider>
            </UnifiedWalletProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
