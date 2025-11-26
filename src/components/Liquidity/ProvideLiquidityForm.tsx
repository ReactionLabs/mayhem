import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@jup-ag/wallet-adapter';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Info, Wallet, ArrowDown } from 'lucide-react';

type PoolInfo = {
  address: string;
  dex: string;
  tokenA: {
    mint: string;
    symbol: string;
    amount: number;
    decimals: number;
  };
  tokenB: {
    mint: string;
    symbol: string;
    amount: number;
    decimals: number;
  };
  liquidity: number;
  volume24h: number;
  feeTier: string;
  apr?: number;
};

type ProvideLiquidityFormProps = {
  pool: PoolInfo;
};

export const ProvideLiquidityForm: React.FC<ProvideLiquidityFormProps> = ({ pool }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [ratio, setRatio] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isProviding, setIsProviding] = useState(false);

  // Calculate pool ratio
  useEffect(() => {
    if (pool.tokenA.amount > 0 && pool.tokenB.amount > 0) {
      const ratioValue = pool.tokenA.amount / pool.tokenB.amount;
      setRatio(ratioValue);
    }
  }, [pool]);

  // Fetch SOL balance if tokenB is SOL
  useEffect(() => {
    if (!publicKey || !connection) return;
    if (pool.tokenB.mint === 'So11111111111111111111111111111111111111112') {
      connection.getBalance(publicKey).then((balance) => {
        setSolBalance(balance / LAMPORTS_PER_SOL);
      });
    }
  }, [publicKey, connection, pool.tokenB.mint]);

  // Auto-calculate amountB when amountA changes
  useEffect(() => {
    if (amountA && ratio) {
      const calculatedB = parseFloat(amountA) / ratio;
      setAmountB(calculatedB.toFixed(6));
    }
  }, [amountA, ratio]);

  const handleProvideLiquidity = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amountA || !amountB) {
      toast.error('Please enter amounts for both tokens');
      return;
    }

    setIsProviding(true);
    try {
      // TODO: Implement actual liquidity provision
      // This would involve:
      // 1. Approving token transfers
      // 2. Calling the DEX's add liquidity instruction
      // 3. Receiving LP tokens
      
      toast.success('Liquidity provision feature coming soon!');
      
      // Placeholder for actual implementation
      // await addLiquidityToPool(pool, amountA, amountB);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to provide liquidity:', error);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to provide liquidity');
    } finally {
      setIsProviding(false);
    }
  };

  const handleMaxA = () => {
    // Set max based on available balance
    // For now, just a placeholder
    toast.info('Max amount calculation coming soon');
  };

  const handleMaxB = () => {
    if (pool.tokenB.mint === 'So11111111111111111111111111111111111111112' && solBalance) {
      const maxSol = Math.max(0, solBalance - 0.01); // Leave 0.01 SOL for fees
      setAmountB(maxSol.toFixed(6));
      if (ratio) {
        setAmountA((maxSol * ratio).toFixed(6));
      }
    } else {
      toast.info('Max amount calculation coming soon');
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Pool Information</h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">{pool.tokenA.symbol}</span> /{' '}
              <span className="font-semibold text-foreground">{pool.tokenB.symbol}</span>
            </p>
            <p>DEX: {pool.dex}</p>
            <p>Fee Tier: {pool.feeTier}</p>
            {pool.apr && <p className="text-green-500">APR: {pool.apr.toFixed(2)}%</p>}
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You need to provide equal value of both tokens. The amounts are automatically calculated 
            based on the current pool ratio.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Token A Input */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="font-medium">Amount ({pool.tokenA.symbol})</label>
              <button
                onClick={handleMaxA}
                className="text-xs text-primary hover:underline"
              >
                MAX
              </button>
            </div>
            <Input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="text-lg"
            />
          </div>

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Token B Input */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="font-medium">Amount ({pool.tokenB.symbol})</label>
              <button
                onClick={handleMaxB}
                className="text-xs text-primary hover:underline"
              >
                MAX
              </button>
            </div>
            <Input
              type="number"
              value={amountB}
              onChange={(e) => {
                setAmountB(e.target.value);
                if (ratio && e.target.value) {
                  const calculatedA = parseFloat(e.target.value) * ratio;
                  setAmountA(calculatedA.toFixed(6));
                }
              }}
              placeholder="0.0"
              className="text-lg"
            />
            {pool.tokenB.mint === 'So11111111111111111111111111111111111111112' && solBalance !== null && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <img 
                  src="/solana-sol-logo.png" 
                  alt="SOL" 
                  className="w-3 h-3 rounded-full object-contain"
                />
                Balance: {solBalance.toFixed(5)} SOL
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleProvideLiquidity}
          disabled={!publicKey || !amountA || !amountB || isProviding}
          className="w-full"
          size="lg"
        >
          {isProviding ? 'Providing Liquidity...' : 'Provide Liquidity'}
        </Button>

        {!publicKey && (
          <p className="text-center text-sm text-muted-foreground">
            Connect wallet to provide liquidity
          </p>
        )}
      </CardContent>
    </Card>
  );
};

