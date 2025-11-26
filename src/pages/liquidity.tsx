import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useConnection, useWallet } from '@jup-ag/wallet-adapter';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Search, Info, TrendingUp, Plus, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { ProvideLiquidityForm } from '@/components/Liquidity/ProvideLiquidityForm';
import { CreatePoolForm } from '@/components/Liquidity/CreatePoolForm';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';

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

export default function LiquidityPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokenCA, setTokenCA] = useState('');
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [showEducation, setShowEducation] = useState(true);

  const handleSearchPools = async () => {
    if (!tokenCA.trim()) {
      toast.error('Please enter a token contract address');
      return;
    }

    // Validate Solana address
    try {
      new PublicKey(tokenCA);
    } catch {
      toast.error('Invalid Solana address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/liquidity/pools?token=${tokenCA}`);
      const data = await response.json();
      
      if (data.success) {
        setPools(data.pools || []);
        if (data.pools && data.pools.length > 0) {
          toast.success(`Found ${data.pools.length} pool(s)`);
        } else {
          toast.info('No existing pools found. You can create a new one!');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch pools');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error searching pools:', error);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to search pools');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Liquidity Provision - Mayhem</title>
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Liquidity Provision</h1>
          <p className="text-muted-foreground">
            Provide liquidity to existing pools or create new ones
          </p>
        </div>

        {/* Education Banner */}
        {showEducation && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <BookOpen className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>Understanding Liquidity Provision</span>
              <button
                onClick={() => setShowEducation(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2 text-sm">
              <p>
                <strong>What is liquidity?</strong> Liquidity pools allow traders to swap tokens. 
                By providing liquidity, you earn fees from trades.
              </p>
              <p>
                <strong>How it works:</strong> You deposit equal values of two tokens (e.g., SOL + Token). 
                You receive LP (Liquidity Provider) tokens representing your share. Earn fees on all trades.
              </p>
              <p>
                <strong>Risks:</strong> Impermanent loss can occur if token prices diverge. 
                You may end up with more of the lower-value token.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">Find Pools</TabsTrigger>
            <TabsTrigger value="provide">Provide Liquidity</TabsTrigger>
            <TabsTrigger value="create">Create Pool</TabsTrigger>
          </TabsList>

          {/* Find Pools Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search for Liquidity Pools</CardTitle>
                <CardDescription>
                  Enter a token contract address to find existing liquidity pools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tokenCA}
                    onChange={(e) => setTokenCA(e.target.value)}
                    placeholder="Enter token contract address (CA)..."
                    className="flex-1"
                  />
                  <Button onClick={handleSearchPools} disabled={loading}>
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {pools.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold">Found Pools:</h3>
                    {pools.map((pool) => (
                      <Card
                        key={pool.address}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => {
                          setSelectedPool(pool);
                          // Switch to provide tab
                          document.querySelector('[value="provide"]')?.click();
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{pool.dex}</Badge>
                                <Badge variant="secondary">{pool.feeTier}</Badge>
                              </div>
                              <div className="text-sm space-y-1">
                                <p>
                                  <span className="font-semibold">{pool.tokenA.symbol}</span> /{' '}
                                  <span className="font-semibold">{pool.tokenB.symbol}</span>
                                </p>
                                <p className="text-muted-foreground">
                                  Liquidity: ${(pool.liquidity / 1e6).toFixed(2)}M
                                </p>
                                <p className="text-muted-foreground">
                                  Volume 24h: ${(pool.volume24h / 1e6).toFixed(2)}M
                                </p>
                                {pool.apr && (
                                  <p className="text-green-500 font-semibold">
                                    APR: {pool.apr.toFixed(2)}%
                                  </p>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {pools.length === 0 && !loading && tokenCA && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No pools found</AlertTitle>
                    <AlertDescription>
                      No existing liquidity pools found for this token. You can create a new pool in the "Create Pool" tab.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Provide Liquidity Tab */}
          <TabsContent value="provide" className="space-y-4">
            {selectedPool ? (
              <ProvideLiquidityForm pool={selectedPool} />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No pool selected</AlertTitle>
                    <AlertDescription>
                      Search for pools in the "Find Pools" tab and select one to provide liquidity.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Create Pool Tab */}
          <TabsContent value="create" className="space-y-4">
            <CreatePoolForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

