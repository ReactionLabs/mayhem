import { useUnifiedWalletContext, useWallet, useConnection } from '@jup-ag/wallet-adapter';
import Link from 'next/link';
import { Button } from './ui/button';
import { useMemo, useState, useEffect } from 'react';
import { shortenAddress } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Input } from './ui/input';
import { Search, User, LogOut, Wallet, Copy, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { toast } from 'sonner';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export const Header = () => {
  const { setShowModal } = useUnifiedWalletContext();
  const { disconnect, publicKey } = useWallet();
  const { connection } = useConnection();
  const address = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [showSolValue, setShowSolValue] = useState(false);
  const [balanceFetchEnabled, setBalanceFetchEnabled] = useState(true);

  const handleConnectWallet = () => {
    setShowModal(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = globalSearch.trim();
    if (!searchTerm) return;

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
      // First try searching via API
      const response = await fetch(`/api/search-token?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          router.push(`/token/${data.token.baseAsset.id}`);
          setGlobalSearch('');
          return;
        }
      }

      // If API search fails, show error
      toast.error('Token not found. Please use contract address (CA) or token name.');
    } catch (error) {
      // Fallback: try direct navigation anyway
      router.push(`/token/${searchTerm}`);
      setGlobalSearch('');
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  useEffect(() => {
    // Completely disable balance fetching if it's been disabled due to errors
    if (!balanceFetchEnabled) {
      return;
    }

    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    // Early return if no wallet connected
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    // Check if connection is available and valid
    if (!connection) {
      setSolBalance(null);
      return;
    }

    // Verify connection has getBalance method
    if (typeof connection.getBalance !== 'function') {
      setSolBalance(null);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    // Wrap the entire async operation
    const fetchBalance = async () => {
      // Add delay to ensure connection is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      if (cancelled || !mounted) return;

      try {
        // Validate publicKey
        let pubkey: PublicKey;
        try {
          pubkey = new PublicKey(publicKey);
        } catch {
          if (mounted && !cancelled) {
            setSolBalance(null);
          }
          return;
        }

        // Double-check connection
        if (!connection || typeof connection.getBalance !== 'function') {
          if (mounted && !cancelled) {
            setSolBalance(null);
          }
          return;
        }

        // Fetch with timeout
        try {
          const balancePromise = connection.getBalance(pubkey, 'confirmed');
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );

          const balanceLamports = await Promise.race([balancePromise, timeoutPromise]);

          if (mounted && !cancelled && typeof balanceLamports === 'number' && balanceLamports >= 0) {
            setSolBalance(balanceLamports / LAMPORTS_PER_SOL);
          } else if (mounted && !cancelled) {
            setSolBalance(null);
          }
        } catch (error: unknown) {
          // Completely suppress all errors - balance is optional
          if (mounted && !cancelled) {
            setSolBalance(null);
            // Disable on any error to prevent repeated failures
            setBalanceFetchEnabled(false);
          }
        }
      } catch (error: unknown) {
        // Catch any unexpected errors
        if (mounted && !cancelled) {
          setSolBalance(null);
          setBalanceFetchEnabled(false);
        }
      }
    };

    // Start the fetch
    timeoutId = setTimeout(() => {
      fetchBalance().catch(() => {
        // Silently catch any promise rejections
        if (mounted && !cancelled) {
          setSolBalance(null);
          setBalanceFetchEnabled(false);
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [publicKey, connection, balanceFetchEnabled]);

  // Price fetch disabled to prevent fetch errors
  // Will show SOL balance only
  useEffect(() => {
    setSolPrice(null);
  }, []);

  const usdValue =
    solBalance !== null && solPrice !== null ? solBalance * solPrice : null;

  const formattedSol =
    solBalance !== null ? `${solBalance.toFixed(3)} SOL` : '--';

  const formattedUsd =
    usdValue !== null
      ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : '--';

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
        {address && (
          <div
            className="hidden sm:flex flex-col text-right px-3 py-2 rounded-xl border border-border bg-secondary/40 cursor-pointer select-none transition"
            onMouseEnter={() => setShowSolValue(true)}
            onMouseLeave={() => setShowSolValue(false)}
            title="Hover to toggle SOL / USD"
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Balance
            </span>
            <span className="font-semibold text-sm">
              {showSolValue || usdValue === null ? formattedSol : formattedUsd}
            </span>
          </div>
        )}
        <ThemeToggle />
        {address ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-primary/20 hover:bg-primary/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {shortenAddress(address)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/portfolio')}>
                <User className="mr-2 h-4 w-4" />
                Portfolio & Tools
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
              <DropdownMenuItem onClick={() => disconnect()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => {
              handleConnectWallet();
            }}
          >
            <span className="hidden md:block">Connect Wallet</span>
            <span className="block md:hidden">Connect</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
