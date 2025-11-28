import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@jup-ag/wallet-adapter';
import { 
  ArrowRight, 
  TrendingUp, 
  Download, 
  Zap, 
  Users, 
  Rocket,
  DollarSign,
  Repeat,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';

type Token = {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  dex: string;
  pairAddress: string;
};

export default function HomePage() {
  const { publicKey } = useWallet();
  const [topTokens, setTopTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopTokens = async () => {
      try {
        const response = await fetch('/api/top-tokens');
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        const data = await response.json();
        
        if (data.success && data.tokens) {
          setTopTokens(data.tokens);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching top tokens:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopTokens();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Mayhem - Launch, Trade, Profit</title>
        <meta name="description" content="Seamless crypto onboarding. Launch tokens, trade instantly, convert profits. All in one place." />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Launch. Trade. Profit.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Seamless crypto onboarding. Download wallet, buy, sell, convert, and repeat for profits. 
              Launching and trading together—communities united.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!publicKey ? (
                <>
                  <Button size="lg" className="text-lg px-8" asChild>
                    <Link href="/sign-up">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                    <Link href="/sign-in">
                      Sign In
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Flow */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Your Seamless Crypto Journey
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Download</h3>
                <p className="text-sm text-muted-foreground">
                  Get a Solana wallet (Phantom, Solflare) to start your journey
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Buy</h3>
                <p className="text-sm text-muted-foreground">
                  Purchase tokens instantly with top liquidity pools
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Sell</h3>
                <p className="text-sm text-muted-foreground">
                  Take profits when ready with lightning-fast execution
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Repeat className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">4. Convert & Repeat</h3>
                <p className="text-sm text-muted-foreground">
                  Convert profits and repeat the cycle for maximum gains
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Top Tokens Section */}
      <section className="container mx-auto px-4 py-16 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Top Tokens</h2>
              <p className="text-muted-foreground">
                Trade the hottest tokens on Solana right now
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="h-12 w-12 rounded-full bg-secondary mb-3" />
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topTokens.map((token) => (
                <Link key={token.mint} href={`/token/${token.mint}`}>
                  <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {token.logoURI ? (
                            <img
                              src={token.logoURI}
                              alt={token.name}
                              className="w-12 h-12 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                              {token.symbol[0]}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{token.name}</h3>
                            <p className="text-sm text-muted-foreground">{token.symbol}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {token.dex}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-semibold">
                            ${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">24h Change</span>
                          <span className={token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volume 24h</span>
                          <span className="font-semibold">
                            ${(token.volume24h / 1e6).toFixed(2)}M
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No tokens available at the moment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything You Need in One Place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <Rocket className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-xl mb-2">Launch Tokens</h3>
                <p className="text-muted-foreground">
                  Create and launch your token on Pump.fun with full control over tokenomics
                </p>
                <Button variant="link" className="mt-4 p-0" asChild>
                  <Link href="/create-pool">
                    Launch Now <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Zap className="h-10 w-10 text-yellow-500 mb-4" />
                <h3 className="font-semibold text-xl mb-2">Lightning Trading</h3>
                <p className="text-muted-foreground">
                  Trade with instant execution and minimal slippage across all major DEXs
                </p>
                <Button variant="link" className="mt-4 p-0" asChild>
                  <Link href="/dashboard">
                    Start Trading <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-blue-500 mb-4" />
                <h3 className="font-semibold text-xl mb-2">Join Communities</h3>
                <p className="text-muted-foreground">
                  Launching and trading together—we couldn't have one without the other
                </p>
                <Button variant="link" className="mt-4 p-0" asChild>
                  <Link href="/dashboard">
                    Explore <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Crypto Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of traders launching and trading tokens together. 
                Get your idea out there before someone else does.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!publicKey ? (
                  <>
                    <Button size="lg" className="text-lg px-8" asChild>
                      <Link href="/sign-up">
                        Create Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                      <Link href="/launchpad">
                        Launch Token
                        <Rocket className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button size="lg" className="text-lg px-8" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
