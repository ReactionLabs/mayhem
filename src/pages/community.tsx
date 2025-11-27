import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import CommunityWalletInfo from '../components/CommunityWalletInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  TrendingUp,
  Users,
  Rocket,
  Heart,
  Target,
  Award,
  Gift
} from 'lucide-react';

export default function CommunityPage() {
  return (
    <>
      <Head>
        <title>Community | Mayhem</title>
        <meta name="description" content="Mayhem Community Treasury and Fee Information" />
      </Head>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Mayhem Community</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transparency, community-driven development, and sustainable growth through platform fees.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Community Wallet */}
            <div className="lg:col-span-1">
              <CommunityWalletInfo />
            </div>

            {/* Stats and Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fee Transparency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Fee Transparency
                  </CardTitle>
                  <CardDescription>
                    All platform fees are clearly disclosed and go directly to community development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Token Launch Fees</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>PumpPortal Launch:</span>
                          <Badge variant="outline">0.05 SOL</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Service Fee:</span>
                          <Badge variant="outline">0.05 SOL</Badge>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total:</span>
                          <Badge>0.10 SOL</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Trading Fees</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Swap Fee:</span>
                          <Badge variant="outline">0.5%</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Destination:</span>
                          <Badge variant="outline">Community Wallet</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Community Benefits
                  </CardTitle>
                  <CardDescription>
                    How community fees are reinvested back into the ecosystem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Platform Development</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        New features, bug fixes, and performance improvements
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Community Rewards</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Airdrops and rewards for active community members
                    </p>

                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">DEX Fee Coverage</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Covering DEX listing fees for qualified projects
                    </p>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Liquidity Incentives</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bootstrapping liquidity for promising tokens
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* DEX Fee Coverage Request */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-500" />
                DEX Fee Coverage Program
              </CardTitle>
              <CardDescription>
                Qualified projects can request the community to cover their DEX listing fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Eligibility Requirements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>3+ successful token launches (MC &gt; $10k)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>$1,000+ trading volume on platform</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Active community engagement</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>30+ days as platform member</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Supported DEXs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-medium">Raydium</span>
                      <Badge variant="secondary">0.02 SOL</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-medium">Meteora</span>
                      <Badge variant="secondary">0.01 SOL</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-medium">Orca</span>
                      <Badge variant="secondary">0.02 SOL</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about the DEX fee coverage program or want to apply?
                </p>
                <Button variant="outline" className="mr-4">
                  Learn More
                </Button>
                <Button>
                  Apply for Coverage
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
