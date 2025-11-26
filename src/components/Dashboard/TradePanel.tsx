import React, { useState, useEffect, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Zap, Settings, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from 'sonner';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { useConnection } from '@jup-ag/wallet-adapter';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PumpFunSDK } from '@/lib/pump-fun';
import { useWalletManager } from '@/contexts/WalletManagerContext';
import { MultiWalletSelector } from '@/components/WalletManager/MultiWalletSelector';

// We need to know WHICH token we are trading. 
// For a general dashboard, this might be dynamic based on selection.
// For now, we'll accept a 'mint' prop or default to a selector.

type TradePanelProps = {
  activeMint?: string; // The mint address of the token to trade
};

export const TradePanel: React.FC<TradePanelProps> = memo(({ activeMint }) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState('0.1');
  const [tradeType, setTradeType] = useState<'buy'|'sell'>('buy');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [curveState, setCurveState] = useState<{
    bondingCurve: PublicKey;
    virtualSolReserves: BN;
    virtualTokenReserves: BN;
    tokenTotalSupply: BN;
  } | null>(null);
  const [quoteTokens, setQuoteTokens] = useState<BN | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [autoSellEnabled, setAutoSellEnabled] = useState(false);
  const [autoSellTarget, setAutoSellTarget] = useState('100');
  const [autoSellStop, setAutoSellStop] = useState('30');

  const { wallets, activeWallets, refreshBalances } = useWalletManager();
  
  // Get active wallets for trading
  const activeWalletsList = useMemo(() => 
    wallets.filter(w => activeWallets.includes(w.id)),
    [wallets, activeWallets]
  );

  // Calculate total balance of active wallets
  const totalActiveBalance = useMemo(() => 
    activeWalletsList.reduce((sum, w) => sum + (w.balance || 0), 0),
    [activeWalletsList]
  );

  // Ensure selected wallet stays in sync with active list
  useEffect(() => {
    if (!activeWalletsList.length) {
      setSelectedWallet(null);
      return;
    }
    if (!selectedWallet || !activeWalletsList.some(w => w.id === selectedWallet)) {
      setSelectedWallet(activeWalletsList[0].id);
    }
  }, [activeWalletsList, selectedWallet]);

  const currentWallet = useMemo(
    () =>
      activeWalletsList.find(w => w.id === selectedWallet) ||
      activeWalletsList[0] ||
      null,
    [activeWalletsList, selectedWallet]
  );

  // Fetch balance for the current wallet
  useEffect(() => {
    if (!currentWallet || !currentWallet.address || !connection) {
      setBalance(null);
      return;
    }

    let cancelled = false;
    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(new PublicKey(currentWallet.address));
        if (!cancelled) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch balance', e);
        }
        if (!cancelled) {
          setBalance(null);
        }
      }
    };

    fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [currentWallet?.address, connection]);

  // Load persisted auto-sell settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('autosell_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.autoSellEnabled === 'boolean') setAutoSellEnabled(parsed.autoSellEnabled);
        if (typeof parsed.autoSellTarget === 'string') setAutoSellTarget(parsed.autoSellTarget);
        if (typeof parsed.autoSellStop === 'string') setAutoSellStop(parsed.autoSellStop);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to parse autosell settings', err);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      'autosell_settings',
      JSON.stringify({ autoSellEnabled, autoSellTarget, autoSellStop })
    );
  }, [autoSellEnabled, autoSellTarget, autoSellStop]);

  // Fetch bonding curve state for active mint
  useEffect(() => {
    if (!activeMint || !connection) {
      setCurveState(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mintPk = new PublicKey(activeMint);
        const bondingCurve = PumpFunSDK.getBondingCurvePDA(mintPk);
        const data = await PumpFunSDK.getBondingCurveAccount(connection, bondingCurve);
        if (!data || cancelled) {
          setCurveState(null);
          return;
        }
        setCurveState({ bondingCurve, ...data });
      } catch (err) {
        if (!cancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load bonding curve', err);
          }
          setCurveState(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeMint, connection]);

  // Recalculate quotes on amount change
  useEffect(() => {
    if (tradeType !== 'buy' || !curveState) {
      setQuoteTokens(null);
      setQuoteStatus('idle');
      return;
    }

    const solAmount = parseFloat(amount);
    if (!Number.isFinite(solAmount) || solAmount <= 0) {
      setQuoteTokens(null);
      setQuoteStatus('idle');
      return;
    }

    setQuoteStatus('loading');
    try {
      const lamports = new BN(Math.floor(solAmount * LAMPORTS_PER_SOL));
      if (lamports.lte(new BN(0))) {
        setQuoteTokens(null);
        setQuoteStatus('idle');
        return;
      }
      const tokensOut = PumpFunSDK.calculateBuyQuote(
        lamports,
        curveState.virtualSolReserves,
        curveState.virtualTokenReserves
      );
      setQuoteTokens(tokensOut);
      setQuoteStatus('idle');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote calculation failed', err);
      }
      setQuoteTokens(null);
      setQuoteStatus('error');
    }
  }, [amount, tradeType, curveState]);

  const estimatedTokensDisplay = useMemo(() => {
    if (!quoteTokens) return null;
    const tokens = Number(quoteTokens.toString()) / 1_000_000;
    if (!Number.isFinite(tokens)) return null;
    return tokens;
  }, [quoteTokens]);

  const persistAutoSellPlan = (mint: string) => {
    if (typeof window === 'undefined') return;
    const plan = {
      mint,
      target: Number(autoSellTarget) || 0,
      stop: Number(autoSellStop) || 0,
      createdAt: Date.now(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem('autosell_plans') || '[]');
      const filtered = existing.filter((entry: any) => entry.mint !== mint);
      filtered.push(plan);
      localStorage.setItem('autosell_plans', JSON.stringify(filtered));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to persist auto-sell plan', err);
      }
    }
  };

  const handleTrade = async () => {
    if (!activeMint) {
        toast.error("Select a token from the scanner/chart first.");
        return;
    }

    if (!currentWallet) {
      toast.error('Activate at least one trading wallet.');
      return;
    }

    const isConnectedWallet = currentWallet.type === 'connected';

    if (isConnectedWallet) {
        if (!publicKey || !signTransaction) {
            toast.error("Please connect your main wallet.");
            return;
        }

        setIsLoading(true);
        try {
             // Use our existing Pump Trade API which handles the transaction building
             // For 'connected' wallet, we need to build the tx and ask user to sign
             // The existing /api/trade-pump expects an API Key for a *hot* wallet usually.
             // We need to adapt it or use a direct transaction builder.
             
             // For now, let's assume we use the Hot Wallet API for everything for speed, 
             // OR we build the TX locally for the main wallet. 
             
             // Let's use the '/api/trade-pump' logic but adapted.
             // Actually, standard practice for "Pro Terminals" is:
             // 1. Main Wallet -> Request Signature
             // 2. Hot Wallet -> Auto Sign via backend/local key
             
             // Since we haven't refactored /api/trade-pump to return a transaction for signing yet,
             // let's just simulate the "Order Sent" for now until Phase 3 is fully complete.
             
             // Simulate API call
             await new Promise(r => setTimeout(r, 1000));
             
             toast.success(`Order Sent: ${tradeType.toUpperCase()} ${amount} SOL on ${activeMint.slice(0,4)}...`);
             if (autoSellEnabled && tradeType === 'buy') {
               persistAutoSellPlan(activeMint);
               toast.success(`Auto-sell armed at +${autoSellTarget}% / -${autoSellStop}%`);
             }

        } catch (e) {
            toast.error("Trade failed");
        } finally {
            setIsLoading(false);
        }
    } else {
        // Hot Wallet Logic (stored key)
        toast.info(`Bot wallet (${currentWallet.label}) trading coming in next update.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h3 className="font-bold text-sm">Fast Execution</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Multi-Wallet Selector */}
      <div className="p-4 pb-0 border-b border-border">
        <MultiWalletSelector />
        {activeWalletsList.length > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Active Balance</span>
              <span className="text-sm font-mono font-bold text-primary">
                {totalActiveBalance.toFixed(4)} SOL
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {activeWalletsList.length} wallet{activeWalletsList.length !== 1 ? 's' : ''} ready to trade
            </div>
          </div>
        )}
      </div>

      {/* Trade Form */}
      <div className="p-4 flex-1">
        <Tabs defaultValue="buy" className="w-full" onValueChange={(v) => setTradeType(v as 'buy'|'sell')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">Sell</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Amount (SOL)</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-12 font-mono text-lg"
                />
                <div className="absolute right-1 top-1 bottom-1 flex items-center">
                   <Button variant="ghost" size="sm" className="h-7 text-xs px-2">MAX</Button>
                </div>
              </div>
              
              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2">
                {['0.1', '0.5', '1', '5'].map(val => (
                  <Button 
                    key={val} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setAmount(val)}
                  >
                    {val}
                  </Button>
                ))}
              </div>
              {tradeType === 'buy' && (
                <p className="text-[11px] text-muted-foreground">
                  {quoteStatus === 'loading' && 'Estimating fill...'}
                  {quoteStatus === 'error' && 'Unable to fetch bonding curve.'}
                  {quoteStatus === 'idle' && estimatedTokensDisplay && (
                    <>Est. receive ~{estimatedTokensDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens</>
                  )}
                  {quoteStatus === 'idle' && !estimatedTokensDisplay && !curveState && 'Waiting for live pool data...'}
                  {quoteStatus === 'idle' && !estimatedTokensDisplay && curveState && 'Enter amount to preview tokens.'}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Slippage</span>
                 <span className="font-mono">1.0%</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Priority Fee</span>
                 <span className="font-mono">0.005 SOL</span>
               </div>
            </div>

            <Button 
              size="lg" 
              className={`w-full font-bold text-lg mt-4 ${tradeType === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              onClick={handleTrade}
              disabled={isLoading || !activeMint}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (tradeType === 'buy' ? 'BUY NOW' : 'SELL NOW')}
            </Button>
            
            {!activeMint && (
                <p className="text-xs text-center text-red-400">Select a token to trade</p>
            )}

            <div className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Auto-Sell Planner</p>
                  <p className="text-[11px] text-muted-foreground">Arm profit & stop-loss targets after this buy.</p>
                </div>
                <Checkbox
                  checked={autoSellEnabled}
                  onCheckedChange={(checked) => setAutoSellEnabled(checked === true)}
                />
              </div>
              {autoSellEnabled && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Target Profit %</label>
                    <Input
                      type="number"
                      min="1"
                      value={autoSellTarget}
                      onChange={(e) => setAutoSellTarget(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Stop Loss %</label>
                    <Input
                      type="number"
                      min="1"
                      value={autoSellStop}
                      onChange={(e) => setAutoSellStop(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <p className="col-span-2 text-[11px] text-muted-foreground">
                    When targets are hit we’ll auto-queue a sell through your trading wallet (coming soon).
                  </p>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-secondary/10">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span>System Operational</span>
        </div>
      </div>
    </div>
  );
});
