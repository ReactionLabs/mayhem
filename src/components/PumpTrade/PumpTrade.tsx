import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WalletManager } from './WalletManager';
import { Zap, SlidersHorizontal, Edit2, Check, TrendingUp, Wallet } from 'lucide-react';
import { useTradeOverlay } from '@/contexts/TradeOverlayContext';
import { useConnection, useWallet, useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { PumpFunSDK, FEE_RECIPIENT } from '@/lib/pump-fun';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';

type PumpTradeProps = {
  mint: string;
  className?: string;
};

type TradeMode = 'instant' | 'market' | 'plays';

export const PumpTrade: React.FC<PumpTradeProps> = ({ mint, className }) => {
  const [amount, setAmount] = useState<string>('0.1');
  const [isLoading, setIsLoading] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mode, setMode] = useState<TradeMode>('instant');
  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [useConnectedWallet, setUseConnectedWallet] = useState(false);
  
  // Context for Chart Overlay
  const { projectedProfitPercent, setProjectedProfitPercent } = useTradeOverlay();
  
  // Solana Wallet Adapter
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const walletContext = useUnifiedWalletContext();
  const setShowModal = walletContext?.setShowModal;

  // Presets State
  const [buyPresets, setBuyPresets] = useState(['0.1', '0.5', '1.0', '2.0']);
  const [sellPresets, setSellPresets] = useState(['25%', '50%', '75%', '100%']);

  // Advanced settings
  const [slippage, setSlippage] = useState('10');
  const [priorityFee, setPriorityFee] = useState('0.00005');

  useEffect(() => {
    const savedKey = localStorage.getItem('pump_portal_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    const savedBuyPresets = localStorage.getItem('pump_buy_presets');
    if (savedBuyPresets) setBuyPresets(JSON.parse(savedBuyPresets));
    
    const savedSellPresets = localStorage.getItem('pump_sell_presets');
    if (savedSellPresets) setSellPresets(JSON.parse(savedSellPresets));
  }, []);

  const handleApiKeyChange = (key: string | null) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('pump_portal_api_key', key);
    } else {
      localStorage.removeItem('pump_portal_api_key');
    }
  };

  const savePresets = () => {
    localStorage.setItem('pump_buy_presets', JSON.stringify(buyPresets));
    localStorage.setItem('pump_sell_presets', JSON.stringify(sellPresets));
    setIsEditingPresets(false);
    toast.success('Presets saved');
  };

  const handlePresetChange = (type: 'buy' | 'sell', index: number, value: string) => {
    if (type === 'buy') {
      const newPresets = [...buyPresets];
      newPresets[index] = value;
      setBuyPresets(newPresets);
    } else {
      const newPresets = [...sellPresets];
      newPresets[index] = value;
      setSellPresets(newPresets);
    }
  };

  const executeDirectTrade = async (amountToTrade: string) => {
    // Pre-validate wallet connection - fail fast
    if (!publicKey || !signTransaction || !sendTransaction) {
      toast.error('Please connect your wallet first');
      // Auto-open wallet modal if available
      if (setShowModal) {
        setTimeout(() => setShowModal(true), 500);
      }
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate amount
      const amount = parseFloat(amountToTrade);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const mintPubkey = new PublicKey(mint);
      const bondingCurve = PumpFunSDK.getBondingCurvePDA(mintPubkey);
      
      // Parallel fetch of addresses and curve state for speed
      const [associatedBondingCurve, associatedUser, curveState] = await Promise.all([
        getAssociatedTokenAddress(mintPubkey, bondingCurve, true),
        getAssociatedTokenAddress(mintPubkey, publicKey),
        PumpFunSDK.getBondingCurveAccount(connection, bondingCurve),
      ]);

      if (!curveState) {
        throw new Error('Bonding curve not found');
      }

      let transaction = new Transaction();
      
      if (tradeType === 'buy') {
        const solAmount = parseFloat(amountToTrade);
        const solAmountLamports = new BN(solAmount * 1e9);
        
        // Calculate tokens out
        const tokensOut = PumpFunSDK.calculateBuyQuote(
          solAmountLamports,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );
        
        // Calculate max cost with slippage
        const slippageMultiplier = 1 + (parseFloat(slippage) / 100);
        const maxSolCost = solAmountLamports.mul(new BN(slippageMultiplier * 100)).div(new BN(100)); // Simplified

        const ix = PumpFunSDK.getBuyInstruction(
          publicKey,
          mintPubkey,
          bondingCurve,
          associatedBondingCurve,
          associatedUser,
          tokensOut,
          maxSolCost
        );
        transaction.add(ix);
      } else {
        // SELL logic
        // Need to handle % calculation if percentage string
        let tokenAmount = new BN(0);
        if (amountToTrade.includes('%')) {
           const percentage = parseFloat(amountToTrade.replace('%', ''));
           const tokenAccount = await connection.getTokenAccountBalance(associatedUser);
           const balance = tokenAccount.value.amount;
           tokenAmount = new BN(balance).mul(new BN(percentage)).div(new BN(100));
        } else {
           tokenAmount = new BN(parseFloat(amountToTrade) * 1e6); // Assuming 6 decimals for Pump tokens
        }

        // Calculate min SOL output
        const solOut = PumpFunSDK.calculateSellQuote(
          tokenAmount,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );
        
        const slippageMultiplier = 1 - (parseFloat(slippage) / 100);
        const minSolOutput = solOut.mul(new BN(slippageMultiplier * 100)).div(new BN(100));

        const ix = PumpFunSDK.getSellInstruction(
          publicKey,
          mintPubkey,
          bondingCurve,
          associatedBondingCurve,
          associatedUser,
          tokenAmount,
          minSolOutput
        );
        transaction.add(ix);
      }

      // Send transaction - use 'processed' for faster confirmation
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });
      
      // Don't wait for full confirmation - show success immediately
      toast.success(`Trade sent! Sig: ${signature.slice(0, 8)}...`);
      
      // Confirm in background (non-blocking)
      connection.confirmTransaction(signature, 'processed').catch(() => {
        // Silent fail - user already sees success
      });

    } catch (error) {
      console.error('Direct trade failed:', error);
      toast.error(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  const executeTrade = async (amountToTrade: string) => {
    // If using connected wallet, route to direct RPC logic
    if (useConnectedWallet) {
      await executeDirectTrade(amountToTrade);
      return;
    }

    if (!apiKey) {
      toast.error("Please set up your Fast Trading Wallet first (click the gear icon) or switch to Connected Wallet.");
      return;
    }

    try {
      setIsLoading(true);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      };

      const isPercentage = amountToTrade.includes('%');
      const parsedAmount = isPercentage ? amountToTrade : parseFloat(amountToTrade);
      const denominatedInSol = tradeType === 'buy' ? 'true' : 'false';

      const payload = {
        action: tradeType,
        mint,
        amount: parsedAmount,
        denominatedInSol, 
        slippage: parseFloat(slippage), 
        priorityFee: parseFloat(priorityFee),
        pool: 'auto'
      };

      const response = await fetch('/api/trade-pump', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      if (data.signature) {
        toast.success(`${tradeType === 'buy' ? 'Buy' : 'Sell'} successful! Sig: ${data.signature.slice(0, 8)}...`);
      } else if (data.errors) {
         toast.error(`Trade failed: ${data.errors.join(', ')}`);
      } else {
        toast.success('Trade sent!');
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Trade failed:', error);
      }
      toast.error(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantClick = (val: string) => {
    if (isEditingPresets) return;
    
    // Pre-check wallet before setting amount
    if (!publicKey && !apiKey) {
      toast.error('Please connect your wallet first');
      if (setShowModal) {
        setTimeout(() => setShowModal(true), 300);
      }
      return;
    }
    
    setAmount(val);
    executeTrade(val);
  };

  const isCustomWallet = !!apiKey;

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 space-y-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">Instant Sniper</h3>
          
          {useConnectedWallet ? (
             <div className="bg-purple-500/20 text-purple-500 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
              <Wallet className="w-3 h-3" /> DIRECT
            </div>
          ) : isCustomWallet ? (
             <div className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">
              BOT READY
            </div>
          ) : (
            <div className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30">
              SETUP REQUIRED
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8", useConnectedWallet ? "text-purple-500 bg-purple-500/10" : "text-muted-foreground")}
            onClick={() => setUseConnectedWallet(!useConnectedWallet)}
            title="Toggle Connected Wallet"
          >
            <Wallet className="h-4 w-4" />
          </Button>
          <WalletManager onApiKeyChange={handleApiKeyChange} currentApiKey={apiKey} />
        </div>
      </div>
      
      {/* Mode Toggles */}
      <div className="grid grid-cols-3 gap-1 bg-secondary/30 p-1 rounded-lg">
        <button
          onClick={() => setMode('instant')}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'instant' ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="w-3 h-3 text-yellow-500" />
          Instant
        </button>
        <button
          onClick={() => setMode('market')}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'market' ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Market
        </button>
        <button
          onClick={() => setMode('plays')}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'plays' ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingUp className="w-3 h-3 text-blue-500" />
          Plays
        </button>
      </div>

      {/* Buy/Sell Toggle (Not needed for Plays mode) */}
      {mode !== 'plays' && (
        <div className="flex bg-secondary/50 p-1 rounded-lg">
          <button
            onClick={() => setTradeType('buy')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              tradeType === 'buy' ? "bg-green-500/20 text-green-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              tradeType === 'sell' ? "bg-red-500/20 text-red-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sell
          </button>
        </div>
      )}

      {/* Content based on Mode */}
      {mode === 'instant' ? (
        <div className="space-y-3 relative">
          <div className="flex justify-center items-center relative">
             <p className="text-[10px] text-muted-foreground font-medium">
              ONE-CLICK EXECUTION (No Confirmation)
            </p>
            <button 
              onClick={() => isEditingPresets ? savePresets() : setIsEditingPresets(true)}
              className="absolute right-0 text-muted-foreground hover:text-primary"
            >
              {isEditingPresets ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {tradeType === 'buy' ? (
              <>
                {buyPresets.map((val, idx) => (
                  isEditingPresets ? (
                    <Input
                      key={idx}
                      value={val}
                      onChange={(e) => handlePresetChange('buy', idx, e.target.value)}
                      className="h-9 text-center text-xs"
                    />
                  ) : (
                    <Button 
                      key={idx}
                      onClick={() => handleInstantClick(val)}
                      disabled={isLoading}
                      variant="outline"
                      className="hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <img 
                          src="/solana-sol-logo.png" 
                          alt="SOL" 
                          className="w-3 h-3 rounded-full object-contain"
                        />
                        {val} SOL
                      </span>
                    </Button>
                  )
                ))}
              </>
            ) : (
              <>
                {sellPresets.map((val, idx) => (
                  isEditingPresets ? (
                    <Input
                      key={idx}
                      value={val}
                      onChange={(e) => handlePresetChange('sell', idx, e.target.value)}
                      className="h-9 text-center text-xs"
                    />
                  ) : (
                    <Button 
                      key={idx}
                      onClick={() => handleInstantClick(val)}
                      disabled={isLoading}
                      variant="outline"
                      className="hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors"
                    >
                      {val}
                    </Button>
                  )
                ))}
              </>
            )}
          </div>
        </div>
      ) : mode === 'market' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              {tradeType === 'buy' && (
                <img 
                  src="/solana-sol-logo.png" 
                  alt="SOL" 
                  className="w-3 h-3 rounded-full object-contain"
                />
              )}
              Amount ({tradeType === 'buy' ? 'SOL' : 'Tokens/%'})
            </label>
            <div className="flex gap-2">
              <Input 
                type="text" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background"
                placeholder={tradeType === 'buy' ? "0.0" : "Amount or %"}
              />
              {tradeType === 'sell' && (
                <Button variant="outline" onClick={() => setAmount('100%')} className="px-3">Max</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Slippage (%)</label>
              <Input 
                type="number" 
                value={slippage} 
                onChange={(e) => setSlippage(e.target.value)}
                className="bg-background h-8 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                <img 
                  src="/solana-sol-logo.png" 
                  alt="SOL" 
                  className="w-2.5 h-2.5 rounded-full object-contain"
                />
                Priority (SOL)
              </label>
              <Input 
                type="number" 
                value={priorityFee} 
                onChange={(e) => setPriorityFee(e.target.value)}
                className="bg-background h-8 text-xs" 
              />
            </div>
          </div>

          <Button 
            onClick={() => executeTrade(amount)}
            disabled={isLoading} 
            className={cn(
              "w-full font-bold",
              tradeType === 'buy' 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            {isLoading ? (
              <span className="iconify ph--spinner animate-spin w-5 h-5" />
            ) : (
              <span>
                {useConnectedWallet 
                  ? (tradeType === 'buy' ? `Buy ${amount} SOL` : `Sell ${amount}`) 
                  : isCustomWallet 
                    ? (tradeType === 'buy' ? `Buy ${amount} SOL` : `Sell ${amount}`) 
                    : 'Setup Trading Wallet'}
              </span>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Plays Mode */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">
              Visualize Target Profit
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 200].map(percent => (
                <Button
                  key={percent}
                  variant={projectedProfitPercent === percent ? "default" : "outline"}
                  onClick={() => setProjectedProfitPercent(percent === projectedProfitPercent ? null : percent)}
                  className="text-xs"
                >
                  +{percent}%
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-2 items-center">
              <Input 
                type="number" 
                placeholder="Custom %" 
                className="h-8 text-xs"
                value={projectedProfitPercent || ''}
                onChange={(e) => setProjectedProfitPercent(parseFloat(e.target.value))}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setProjectedProfitPercent(null)}
                className="text-xs text-muted-foreground"
              >
                Clear
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              This overlays a target line on the chart based on the current price. Use this to plan your exit.
            </p>
          </div>
        </div>
      )}

      {!isCustomWallet && !useConnectedWallet && (
        <p className="text-[10px] text-muted-foreground text-center">
          Create a dedicated high-speed trading wallet to snipe tokens instantly.
        </p>
      )}
      
      {useConnectedWallet && (
        <div className="pt-2 border-t border-border mt-2 text-center">
           <p className="text-[10px] text-purple-400 font-medium">
             Using Connected Wallet (Direct RPC)
           </p>
        </div>
      )}
    </div>
  );
};
