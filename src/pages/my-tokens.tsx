import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';

type TokenRecord = {
  timestamp: string;
  name: string;
  ticker: string;
  contractAddress: string;
  initialBuyInSOL: number;
  initialBuyInUSD: number;
  initialMarketCapSOL: number;
  initialMarketCapUSD: number;
  metadataUri?: string;
  creatorWallet?: string;
  ath?: number;
  currentPrice?: number;
};

type TokenCardProps = {
  token: TokenRecord;
};

const TokenCard = ({ token }: TokenCardProps) => {
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Resolve image from metadata URI
  useEffect(() => {
    if (!token.metadataUri) return;

    const resolveImage = async () => {
      try {
        const response = await fetch(token.metadataUri!);
        if (!response.ok) return;
        const data = await response.json();
        setImageUrl(data?.image || data?.logo || data?.imageUrl || null);
      } catch (error) {
        // Silently fail
      }
    };

    resolveImage();
  }, [token.metadataUri]);

  const copyAddress = () => {
    navigator.clipboard.writeText(token.contractAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '--';
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  };

  return (
    <Card className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Token Image */}
          <div className="relative shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={token.name}
                className="w-16 h-16 rounded-lg object-cover border border-border"
                onError={() => setImageUrl(null)}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center border border-border">
                <span className="text-2xl font-bold text-muted-foreground">
                  {token.ticker?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg truncate">{token.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {token.ticker}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyAddress}
                  title="Copy contract address"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/token/${token.contractAddress}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="View token"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contract Address */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground font-mono">
                {shortenAddress(token.contractAddress)}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ATH</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <p className="text-sm font-semibold">
                    {formatPrice(token.ath)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-sm font-semibold">
                  {formatPrice(token.currentPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MyTokensPage() {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      setTokens([]);
      return;
    }

    const fetchTokens = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/my-tokens?wallet=${publicKey.toBase58()}`
        );
        
        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Invalid wallet address');
          }
          throw new Error(`Failed to fetch tokens: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.tokens || data.tokens.length === 0) {
          setTokens([]);
          setLoading(false);
          return;
        }

        const tokensWithPrice: TokenRecord[] = await Promise.all(
          (data.tokens || []).map(async (token: TokenRecord) => {
            try {
              const priceResponse = await fetch(
                `/api/token-ath?mint=${token.contractAddress}`
              );
              if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                return {
                  ...token,
                  ath: priceData.ath,
                  currentPrice: priceData.currentPrice,
                };
              }
            } catch (error) {
              // Silently fail price fetch
            }
            return token;
          })
        );

        setTokens(tokensWithPrice);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching tokens:', error);
        }
        const errorMessage = error instanceof Error ? error.message : 'Failed to load your tokens';
        toast.error(errorMessage);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>My Tokens - Mayhem</title>
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tokens</h1>
          <p className="text-muted-foreground">
            All tokens you&apos;ve created on Mayhem
          </p>
        </div>

        {!publicKey ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to view your created tokens
              </p>
              <Button onClick={() => {
                // Trigger wallet connection modal
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wallet:connect'));
                }
              }}>
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-16 w-16 rounded-lg bg-secondary mb-4" />
                    <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any tokens yet
              </p>
              <Link href="/launchpad">
                <Button>Create Your First Token</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <TokenCard key={token.contractAddress} token={token} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

