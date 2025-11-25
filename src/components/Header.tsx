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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      // Assume it's a mint address and navigate to token page
      router.push(`/token/${globalSearch.trim()}`);
      setGlobalSearch(''); // Clear after search
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  useEffect(() => {
    // Wrap everything in try-catch to prevent any errors from escaping
    try {
      let cancelled = false;
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Only run in browser
      if (typeof window === 'undefined') {
        return;
      }
      
      // Early return if balance fetch is disabled (due to previous errors)
      if (!balanceFetchEnabled) {
        setSolBalance(null);
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
      
      // Add a delay to ensure connection is fully initialized
      timeoutId = setTimeout(async () => {
        if (cancelled) return;
        
        try {
          // Validate publicKey before using
          let pubkey: PublicKey;
          try {
            pubkey = new PublicKey(publicKey);
          } catch {
            // Invalid public key
            if (!cancelled) setSolBalance(null);
            return;
          }
          
          // Double-check connection is still valid
          if (!connection || typeof connection.getBalance !== 'function') {
            if (!cancelled) setSolBalance(null);
            return;
          }
          
          // Fetch balance with timeout and error handling
          try {
            const balanceLamports = await Promise.race([
              connection.getBalance(pubkey, 'confirmed'),
              new Promise<number>((_, reject) => 
                setTimeout(() => reject(new Error('Balance fetch timeout')), 8000)
              )
            ]) as number;
            
            // Only update if not cancelled and result is valid
            if (!cancelled && typeof balanceLamports === 'number' && balanceLamports >= 0) {
              setSolBalance(balanceLamports / LAMPORTS_PER_SOL);
            } else if (!cancelled) {
              setSolBalance(null);
            }
          } catch (fetchError: unknown) {
            // Silently fail - balance display is optional
            // This catches RPC errors, network errors, timeouts, etc.
            // If we get repeated errors, disable balance fetching to prevent console spam
            if (!cancelled) {
              setSolBalance(null);
              // Disable balance fetching if we get network errors
              // This prevents repeated failed attempts
              if (fetchError instanceof Error && fetchError.message.includes('fetch')) {
                setBalanceFetchEnabled(false);
              }
            }
          }
        } catch (err: unknown) {
          // Catch any other errors
          if (!cancelled) {
            setSolBalance(null);
          }
        }
      }, 500); // Increased delay to ensure connection is ready
      
      return () => {
        cancelled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    } catch (err: unknown) {
      // Catch any synchronous errors in the useEffect itself
      setSolBalance(null);
      return () => {
        // Cleanup function
      };
    }
  }, [publicKey, connection]);

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
          placeholder="Search by Token Mint Address..." 
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
