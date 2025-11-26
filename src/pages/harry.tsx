import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { HarryAgent } from '@/components/HarryAgent';

export default function HarryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Harry - AI Trading Agent | Mayhem</title>
        <meta name="description" content="Meet Harry, your AI trading agent for generating wallets, creating meme coins, and executing trades" />
      </Head>

      <Header />

      <main className="container mx-auto py-8">
        <HarryAgent />
      </main>
    </div>
  );
}
