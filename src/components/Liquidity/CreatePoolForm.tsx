import { useState } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Info, Plus, AlertCircle } from 'lucide-react';

export const CreatePoolForm: React.FC = () => {
  const { publicKey } = useWallet();
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('So11111111111111111111111111111111111111112'); // Default to SOL
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [feeTier, setFeeTier] = useState('0.3%');
  const [isCreating, setIsCreating] = useState(false);

  const feeTiers = [
    { value: '0.01%', label: '0.01%', description: 'Stable pairs (USDC/USDT)' },
    { value: '0.05%', label: '0.05%', description: 'Most pairs' },
    { value: '0.3%', label: '0.3%', description: 'Volatile pairs (default)' },
    { value: '1%', label: '1%', description: 'Exotic pairs' },
  ];

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreatePool = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenA.trim() || !validateAddress(tokenA)) {
      toast.error('Please enter a valid Token A address');
      return;
    }

    if (!tokenB.trim() || !validateAddress(tokenB)) {
      toast.error('Please enter a valid Token B address');
      return;
    }

    if (!amountA || parseFloat(amountA) <= 0) {
      toast.error('Please enter a valid amount for Token A');
      return;
    }

    if (!amountB || parseFloat(amountB) <= 0) {
      toast.error('Please enter a valid amount for Token B');
      return;
    }

    setIsCreating(true);
    try {
      // TODO: Implement actual pool creation
      // This would involve:
      // 1. Choosing DEX (Raydium, Orca, Meteora, etc.)
      // 2. Creating pool account
      // 3. Providing initial liquidity
      // 4. Receiving LP tokens
      
      toast.success('Pool creation feature coming soon!');
      
      // Placeholder for actual implementation
      // await createLiquidityPool(tokenA, tokenB, amountA, amountB, feeTier);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create pool:', error);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to create pool');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Liquidity Pool</CardTitle>
        <CardDescription>
          Create a new liquidity pool and become the first liquidity provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <p className="mb-2">
              <strong>Initial Liquidity:</strong> You'll need to provide both tokens in equal value.
              This sets the initial price ratio.
            </p>
            <p>
              <strong>Fee Tier:</strong> Choose based on token volatility. Higher volatility = higher fees.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Token A */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Token A Contract Address
            </label>
            <Input
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value)}
              placeholder="Enter token contract address..."
            />
            {tokenA && !validateAddress(tokenA) && (
              <p className="text-xs text-red-500 mt-1">Invalid Solana address</p>
            )}
          </div>

          {/* Token B */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Token B Contract Address
            </label>
            <Input
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value)}
              placeholder="So11111111111111111111111111111111111111112"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: SOL. You can change to USDC, USDT, or another token.
            </p>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Initial Amount A</label>
              <Input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Initial Amount B</label>
              <Input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Fee Tier */}
          <div>
            <label className="text-sm font-medium mb-2 block">Fee Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {feeTiers.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setFeeTier(tier.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    feeTier === tier.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">{tier.label}</div>
                  <div className="text-xs text-muted-foreground">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* DEX Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Choose DEX</label>
            <div className="grid grid-cols-3 gap-2">
              {['Raydium', 'Orca', 'Meteora'].map((dex) => (
                <button
                  key={dex}
                  className="p-2 rounded-lg border border-border hover:border-primary/50 text-sm"
                  onClick={() => toast.info(`${dex} pool creation coming soon!`)}
                >
                  {dex}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Important:</strong> Creating a pool requires significant initial liquidity. 
            Make sure you have enough of both tokens. You'll receive LP tokens representing your share.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleCreatePool}
          disabled={!publicKey || !tokenA || !amountA || !amountB || isCreating}
          className="w-full"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating Pool...' : 'Create Pool'}
        </Button>

        {!publicKey && (
          <p className="text-center text-sm text-muted-foreground">
            Connect wallet to create a pool
          </p>
        )}
      </CardContent>
    </Card>
  );
};

