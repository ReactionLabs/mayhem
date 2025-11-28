import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { useWallet, useConnection } from '@jup-ag/wallet-adapter'; // Corrected import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Wallet, CreditCard, History, Settings, Twitter, Copy, Plus, Trash2, ExternalLink, RefreshCw, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { RealTimePnLSummary } from '@/components/RealTimePnLSummary';
import { shortenAddress } from '@/lib/utils';
import { toast } from 'sonner';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// --- Types ---
type TrackedWallet = {
  address: string;
  label: string;
};

type TrackedTwitter = {
  handle: string;
};

type GeneratedWallet = {
  publicKey: string;
  privateKey: string;
  label: string;
  apiKey: string; // PumpPortal API key (required)
  createdAt: string; // ISO timestamp
};

// --- Components ---

const WalletBalance = ({ address }: { address: string }) => {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address || !connection) return; // Added connection check
    
    let isMounted = true;

    const fetchBalance = async () => {
      try {
        const pubKey = new PublicKey(address);
        const bal = await connection.getBalance(pubKey);
        if (isMounted) {
            setBalance(bal / LAMPORTS_PER_SOL);
        }
      } catch (e) {
        // Silently fail - balance is optional
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching balance", e);
        }
      }
    };
    
    fetchBalance();
    const id = setInterval(fetchBalance, 10000);
    return () => {
        isMounted = false;
        clearInterval(id);
    };
  }, [address, connection]);

  return (
    <div className="text-2xl font-bold">
      {balance !== null ? `${balance.toFixed(4)} SOL` : <span className="animate-pulse">...</span>}
    </div>
  );
};

