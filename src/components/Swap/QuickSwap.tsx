import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowDown, Wallet, RefreshCw } from 'lucide-react';
import { useConnection, useWallet } from '@jup-ag/wallet-adapter';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { PumpFunSDK } from '@/lib/pump-fun';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';

interface QuickSwapProps {
  mint: string;
}

export const QuickSwap: React.FC<QuickSwapProps> = ({ mint }) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  // Fetch balances
  useEffect(() => {
    if (!publicKey || !connection) return;

    const fetchBalances = async () => {
      try {
        // SOL Balance
        const bal = await connection.getBalance(publicKey);
        setSolBalance(bal / LAMPORTS_PER_SOL);

        // Token Balance
        if (mint) {
          const mintKey = new PublicKey(mint);
          const ata = await getAssociatedTokenAddress(mintKey, publicKey);
          try {
            const tokenAccount = await connection.getTokenAccountBalance(ata);
            setTokenBalance(tokenAccount.value.uiAmount);
          } catch (e) {
            setTokenBalance(0); // Likely no ATA yet
          }
        }
      } catch (e) {
        console.error("Error fetching balances", e);
      }
    };

    fetchBalances();
    const id = setInterval(fetchBalances, 10000); // Update every 10s
    return () => clearInterval(id);
  }, [publicKey, connection, mint]);

  const handlePercentage = (percent: number) => {
    if (mode === 'buy') {
      if (solBalance === null) return;
      // Leave some SOL for gas (e.g. 0.01)
      const maxSol = Math.max(0, solBalance - 0.01);
      setAmount((maxSol * (percent / 100)).toFixed(4));
    } else {
      if (tokenBalance === null) return;
      setAmount((tokenBalance * (percent / 100)).toFixed(6));
    }
  };

  const executeTrade = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect wallet");
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const mintPubkey = new PublicKey(mint);
      const bondingCurve = PumpFunSDK.getBondingCurvePDA(mintPubkey);
      const associatedBondingCurve = await getAssociatedTokenAddress(mintPubkey, bondingCurve, true);
      const associatedUser = await getAssociatedTokenAddress(mintPubkey, publicKey);

      // Fetch bonding curve state
      const curveState = await PumpFunSDK.getBondingCurveAccount(connection, bondingCurve);
      if (!curveState) throw new Error('Bonding curve not found');

      let transaction = new Transaction();

      if (mode === 'buy') {
        const solAmount = parseFloat(amount);
        const solAmountLamports = new BN(solAmount * 1e9);
        
        // Calc output
        const tokensOut = PumpFunSDK.calculateBuyQuote(
          solAmountLamports,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );
        
        // 5% Slippage hardcoded for quick swap simplicity
        const maxSolCost = solAmountLamports.mul(new BN(105)).div(new BN(100)); 

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
        const tokenAmt = parseFloat(amount);
        const tokenAmountLamports = new BN(tokenAmt * 1e6); // Assuming 6 decimals

        const solOut = PumpFunSDK.calculateSellQuote(
          tokenAmountLamports,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );
        
        const minSolOutput = solOut.mul(new BN(95)).div(new BN(100)); // 5% slippage

        const ix = PumpFunSDK.getSellInstruction(
          publicKey,
          mintPubkey,
          bondingCurve,
          associatedBondingCurve,
          associatedUser,
          tokenAmountLamports,
          minSolOutput
        );
        transaction.add(ix);
      }

      const sig = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      toast.success(`Swap successful!`);
      setAmount(''); // Reset form
      
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Quick Swap
        </h3>
        <div className="flex bg-secondary/50 p-1 rounded-lg">
          <button
            onClick={() => setMode('buy')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'buy' ? 'bg-green-500/20 text-green-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Buy
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'sell' ? 'bg-red-500/20 text-red-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Amount ({mode === 'buy' ? 'SOL' : 'TOKENS'})</span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3" /> 
              {mode === 'buy' ? `${solBalance?.toFixed(4) || '0'} SOL` : `${tokenBalance?.toFixed(2) || '0'}`}
            </span>
          </div>
          
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16 font-mono text-lg"
              placeholder="0.0"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {[25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePercentage(pct)}
                  className="text-[10px] bg-secondary hover:bg-secondary/80 px-2 py-1 rounded text-foreground"
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button 
          onClick={executeTrade}
          disabled={isLoading || !publicKey}
          className={`w-full font-bold ${mode === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isLoading ? (
            <span className="iconify ph--spinner animate-spin w-5 h-5" />
          ) : (
            <span>{mode === 'buy' ? 'Buy Now' : 'Sell Now'}</span>
          )}
        </Button>
        
        {!publicKey && (
          <p className="text-[10px] text-center text-muted-foreground">Connect wallet to trade</p>
        )}
      </div>
    </div>
  );
};

