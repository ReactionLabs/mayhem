import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { z } from 'zod';
import Header from '../components/Header';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Keypair, VersionedTransaction, Connection, SystemProgram, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
// @ts-ignore - bn.js types
import BN from 'bn.js';
import { PumpFunSDK } from '@/lib/pump-fun';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { toast } from 'sonner';
import { ImageIcon, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/Checkbox';

// Define the schema for form validation
const poolSchema = z.object({
  tokenName: z.string().min(3, 'Token name must be at least 3 characters'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  description: z.string().optional(),
  tokenLogo: z.instanceof(File, { message: 'Token logo is required' }).optional(),
  initialBuyAmount: z.number().min(0).optional().default(0),
  website: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
  telegram: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
});

interface FormValues {
  tokenName: string;
  tokenSymbol: string;
  description?: string;
  tokenLogo: File | undefined;
  initialBuyAmount: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  // Autosell settings
  autosellEnabled: boolean;
  autosellMarketCap?: number;
  autosellTimer?: number; // in minutes
  autosellVolume?: number;
  autosellType?: 'marketcap' | 'timer' | 'volume';
}

// Component to display estimated tokens user will receive
const EstimatedTokensDisplay = ({ initialBuyAmount }: { initialBuyAmount: number }) => {
  // Pump.fun bonding curve starts with:
  // - Virtual SOL reserves: 0 (or very small, typically 0.01 SOL)
  // - Virtual Token reserves: 1,000,000,000 (1 billion tokens with 6 decimals)
  const INITIAL_VIRTUAL_SOL = new BN(0.01 * 1e9); // 0.01 SOL in lamports
  const INITIAL_VIRTUAL_TOKENS = new BN(1_000_000_000 * 1e6); // 1 billion tokens with 6 decimals
  
  const estimatedTokens = useMemo(() => {
    if (initialBuyAmount <= 0) return 0;
    
    try {
      const solAmountLamports = new BN(initialBuyAmount * 1e9);
      const tokensOut = PumpFunSDK.calculateBuyQuote(
        solAmountLamports,
        INITIAL_VIRTUAL_SOL,
        INITIAL_VIRTUAL_TOKENS
      );
      
      // Convert from raw token amount (with decimals) to human-readable
      return tokensOut.toNumber() / 1e6; // 6 decimals
    } catch {
      return 0;
    }
  }, [initialBuyAmount]);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Est. Tokens</span>
        <span className="font-bold text-lg">
          {estimatedTokens.toLocaleString(undefined, { 
            maximumFractionDigits: 0 
          })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground/70 mt-2">
        Estimated tokens you'll receive based on bonding curve
      </p>
    </div>
  );
};

// Component for autosell settings
const AutosellSettings = ({ form }: { form: any }) => {
  const [autosellEnabled, setAutosellEnabled] = useState(false);
  const [autosellType, setAutosellType] = useState<'marketcap' | 'timer' | 'volume'>('marketcap');
  const [marketCap, setMarketCap] = useState('');
  const [timer, setTimer] = useState('');
  const [volume, setVolume] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="autosell-enabled"
          checked={autosellEnabled}
          onCheckedChange={(checked) => setAutosellEnabled(checked === true)}
        />
        <label htmlFor="autosell-enabled" className="text-sm font-medium cursor-pointer">
          Enable Autosell
        </label>
      </div>

      {autosellEnabled && (
        <div className="space-y-3 pl-6 border-l-2 border-border">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">Trigger Type</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={autosellType === 'marketcap' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutosellType('marketcap')}
                className="flex-1"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Market Cap
              </Button>
              <Button
                type="button"
                variant={autosellType === 'timer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutosellType('timer')}
                className="flex-1"
              >
                <Clock className="w-3 h-3 mr-1" />
                Timer
              </Button>
              <Button
                type="button"
                variant={autosellType === 'volume' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutosellType('volume')}
                className="flex-1"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Volume
              </Button>
            </div>
          </div>

          {autosellType === 'marketcap' && (
            <div className="space-y-2">
              <label htmlFor="marketcap" className="text-xs text-muted-foreground block">
                Market Cap (USD)
              </label>
              <Input
                id="marketcap"
                type="number"
                placeholder="e.g., 50000"
                value={marketCap}
                onChange={(e) => setMarketCap(e.target.value)}
                className="h-9"
              />
            </div>
          )}

          {autosellType === 'timer' && (
            <div className="space-y-2">
              <label htmlFor="timer" className="text-xs text-muted-foreground block">
                Time (minutes)
              </label>
              <Input
                id="timer"
                type="number"
                placeholder="e.g., 60"
                value={timer}
                onChange={(e) => setTimer(e.target.value)}
                className="h-9"
              />
            </div>
          )}

          {autosellType === 'volume' && (
            <div className="space-y-2">
              <label htmlFor="volume" className="text-xs text-muted-foreground block">
                Volume (USD)
              </label>
              <Input
                id="volume"
                type="number"
                placeholder="e.g., 100000"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="h-9"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground/70">
            Token will automatically sell when condition is met
          </p>
        </div>
      )}
    </div>
  );
};

export default function CreatePool() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { setShowModal } = useUnifiedWalletContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [poolCreated, setPoolCreated] = useState(false);
  const [createdTokenMint, setCreatedTokenMint] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoDragActive, setLogoDragActive] = useState(false);

  const form = useForm({
    defaultValues: {
      tokenName: '',
      tokenSymbol: '',
      description: '',
      tokenLogo: undefined,
      initialBuyAmount: 0,
      website: '',
      twitter: '',
      telegram: '',
    } as FormValues,
    onSubmit: async ({ value }) => {
      try {
        if (!publicKey || !signTransaction) {
            setShowModal(true);
            return;
        }

        setIsLoading(true);
        const { tokenLogo } = value;
        
        if (!tokenLogo) {
          toast.error('Token logo is required');
          return;
        }

        // 1. Generate a new mint keypair for the token
        const mintKeypair = Keypair.generate();
        const mintAddress = mintKeypair.publicKey.toBase58();

        // 2. Upload metadata via our API (server -> Pump.fun IPFS)
        const convertToBase64 = (file: File) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result;
              if (typeof result === 'string') {
                resolve(result);
              } else {
                reject(new Error('Failed to read file'));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });

        const base64Logo = await convertToBase64(tokenLogo);

        toast.loading('Uploading metadata...');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenLogo: base64Logo,
            tokenName: value.tokenName,
            tokenSymbol: value.tokenSymbol,
            description: value.description,
            twitter: value.twitter,
            telegram: value.telegram,
            website: value.website,
          }),
        });

        if (!uploadResponse.ok) {
          const err = await uploadResponse.json().catch(() => ({}));
          toast.dismiss();
          throw new Error(err.error || err.message || 'Failed to upload token metadata. Please try again.');
        }

        const { metadataUri } = await uploadResponse.json();
        toast.dismiss();
        
        // 3. Create Pump.fun Launch Transaction via PumpPortal API
        // Note: PumpPortal allows creating a transaction bundle for launch
        toast.loading("Constructing launch transaction...");

        const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "publicKey": publicKey.toBase58(),
                "action": "create",
                "tokenMetadata": {
                    name: value.tokenName,
                    symbol: value.tokenSymbol,
                    uri: metadataUri
                },
                "mint": mintAddress,
                "denominatedInSol": "true",
                "amount": value.initialBuyAmount || 0, // Initial buy amount
                "slippage": 10, 
                "priorityFee": 0.005,
                "pool": "pump"
            })
        });

        if(response.status === 200){
            const data = await response.arrayBuffer();
            const tx = VersionedTransaction.deserialize(new Uint8Array(data));

            // Sign with the Mint Keypair (required for creation)
            tx.sign([mintKeypair]);
            
            // Send service fee (0.05 SOL) to Mayhem platform
            // This fee is separate from blockchain fees and goes to the platform
            const SERVICE_FEE_AMOUNT = 0.05; // 0.05 SOL service fee
            const SERVICE_FEE_RECIPIENT = new PublicKey('Cdnz7Nf47SnVW6NGy3jSqeCv6Bhb6TkzDhppAzyxTm2Z');
            
            const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com");
            
            // Send service fee as separate transaction first
            toast.dismiss();
            toast.loading("Sending service fee...");
            
            const feeTx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: SERVICE_FEE_RECIPIENT,
                lamports: SERVICE_FEE_AMOUNT * LAMPORTS_PER_SOL,
              })
            );
            
            const feeSignature = await sendTransaction(feeTx, connection);
            await connection.confirmTransaction(feeSignature, 'confirmed');
            
            // Request User Signature for main transaction
            toast.dismiss();
            toast.loading("Please sign the launch transaction...");
            
            // Send main launch transaction
            await sendTransaction(tx, connection);
            
            toast.dismiss();
            toast.success("Launch Successful!");
            setCreatedTokenMint(mintAddress);
            setPoolCreated(true);
        } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.message || "Failed to create launch transaction");
        }
      } catch (error) {
        toast.dismiss();
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to launch token. Please check your wallet connection and try again.';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = poolSchema.safeParse(value);
        if (!result.success) {
          return result.error.formErrors.fieldErrors;
        }
        return undefined;
      },
    },
  });

  const updateLogoPreview = (file: File | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <Head>
        <title>Launch on Pump.fun - Fun Launch</title>
      </Head>

      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Header />

        <main className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">Launch on Pump.fun</h1>
              <p className="text-muted-foreground">Create a new token and launch instantly on the bonding curve.</p>
            </div>
          </div>

          {poolCreated && !isLoading ? (
            <PoolCreationSuccess mint={createdTokenMint} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: Form */}
              <div className="flex-1 min-w-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                  }}
                  className="space-y-8"
                >
                  <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
                    <h2 className="text-2xl font-bold mb-6">Token Details</h2>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Token Name*</label>
                          {form.Field({
                            name: 'tokenName',
                            children: (field) => (
                              <input
                                name={field.name}
                                type="text"
                                className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="e.g. Fun Coin"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                required
                              />
                            ),
                          })}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Token Symbol*</label>
                          {form.Field({
                            name: 'tokenSymbol',
                            children: (field) => (
                              <input
                                name={field.name}
                                type="text"
                                className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="e.g. FUN"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                required
                              />
                            ),
                          })}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                          {form.Field({
                            name: 'description',
                            children: (field) => (
                              <textarea
                                name={field.name}
                                className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary min-h-[100px]"
                                placeholder="Describe your token project..."
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                              />
                            ),
                          })}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Token Logo*</label>
                          {form.Field({
                            name: 'tokenLogo',
                            children: (field) => (
                              <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center h-[220px] flex flex-col items-center justify-center relative overflow-hidden group transition ${
                                  logoDragActive ? 'border-primary bg-primary/10' : 'border-border'
                                }`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setLogoDragActive(true);
                                }}
                                onDragLeave={() => setLogoDragActive(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setLogoDragActive(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) {
                                    field.handleChange(file);
                                    updateLogoPreview(file);
                                  }
                                }}
                                onClick={() => document.getElementById('tokenLogoInput')?.click()}
                              >
                                {previewUrl ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                     <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                     <button
                                         type="button"
                                         onClick={(e) => {
                                            e.preventDefault();
                                            field.handleChange(undefined);
                                            updateLogoPreview(undefined);
                                         }}
                                         className="relative z-10 text-xs text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600"
                                     >
                                         Remove
                                     </button>
                                  </div>
                                ) : (
                                  <>
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mb-1">PNG • JPG • SVG (≥ 1000x1000px)</p>
                                    <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm cursor-pointer mt-2">
                                      Drag & Drop or Click to Browse
                                    </div>
                                  </>
                                )}
                                <input
                                  type="file"
                                  id="tokenLogoInput"
                                  className="hidden"
                                  accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      field.handleChange(file);
                                      updateLogoPreview(file);
                                    }
                                  }}
                                />
                              </div>
                            ),
                          })}
                          <p className="text-[11px] text-muted-foreground mt-2">Recommended: Square image at least 1000x1000px for best fidelity on Pump.fun cards.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
                     <h2 className="text-2xl font-bold mb-4">Launch Configuration</h2>
                     <div className="mb-6">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Initial Buy Amount (SOL)</label>
                      {form.Field({
                        name: 'initialBuyAmount',
                        children: (field) => (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full p-3 bg-background border border-input rounded-lg"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                          />
                        ),
                      })}
                      <p className="text-xs text-muted-foreground mt-1">Optional: Buy some tokens immediately for yourself.</p>
                    </div>
                  </div>
                  
                  <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
                    <h2 className="text-2xl font-bold mb-6">Socials (Optional)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {['website', 'twitter', 'telegram'].map((social) => (
                            <div key={social}>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 capitalize">{social}</label>
                                {form.Field({
                                    // @ts-ignore
                                    name: social,
                                    children: (field) => (
                                        <input
                                            // @ts-ignore
                                            name={field.name}
                                            type="url"
                                            className="w-full p-3 bg-background border border-input rounded-lg"
                                            placeholder={`https://${social === 'twitter' ? 'twitter.com/' : ''}...`}
                                            // @ts-ignore
                                            value={field.state.value}
                                            // @ts-ignore
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    )
                                })}
                            </div>
                         ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <SubmitButton isSubmitting={isLoading} />
                  </div>
                </form>
              </div>

              {/* Right Column: Launch Info */}
              <div className="lg:w-[350px] space-y-6 sticky top-24 h-fit">
                 <div className="bg-secondary/20 rounded-xl p-6 border border-border/50">
                   <h3 className="text-sm font-bold mb-3 text-foreground">Cost Summary</h3>
                   <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Pump.fun Fee</span>
                       <span>~0.02 SOL</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Service Fee</span>
                       <span>0.05 SOL</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Initial Buy</span>
                       <span>{form.getFieldValue('initialBuyAmount') || 0} SOL</span>
                     </div>
                     <div className="border-t border-border my-2 pt-2 flex justify-between font-bold">
                        <span>Est. Total</span>
                        <span>{(0.07 + (form.getFieldValue('initialBuyAmount') || 0)).toFixed(3)} SOL</span>
                     </div>
                   </div>
                 </div>

                 {/* Estimated Tokens */}
                 {form.getFieldValue('initialBuyAmount') > 0 && (
                   <div className="bg-secondary/20 rounded-xl p-6 border border-border/50">
                     <h3 className="text-sm font-bold mb-3 text-foreground">Estimated Tokens</h3>
                     <EstimatedTokensDisplay initialBuyAmount={form.getFieldValue('initialBuyAmount') || 0} />
                   </div>
                 )}

                 {/* Autosell Settings */}
                 <div className="bg-secondary/20 rounded-xl p-6 border border-border/50">
                   <h3 className="text-sm font-bold mb-3 text-foreground">Autosell Settings</h3>
                   <AutosellSettings form={form} />
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const SubmitButton = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { publicKey } = useWallet();
  const { setShowModal } = useUnifiedWalletContext();

  if (!publicKey) {
    return (
      <Button type="button" onClick={() => setShowModal(true)} className="w-full py-6 text-lg">
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button className="w-full py-6 text-lg font-bold bg-green-500 hover:bg-green-600 text-white" type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Launching...' : '🚀 Launch on Pump.fun'}
    </Button>
  );
};

const PoolCreationSuccess = ({ mint }: { mint: string }) => {
  return (
    <div className="bg-card rounded-xl p-12 border border-border shadow-sm text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-4">Token Launched!</h2>
        <p className="text-muted-foreground mb-8">
          Your token is now live on Pump.fun bonding curve.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={`/token/${mint}`} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold hover:opacity-90">
            View Chart & Trade
          </Link>
        </div>
    </div>
  );
};
