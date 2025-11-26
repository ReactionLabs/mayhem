import React from 'react';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from './ui/button';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { shortenAddress } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Input } from './ui/input';
import { Search, User, LogOut, Wallet, Copy, Settings, Coins } from 'lucide-react';
import { useConnection } from '@jup-ag/wallet-adapter';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { toast } from 'sonner';
import { debounce } from '@/lib/debounce';

/**
 * Header Component
 * 
 * Integrates Clerk (identity) and Solana wallets (blockchain) as first-class features.
 * - Clerk handles authentication and user sessions
 * - Wallets handle blockchain address ownership and transaction signing
 * - Both are displayed side-by-side in the header for native UX
 */
export const Header = () => {
  // Clerk: Identity and session management
  const { user, isSignedIn } = useUser();
  
  // Solana Wallet: Blockchain connection
  const walletContext = useUnifiedWalletContext();
  const wallet = useWallet();
  const setShowModal = walletContext?.setShowModal;
  const disconnect = wallet.disconnect;
  const publicKey = wallet.publicKey;
  
  const walletAddress = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const router = useRouter();
  const { connection } = useConnection();
  const [globalSearch, setGlobalSearch] = useState('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showSolValue, setShowSolValue] = useState(false);

  // Fetch SOL balance for connected wallet
  useEffect(() => {
    if (!publicKey || !connection) {
      setSolBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch balance:', error);
        }
        setSolBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleConnectWallet = () => {
    if (setShowModal) {
      setShowModal();
    }
  };

  // Debounced search handler - only executes after user stops typing
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      // Check if it looks like a Solana address (base58, 32-44 chars)
      const isLikelyAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(searchTerm);
      
      if (isLikelyAddress) {
        // Direct navigation for addresses
        router.push(`/token/${searchTerm}`);
        setGlobalSearch('');
        return;
      }

      // For name searches, try to find token
      // Only attempt API search if fetch is available and we're in browser
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced timeout
          
          try {
            const response = await Promise.race([
              fetch(`/api/search-token?q=${encodeURIComponent(searchTerm)}`, {
                signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json',
                },
              }),
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 2000)
              ),
            ]).catch(() => null); // Catch all errors silently
            
            clearTimeout(timeoutId);
            
            if (response && 'ok' in response && response.ok) {
              try {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                  throw new Error('Response is not JSON');
                }
                const data = await response.json();
                if (data && data.token) {
                  router.push(`/token/${data.token.baseAsset.id}`);
                  setGlobalSearch('');
                  return;
                }
              } catch (jsonError) {
                // Silently fail JSON parsing
              }
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            // Silently fail - just try direct navigation
          }
        } catch (error) {
          // Silently fail - just try direct navigation
        }
      }

      // If API search fails or fetch unavailable, try direct navigation
      router.push(`/token/${searchTerm}`);
      setGlobalSearch('');
    } catch (error) {
      // Fallback: try direct navigation anyway
      try {
        router.push(`/token/${searchTerm}`);
        setGlobalSearch('');
      } catch (routerError) {
        // Last resort: do nothing
      }
    }
  }, [router]);

  // Debounce search with 500ms delay
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 500),
    [performSearch]
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = globalSearch.trim();
    if (!searchTerm) return;
    performSearch(searchTerm);
  }, [globalSearch, performSearch]);

  // Handle input change with debouncing for better UX
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalSearch(value);
    // Auto-search on Enter or after debounce (for better UX)
  }, []);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard');
    }
  };


  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      {/* Logo Section */}
      <Link href="/" className="flex items-center shrink-0 mr-4">
        <span className="whitespace-nowrap text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
          Mayhem
        </span>
      </Link>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="hidden md:flex items-center relative max-w-md w-full mx-4">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search by name or contract address (CA)..." 
          className="pl-9 bg-secondary/50 border-none h-10 w-full focus-visible:ring-1 focus-visible:ring-primary"
        />
      </form>

      {/* Navigation and Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Wallet Balance Display (if wallet connected) */}
        {walletAddress && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/40 cursor-pointer select-none transition hover:bg-secondary/60"
            onMouseEnter={() => setShowSolValue(true)}
            onMouseLeave={() => setShowSolValue(false)}
            title="SOL Balance"
          >
            {/* SOL Logo */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
              SOL
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Balance
              </span>
              <span className="font-semibold text-sm">
                {isLoadingBalance ? (
                  '...'
                ) : solBalance !== null ? (
                  `${solBalance.toFixed(3)} SOL`
                ) : (
                  '--'
                )}
              </span>
            </div>
          </div>
        )}

        <ThemeToggle />

        {/* Clerk Identity Section */}
        {!isSignedIn ? (
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        ) : (
          <UserButton 
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        )}

        {/* Solana Wallet Section */}
        {walletAddress ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-primary/20 hover:bg-primary/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {shortenAddress(walletAddress)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/portfolio')}>
                <User className="mr-2 h-4 w-4" />
                Portfolio & Tools
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/my-tokens')}>
                <Coins className="mr-2 h-4 w-4" />
                My Tokens
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleConnectWallet}>
                <Wallet className="mr-2 h-4 w-4" />
                Change Wallet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => disconnect?.()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={handleConnectWallet}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden md:block">Connect Wallet</span>
            <span className="block md:hidden">Connect</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
