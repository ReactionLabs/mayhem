import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@jup-ag/wallet-adapter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, TrendingUp, Loader2, Wallet } from 'lucide-react';
import { PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';
import { PumpFunSDK } from '@/lib/pump-fun';

// Fee recipient address - Community wallet for platform fees
const FEE_RECIPIENT = new PublicKey('Cdnz7Nf47SnVW6NGy3jSqeCv6Bhb6TkzDhppAzyxTm2Z');
const FEE_BPS = 50; // 0.5% fee (50 basis points)

type Token = {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  marketCap: number;
  price: number;
  volume24h: number;
  priceChange24h: number;
};

type SwapMode = 'buy' | 'sell';

export const TopTokensSwap: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [mode, setMode] = useState<SwapMode>('buy');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  // Fetch top tokens
  useEffect(() => {
    const fetchTopTokens = async () => {
      try {
        const response = await fetch('/api/top-tokens');
        const data = await response.json();
        if (data.success && data.tokens) {
          setTokens(data.tokens);
          if (data.tokens.length > 0 && !selectedToken) {
            setSelectedToken(data.tokens[0]);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching top tokens:', error);
        }
        toast.error('Failed to load top tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTokens();
  }, []);

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey || !connection) return;

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching balance:', error);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleSwap = async () => {
    if (!publicKey || !sendTransaction || !selectedToken) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSwapping(true);
    try {
      const mintPubkey = new PublicKey(selectedToken.mint);
      const bondingCurve = PumpFunSDK.getBondingCurvePDA(mintPubkey);
      const associatedBondingCurve = await getAssociatedTokenAddress(mintPubkey, bondingCurve, true);
      const associatedUser = await getAssociatedTokenAddress(mintPubkey, publicKey);

      // Fetch bonding curve state
      const curveState = await PumpFunSDK.getBondingCurveAccount(connection, bondingCurve);
      if (!curveState) {
        throw new Error('Token not found on Pump.fun');
      }

      const transaction = new Transaction();

      if (mode === 'buy') {
        const solAmount = parseFloat(amount);
        const solAmountLamports = new BN(solAmount * 1e9);
        
        // Calculate tokens out
        const tokensOut = PumpFunSDK.calculateBuyQuote(
          solAmountLamports,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );
        
        // Calculate fee (0.5% of SOL amount)
        const feeAmount = solAmountLamports.mul(new BN(FEE_BPS)).div(new BN(10000));
        const solAfterFee = solAmountLamports.sub(feeAmount);
        
        // Add fee transfer to fee recipient
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: FEE_RECIPIENT,
            lamports: feeAmount.toNumber(),
          })
        );

        // Calculate buy with remaining SOL (after fee)
        const tokensOutAfterFee = PumpFunSDK.calculateBuyQuote(
          solAfterFee,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );

        // 5% slippage
        const maxSolCost = solAfterFee.mul(new BN(105)).div(new BN(100));

        const buyIx = PumpFunSDK.getBuyInstruction(
          publicKey,
          mintPubkey,
          bondingCurve,
          associatedBondingCurve,
          associatedUser,
          tokensOutAfterFee,
          maxSolCost
        );
        transaction.add(buyIx);
      } else {
        const tokenAmount = parseFloat(amount);
        const tokenAmountLamports = new BN(tokenAmount * 1e6); // Assuming 6 decimals

        const solOut = PumpFunSDK.calculateSellQuote(
          tokenAmountLamports,
          curveState.virtualSolReserves,
          curveState.virtualTokenReserves
        );

        // Calculate fee (0.5% of SOL output)
        const feeAmount = solOut.mul(new BN(FEE_BPS)).div(new BN(10000));
        const solAfterFee = solOut.sub(feeAmount);

        // 5% slippage
        const minSolOutput = solAfterFee.mul(new BN(95)).div(new BN(100));

        const sellIx = PumpFunSDK.getSellInstruction(
          publicKey,
          mintPubkey,
          bondingCurve,
          associatedBondingCurve,
          associatedUser,
          tokenAmountLamports,
          minSolOutput
        );
        transaction.add(sellIx);

        // Add fee transfer after sell
        // Note: This is a simplified approach - in production, you'd want to handle this more carefully
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: FEE_RECIPIENT,
            lamports: feeAmount.toNumber(),
          })
        );
      }

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`${mode === 'buy' ? 'Buy' : 'Sell'} successful!`);
      setAmount('');
      
      // Refresh balance
      if (publicKey) {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Swap failed:', error);
      }
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const handlePercentage = (percent: number) => {
    if (mode === 'buy' && solBalance !== null) {
      const maxSol = Math.max(0, solBalance - 0.01); // Leave 0.01 SOL for fees
      setAmount((maxSol * (percent / 100)).toFixed(4));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Top Tokens Swap</h1>
          <p className="text-muted-foreground">Swap with the top 10 tokens by market cap on Solana</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token List */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold mb-4">Top 10 Tokens</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {tokens.map((token) => (
                    <button
                      key={token.mint}
                      onClick={() => setSelectedToken(token)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        selectedToken?.mint === token.mint
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {token.logoURI ? (
                          <img
                            src={token.logoURI}
                            alt={token.name}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                            {token.symbol[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{token.name}</div>
                          <div className="text-sm text-muted-foreground">{token.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            ${(token.marketCap / 1e6).toFixed(2)}M
                          </div>
                        </div>
                        {token.priceChange24h > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {selectedToken ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      {selectedToken.logoURI ? (
                        <img
                          src={selectedToken.logoURI}
                          alt={selectedToken.name}
                          className="w-12 h-12 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                          {selectedToken.symbol[0]}
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold">{selectedToken.name}</h2>
                        <p className="text-muted-foreground">{selectedToken.symbol}</p>
                      </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6 bg-secondary/50 p-1 rounded-lg">
                      <button
                        onClick={() => setMode('buy')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                          mode === 'buy'
                            ? 'bg-green-500/20 text-green-500'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setMode('sell')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                          mode === 'sell'
                            ? 'bg-red-500/20 text-red-500'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Sell
                      </button>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Amount ({mode === 'buy' ? 'SOL' : 'TOKENS'})</span>
                        {mode === 'buy' && solBalance !== null && (
                          <span className="flex items-center gap-1.5">
                            <img 
                              src="/solana-sol-logo.png" 
                              alt="SOL" 
                              className="w-4 h-4 rounded-full object-contain"
                            />
                            {solBalance.toFixed(5)} SOL
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.0"
                          className="text-2xl font-mono pr-24 h-16"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => handlePercentage(pct)}
                              className="text-xs bg-secondary hover:bg-secondary/80 px-2 py-1 rounded"
                            >
                              {pct === 100 ? 'MAX' : `${pct}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <Button
                      onClick={handleSwap}
                      disabled={isSwapping || !publicKey || !amount}
                      className={`w-full h-12 text-lg font-bold ${
                        mode === 'buy'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {isSwapping ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        `${mode === 'buy' ? 'Buy' : 'Sell'} ${selectedToken.symbol}`
                      )}
                    </Button>

                    {!publicKey && (
                      <p className="text-center text-sm text-muted-foreground mt-4">
                        Connect wallet to swap
                      </p>
                    )}

                    {/* Fee Info */}
                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground">
                      <p>Platform fee: 0.5% ({FEE_RECIPIENT.toBase58().slice(0, 8)}...)</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a token to swap
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

