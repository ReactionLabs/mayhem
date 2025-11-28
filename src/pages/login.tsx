import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useWallet, useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Copyable } from '../components/ui/Copyable';

/**
 * Unified Login Page
 * Single entry point for wallet authentication using Jupiter's Unified Wallet Adapter
 * Supports Phantom, Solflare, and other Solana wallets
 */
export default function LoginPage() {
  const { connected, publicKey } = useWallet();
  const { setShowModal } = useUnifiedWalletContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState<{
    publicKey: string;
    privateKey: string;
    apiKey: string;
  } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      // If user is already connected via wallet adapter, redirect to home
      router.push('/');
    }
  }, [connected, publicKey, router]);

  const handleConnectWallet = () => {
    // Use Jupiter's unified wallet modal - supports Phantom, Solflare, and more
    if (setShowModal) {
      setShowModal(true);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'twitter') => {
    setIsLoading(true);
    try {
      // Simulate Social Auth delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate a new wallet via PumpPortal API (or local keypair generation)
      // This simulates "Social Login -> Generate Wallet" flow
      const response = await fetch('https://pumpportal.fun/api/create-wallet');
      if (!response.ok) throw new Error('Failed to generate wallet');
      
      const data = await response.json();
      setGeneratedWallet(data);
      
      toast.success(`Successfully authenticated with ${provider === 'google' ? 'Google' : 'Twitter'}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login failed:', error);
      }
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // In a real app with Clerk/Privy, we would have an authenticated session here.
    // For this demo flow, we assume the user has saved their keys and we treat them as "onboarded".
    // We might want to store the API key in local storage for the PumpTrade widget.
    if (generatedWallet) {
      localStorage.setItem('pump_portal_api_key', generatedWallet.apiKey);
      toast.success('Wallet setup complete!');
      router.push('/');
    }
  };

  if (generatedWallet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
         <Head>
            <title>Account Created - Fun Launch</title>
         </Head>
         <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Account Created!</CardTitle>
              <CardDescription>
                We've generated a dedicated Solana wallet for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive font-bold">IMPORTANT: Save Your Keys</AlertTitle>
                <AlertDescription className="text-destructive/90 text-xs mt-1">
                  This is the <strong>only time</strong> you will see your Private Key. If you lose it, you lose access to your funds. Save it securely immediately.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Public Address (Receive SOL)</label>
                   <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg border border-border">
                      <code className="flex-1 text-xs truncate">{generatedWallet.publicKey}</code>
                      <Copyable copyText={generatedWallet.publicKey} name="Address">
                        {() => <Button size="icon" variant="ghost" className="h-6 w-6"><Copy className="h-3 w-3" /></Button>}
                      </Copyable>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-wider text-destructive font-bold">Private Key (Keep Secret)</label>
                   <div className="flex items-center gap-2 p-2 bg-destructive/5 rounded-lg border border-destructive/20">
                      <code className="flex-1 text-xs truncate text-destructive font-mono">
                        {showPrivateKey ? generatedWallet.privateKey : '•'.repeat(40)}
                      </code>
                      <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-destructive/70 hover:text-destructive">
                         {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Copyable copyText={generatedWallet.privateKey} name="Private Key">
                        {() => <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"><Copy className="h-3 w-3" /></Button>}
                      </Copyable>
                   </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleContinue} className="w-full font-bold gap-2">
                I've Saved My Keys <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
         </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Head>
        <title>Connect Wallet - Mayhem</title>
        <meta name="description" content="Connect your Solana wallet to access Mayhem. Supports Phantom, Solflare, and other Solana wallets." />
      </Head>

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
            Mayhem
          </h1>
          <p className="text-muted-foreground">
            Connect your Solana wallet to launch, trade, and discover tokens
          </p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">Connect Your Wallet</CardTitle>
            <CardDescription className="text-center">
              Use Jupiter&apos;s unified wallet adapter to connect with Phantom, Solflare, or any Solana wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              size="lg" 
              className="w-full font-bold h-12 text-base" 
              onClick={handleConnectWallet}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Connect with Phantom, Solflare, or any Solana wallet
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Your wallet connection is secure and managed by Jupiter&apos;s Unified Wallet Adapter
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

