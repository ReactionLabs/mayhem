import React from 'react';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
// Clerk removed - wallet-only authentication
import Link from 'next/link';
import { Button } from './ui/button';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { shortenAddress } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Input } from './ui/input';
import { Search, User, LogOut, Wallet, Copy, Settings, Coins } from 'lucide-react';
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
 * Wallet-only authentication using Jupiter's Unified Wallet Adapter.
 * Users connect their Solana wallet to access the platform.
 */
export const Header = () => {
  // Solana Wallet: Blockchain connection
  const walletContext = useUnifiedWalletContext();
  const wallet = useWallet();
  const setShowModal = walletContext?.setShowModal;
  const disconnect = wallet.disconnect;
  const publicKey = wallet.publicKey;
  
  const walletAddress = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showSolValue, setShowSolValue] = useState(false);

  // Fetch SOL balance for connected wallet using service layer
  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      setIsLoadingBalance(false);
      return;
    }

    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 2;

    const fetchBalance = async () => {
      if (cancelled) return;
      
      setIsLoadingBalance(true);
      
      try {
        // Use the service layer which handles fallbacks automatically
        const { solanaService } = await import('@/services/blockchain');
        const balance = await solanaService.getBalance(publicKey.toBase58());
        
        if (!cancelled) {
          setSolBalance(balance >= 0 ? balance : 0);
          retryCount = 0; // Reset retry count on success
        }
      } catch (error: any) {
        // Check if it's a 403 error - service layer should handle this, but catch just in case
        const is403 = 
          error?.code === 403 ||
          error?.message?.includes('403') ||
          error?.message?.includes('Access forbidden') ||
          error?.message?.includes('forbidden');
        
        // Only log non-403 errors in development (403s are expected and handled gracefully)
        if (process.env.NODE_ENV === 'development' && !is403) {
          console.error('Failed to fetch balance:', error);
        }
        
        // For 403 errors, set balance to null (unavailable) without retrying
        if (is403 && !cancelled) {
          setSolBalance(null);
          return;
        }
        
        // Retry logic for transient errors (not 403s)
        if (retryCount < maxRetries && !cancelled && !is403) {
          retryCount++;
          setTimeout(() => {
            if (!cancelled) fetchBalance();
          }, 1000 * retryCount); // Exponential backoff
        } else if (!cancelled) {
          // After max retries, set to null to show unavailable
          setSolBalance(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBalance(false);
        }
      }
    };

    // Initial fetch with small delay to avoid race conditions
    const timeoutId = setTimeout(() => {
      fetchBalance();
    }, 300);
    
    // Set up polling interval (refresh every 15 seconds)
    const interval = setInterval(() => {
      if (!cancelled && publicKey) {
        fetchBalance();
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [publicKey]);

  const handleConnectWallet = () => {
    if (setShowModal) {
      setShowModal(true);
      return;
    }
    // Fallback: if unified wallet modal isn't available, attempt adapter's built-in connect flow
    wallet.connect?.().catch(() => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Wallet connect failed');
      }
    });
  };

  // Instant search handler - optimized for paste-to-trade flow
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const trimmed = searchTerm.trim();
    
    // Check if it looks like a Solana address (base58, 32-44 chars)
    // This regex matches Solana addresses more accurately
    const isLikelyAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    
    if (isLikelyAddress) {
      // INSTANT navigation for addresses - no API call needed
      router.push(`/token/${trimmed}`);
      setGlobalSearch('');
      return;
    }

    // For name searches, try API lookup with fast timeout
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // Faster timeout
        
        const response = await Promise.race([
          fetch(`/api/search-token?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          }),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 1000)
          ),
        ]).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response?.ok) {
          try {
            const data = await response.json();
            if (data?.token?.baseAsset?.id) {
              router.push(`/token/${data.token.baseAsset.id}`);
              setGlobalSearch('');
              return;
            }
          } catch {
            // JSON parse failed, continue to fallback
          }
        }
      } catch {
        // API failed, continue to fallback
      }
    }

    // Fallback: try direct navigation (might be a valid address format we didn't catch)
    router.push(`/token/${trimmed}`);
    setGlobalSearch('');
  }, [router]);

  // Debounce only for text searches, not addresses
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      // Skip debounce for addresses - instant navigation
      const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(term.trim());
      if (isAddress) {
        performSearch(term);
      } else {
        performSearch(term);
      }
    }, 300), // Reduced debounce for faster response
    [performSearch]
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = globalSearch.trim();
    if (!searchTerm) return;
    performSearch(searchTerm);
  }, [globalSearch, performSearch]);

  // Handle input change - detect paste events for instant navigation
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalSearch(value);
    
    // Check if this looks like a pasted address (long string matching address pattern)
    const trimmed = value.trim();
    const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    
    // If it's an address, navigate instantly (no debounce)
    if (isAddress && trimmed.length >= 32) {
      performSearch(trimmed);
    } else if (trimmed.length > 0) {
      // For text searches, use debounce
      debouncedSearch(trimmed);
    }
  }, [performSearch, debouncedSearch]);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard');
    }
  };


  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      {/* Logo Section */}
      <div className="flex items-center gap-6 shrink-0 mr-4">
        <Link href="/" className="flex items-center">
          <span className="whitespace-nowrap text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
            Mayhem
          </span>
        </Link>
        <Link href="/explore" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Explore
        </Link>
        <Link href="/mania" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Mania
        </Link>
        <Link href="/ai-vision" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          AI Vision
        </Link>
      </div>

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
            <img 
              src="/solana-sol-logo.png" 
              alt="SOL" 
              className="w-6 h-6 rounded-full object-contain"
            />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Balance
              </span>
              <span className="font-semibold text-sm">
                {isLoadingBalance && solBalance === null ? (
                  <span className="animate-pulse">...</span>
                ) : solBalance !== null ? (
                  `${solBalance.toFixed(5)} SOL`
                ) : (
                  <span className="text-muted-foreground" title="Balance unavailable">--</span>
                )}
              </span>
            </div>
          </div>
        )}

        <ThemeToggle />

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
