import Head from 'next/head';
import Header from '@/components/Header';
import Explore from '@/components/Explore';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Explore Tokens - Mayhem</title>
        <meta name="description" content="Discover new tokens, graduating tokens, and bonded tokens on Pump.fun" />
      </Head>

      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Explore Tokens</h1>
          <p className="text-muted-foreground">
            Discover new launches, tokens about to graduate, and fully bonded tokens
          </p>
        </div>

        <Explore />
      </div>
    </div>
  );
}

