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
    setShowModal(true);
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
        <title>Login - Fun Launch</title>
      </Head>

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
            Fun Launch
          </h1>
          <p className="text-muted-foreground">
            Launch, trade, and discover the next big memecoin on Solana.
          </p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Connect your wallet or sign in to get started.
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                disabled={isLoading}
                onClick={() => handleSocialLogin('google')}
                className="h-11"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                )}
                Google
              </Button>
              <Button 
                variant="outline" 
                disabled={isLoading}
                onClick={() => handleSocialLogin('twitter')}
                className="h-11"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="twitter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.21 47.41 12.612-28.252-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>
                )}
                Twitter
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              By connecting, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