export default function PortfolioPage() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Tracking State
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [newWalletInput, setNewWalletInput] = useState("");
  
  const [trackedTwitter, setTrackedTwitter] = useState<TrackedTwitter[]>([]);
  const [newTwitterInput, setNewTwitterInput] = useState("");

  // Copy Trader State
  const [copyTarget, setCopyTarget] = useState("");
  const [isCopyTrading, setIsCopyTrading] = useState(false);

  // Generated Wallets (Bot Wallets)
  const [generatedWallets, setGeneratedWallets] = useState<GeneratedWallet[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Load from LocalStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem('tracked_wallets');
    if (savedWallets) setTrackedWallets(JSON.parse(savedWallets));

    const savedTwitter = localStorage.getItem('tracked_twitter');
    if (savedTwitter) setTrackedTwitter(JSON.parse(savedTwitter));

    const savedGenerated = localStorage.getItem('my_generated_wallets');
    if (savedGenerated) setGeneratedWallets(JSON.parse(savedGenerated));
  }, []);

  // Save helpers
  const saveTrackedWallets = (wallets: TrackedWallet[]) => {
    setTrackedWallets(wallets);
    localStorage.setItem('tracked_wallets', JSON.stringify(wallets));
  };

  const saveTrackedTwitter = (handles: TrackedTwitter[]) => {
    setTrackedTwitter(handles);
    localStorage.setItem('tracked_twitter', JSON.stringify(handles));
  };

  const saveGeneratedWallets = (wallets: GeneratedWallet[]) => {
    setGeneratedWallets(wallets);
    localStorage.setItem('my_generated_wallets', JSON.stringify(wallets));
  };

  // Actions
  const addTrackedWallet = () => {
    if (!newWalletInput) return;
    const newWallets = [...trackedWallets, { address: newWalletInput, label: `Wallet ${trackedWallets.length + 1}` }];
    saveTrackedWallets(newWallets);
    setNewWalletInput("");
    toast.success("Wallet added to tracker");
  };

  const removeTrackedWallet = (idx: number) => {
    const newWallets = [...trackedWallets];
    newWallets.splice(idx, 1);
    saveTrackedWallets(newWallets);
  };

  const addTwitter = () => {
    if (!newTwitterInput) return;
    const newTwitters = [...trackedTwitter, { handle: newTwitterInput.replace('@', '') }];
    saveTrackedTwitter(newTwitters);
    setNewTwitterInput("");
    toast.success("Twitter handle added");
  };

  const removeTwitter = (idx: number) => {
    const newTwitters = [...trackedTwitter];
    newTwitters.splice(idx, 1);
    saveTrackedTwitter(newTwitters);
  };

  const createNewBotWallet = async () => {
    try {
      toast.loading("Generating wallet...");
      const response = await fetch('https://pumpportal.fun/api/create-wallet', {
        method: 'POST', // Changed to POST to match the working implementation
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create wallet: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('PumpPortal wallet creation response:', data);
      }

      // Handle PumpPortal API field name variations: walletPublicKey vs publicKey
      const publicKey = data.publicKey || data.walletPublicKey || data.address;
      const privateKey = data.privateKey || data.secretKey;
      const apiKey = data.apiKey || data.api;

      if (!publicKey || !privateKey || !apiKey) {
        throw new Error(`Invalid wallet data received from PumpPortal. Got keys: ${JSON.stringify(Object.keys(data))}`);
      }
      
      const newWallet: GeneratedWallet = {
        publicKey,
        privateKey,
        apiKey,
        label: `Bot Wallet ${generatedWallets.length + 1}`,
        createdAt: new Date().toISOString(),
      };

      const updated = [...generatedWallets, newWallet];
      saveGeneratedWallets(updated);
      
      toast.dismiss();
      toast.success("New Lightning Wallet Created", {
        description: "Wallet and API key saved to local storage",
      });
    } catch (e) {
      toast.dismiss();
      const errorMessage = e instanceof Error ? e.message : "Failed to generate wallet";
      toast.error(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error("Wallet creation error:", e);
      }
    }
  };
  
  const toggleKeyVisibility = (pubKey: string) => {
    setShowKeys(prev => ({ ...prev, [pubKey]: !prev[pubKey] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Portfolio & Tools - Fun Launch</title>
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation (Desktop) */}
          <div className="w-full md:w-64 space-y-2 shrink-0">
            <h1 className="text-2xl font-bold mb-6 px-2">My Hub</h1>
            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-4 md:pb-0">
              {[
                { id: 'overview', label: 'Overview', icon: CreditCard },
                { id: 'wallets', label: 'My Wallets', icon: Wallet },
                { id: 'tracker', label: 'Trackers', icon: TrendingUp },
                { id: 'social', label: 'Social', icon: Twitter },
                { id: 'copytrade', label: 'Copy Trade', icon: RefreshCw },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              
              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Main Wallet Balance</CardDescription>
                      <CardTitle>
                        {publicKey ? <WalletBalance address={publicKey.toBase58()} /> : "Not Connected"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {publicKey ? shortenAddress(publicKey.toBase58()) : "Connect wallet to view"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Portfolio Value</CardDescription>
                      <CardTitle>
                        {publicKey ? (
                          <RealTimePnLSummary />
                        ) : (
                          "Not Connected"
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {publicKey ? "Real-time P&L tracking" : "Connect wallet to view"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Active Bot Wallets</CardDescription>
                      <CardTitle>{generatedWallets.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Managed personal wallets</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent trades and transactions across all wallets.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-secondary/10 rounded-lg border border-dashed">
                      <History className="w-8 h-8 mb-2 opacity-50" />
                      <p>No recent activity found</p>
                      <p className="text-xs">(Transaction history coming soon)</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* WALLETS TAB */}
              <TabsContent value="wallets" className="space-y-6 mt-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">My Lightning Wallets</h2>
                    <p className="text-muted-foreground text-sm">
                      Create on-chain wallets via PumpPortal. API keys are stored locally.
                    </p>
                  </div>
                  <Button onClick={createNewBotWallet} className="gap-2">
                    <Plus className="w-4 h-4" /> Create Lightning Wallet
                  </Button>
                </div>

                <div className="grid gap-4">
                  {generatedWallets.map((wallet, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardHeader className="bg-secondary/20 py-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-primary" />
                          <span className="font-bold text-sm">{wallet.label}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                             const newWallets = [...generatedWallets];
                             newWallets.splice(idx, 1);
                             saveGeneratedWallets(newWallets);
                             toast.success("Wallet removed");
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div>
                           <label className="text-[10px] uppercase text-muted-foreground font-bold">Balance</label>
                           <WalletBalance address={wallet.publicKey} />
                        </div>
                        <div className="grid gap-2">
                          <div className="bg-background p-2 rounded border flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground w-16">Public</span>
                            <code className="text-xs flex-1 truncate">{wallet.publicKey}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(wallet.publicKey)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="bg-destructive/5 p-2 rounded border border-destructive/20 flex items-center gap-2">
                            <span className="text-xs font-mono text-destructive w-16">Private</span>
                            <code className="text-xs flex-1 truncate text-destructive">
                              {showKeys[wallet.publicKey] ? wallet.privateKey : '••••••••••••••••••••••••••••••••'}
                            </code>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => toggleKeyVisibility(wallet.publicKey)}>
                              {showKeys[wallet.publicKey] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => navigator.clipboard.writeText(wallet.privateKey)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {generatedWallets.length === 0 && (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
                      No personal wallets created yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TRACKER TAB */}
              <TabsContent value="tracker" className="space-y-6 mt-0">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Wallet Tracker */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Wallet Watchlist
                      </h3>
                      <p className="text-sm text-muted-foreground">Track whale wallets and smart money.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter Solana Address" 
                        value={newWalletInput}
                        onChange={(e) => setNewWalletInput(e.target.value)}
                      />
                      <Button onClick={addTrackedWallet}>Add</Button>
                    </div>

                    <div className="space-y-2">
                      {trackedWallets.map((wallet, idx) => (
                        <div key={idx} className="bg-card border p-3 rounded-lg flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm">{wallet.label}</span>
                            </div>
                            <code className="text-xs text-muted-foreground truncate block">{wallet.address}</code>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeTrackedWallet(idx)}>
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {trackedWallets.length === 0 && (
                         <p className="text-sm text-muted-foreground italic">No wallets tracked yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SOCIAL TAB */}
              <TabsContent value="social" className="space-y-6 mt-0">
                 <div className="space-y-4 max-w-2xl">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-blue-400" /> Twitter/X Tracker
                      </h3>
                      <p className="text-sm text-muted-foreground">Monitor key influencers and projects.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                        <Input 
                          className="pl-7"
                          placeholder="username" 
                          value={newTwitterInput}
                          onChange={(e) => setNewTwitterInput(e.target.value)}
                        />
                      </div>
                      <Button onClick={addTwitter}>Track</Button>
                    </div>

                    <div className="grid gap-2">
                      {trackedTwitter.map((t, idx) => (
                        <div key={idx} className="bg-card border p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-400/10 rounded-full flex items-center justify-center text-blue-400">
                              <Twitter className="w-4 h-4" />
                            </div>
                            <span className="font-medium">@{t.handle}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeTwitter(idx)}>
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                       {trackedTwitter.length === 0 && (
                         <p className="text-sm text-muted-foreground italic">No accounts tracked yet.</p>
                      )}
                    </div>
                  </div>
              </TabsContent>

              {/* COPY TRADER TAB */}
              <TabsContent value="copytrade" className="space-y-6 mt-0">
                 <Card>
                   <CardHeader>
                     <CardTitle>Copy Trader (Beta)</CardTitle>
                     <CardDescription>Automatically copy trades from a target wallet.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Target Wallet Address</label>
                       <Input 
                         placeholder="Address to copy..." 
                         value={copyTarget}
                         onChange={(e) => setCopyTarget(e.target.value)}
                       />
                     </div>

                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Max Buy Amount (SOL)</label>
                          <Input type="number" placeholder="0.1" />
                        </div>
                         <div className="space-y-2">
                          <label className="text-sm font-medium">Slippage Tolerance (%)</label>
                          <Input type="number" placeholder="10" />
                        </div>
                     </div>

                     <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-500">
                       <p className="font-bold mb-1">Warning</p>
                       Copy trading carries significant risk. Ensure you have sufficient funds and understand that front-running bots may affect execution.
                     </div>
                   </CardContent>
                   <div className="p-6 pt-0">
                     <Button 
                        className={isCopyTrading ? "bg-destructive hover:bg-destructive/90" : "bg-green-500 hover:bg-green-600"}
                        onClick={() => {
                          if (!copyTarget) return toast.error("Enter a target address");
                          setIsCopyTrading(!isCopyTrading);
                          toast.success(isCopyTrading ? "Copy Trading Stopped" : "Copy Trading Active");
                        }}
                     >
                       {isCopyTrading ? "Stop Copying" : "Start Copying"}
                     </Button>
                   </div>
                 </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
