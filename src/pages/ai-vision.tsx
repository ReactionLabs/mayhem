import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { AIVisionChatbot } from '@/components/AIVisionChatbot';

export default function AIVisionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>AI Vision Chatbot | Mayhem</title>
        <meta name="description" content="Transform your ideas into stunning visuals, titles, and descriptions with AI" />
      </Head>

      <Header />

      <main className="container mx-auto py-8">
        <AIVisionChatbot />
      </main>
    </div>
  );
}
