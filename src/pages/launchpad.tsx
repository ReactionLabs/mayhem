import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { z } from 'zod';
import Header from '../components/Header';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import {
  Keypair,
  VersionedTransaction,
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
// @ts-ignore - bn.js types
import BN from 'bn.js';
import { PumpFunSDK } from '@/lib/pump-fun';
import { useUnifiedWalletContext, useWallet, useConnection } from '@jup-ag/wallet-adapter';
import { toast } from 'sonner';
import {
  ImageIcon,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Coins,
  Lock,
  Unlock,
  FlaskConical,
  Droplet,
  Rocket,
  BadgeCheck,
  Copy,
  Wallet,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { env } from '@/config/env';
import { saveTokenToCSV, TokenRecord } from '@/lib/csv-tracker';

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
  // Advanced Tokenomics
  totalSupply: z.number().min(1000).optional().default(1_000_000_000),
  decimals: z.number().min(0).max(9).optional().default(6),
  revokeMintAuthority: z.boolean().optional().default(true),
  revokeFreezeAuthority: z.boolean().optional().default(true),
  initialLiquidity: z.number().min(0).optional().default(0),
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
  // Advanced Tokenomics
  totalSupply: number;
  decimals: number;
  revokeMintAuthority: boolean;
  revokeFreezeAuthority: boolean;
  initialLiquidity: number;
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

// Meteora Pairing Modal - Clean, professional DeFi interface
const MeteoraPairingModal = ({
  open,
  onOpenChange,
  mintAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mintAddress?: string | null;
}) => {
  const [solLiquidity, setSolLiquidity] = useState('1');
  const [tokenLiquidity, setTokenLiquidity] = useState('1000000');

  const handleLaunch = () => {
    if (!mintAddress) {
      toast.error('Create a custom SPL token first.');
      return;
    }
    const meteoraUrl = `https://app.meteora.ag/pools/create?mint=${mintAddress}`;
    window.open(meteoraUrl, '_blank');
    toast.success('Opening Meteora... make sure to paste your liquidity amounts there.');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Droplet className="w-5 h-5 text-primary" />
            Seed Liquidity Pool
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pair your token with SOL liquidity using Meteora&apos;s trustless pools. Professional-grade DeFi infrastructure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Mint Address Display */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Token Mint Address
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/40 border border-border/60 font-mono text-xs break-all">
                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground/90">
                  {mintAddress || 'Create a token to unlock this'}
                </span>
              </div>
            </div>
          </div>

          {/* Liquidity Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <img 
                  src="/solana-sol-logo.png" 
                  alt="SOL" 
                  className="w-3 h-3 rounded-full object-contain"
                />
                SOL Amount
              </label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={solLiquidity}
                onChange={(e) => setSolLiquidity(e.target.value)}
                placeholder="1.0"
                className="bg-background border-border/60 h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Coins className="w-3 h-3" />
                Token Amount
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={tokenLiquidity}
                onChange={(e) => setTokenLiquidity(e.target.value)}
                placeholder="1000000"
                className="bg-background border-border/60 h-11 font-mono"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground/80">
                  These values are for planning. Meteora will open with your mint prefilled.
                </p>
                <p>
                  Want direct integration? We&apos;re working on auto-building pool transactions directly in-app.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-border/60"
          >
            Cancel
          </Button>
          <Button 
            disabled={!mintAddress} 
            onClick={handleLaunch}
            className="bg-primary hover:bg-primary/90 font-semibold"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Launch on Meteora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export default function Launchpad() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setShowModal } = useUnifiedWalletContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [poolCreated, setPoolCreated] = useState(false);
  const [createdTokenMint, setCreatedTokenMint] = useState<string>('');
  const [dexPaymentModalOpen, setDexPaymentModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [copyTokenAddress, setCopyTokenAddress] = useState('');

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
      // Advanced Tokenomics defaults
      totalSupply: 1_000_000_000,
      decimals: 6,
      revokeMintAuthority: true,
      revokeFreezeAuthority: true,
      initialLiquidity: 0,
      autosellEnabled: false,
    } as FormValues,
    onSubmit: async ({ value }) => {
      try {
        // Validate wallet connection at the start
        if (!publicKey) {
          setShowModal(true);
          toast.error('Please connect your wallet to create a token');
          return;
        }
        
        if (!signTransaction) {
          setShowModal(true);
          toast.error('Wallet not fully connected. Please reconnect your wallet.');
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
        // Reference: https://pumpportal.fun/creation

        if (!connection) {
          throw new Error('Connection unavailable. Please reconnect your wallet.');
        }
        
        if (!publicKey || !signTransaction) {
          setShowModal(true);
          throw new Error('Wallet not connected. Please connect your wallet to sign transactions.');
        }
        
        // Send service fee (0.05 SOL) to Community wallet first
        // This fee supports platform development and goes to the community treasury
        const SERVICE_FEE_AMOUNT = 0.05; // 0.05 SOL service fee
        const SERVICE_FEE_RECIPIENT = new PublicKey(env.communityWallet);
        
        // Re-validate wallet connection before service fee transaction
        if (!publicKey || !sendTransaction || !connection) {
          throw new Error('Wallet connection lost. Please reconnect your wallet and try again.');
        }
        
        toast.dismiss();
        toast.loading("Step 1/3: Paying service fee (0.05 SOL)", {
          description: "Your wallet will prompt you to approve"
        });
        
        try {
          const feeTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: SERVICE_FEE_RECIPIENT,
              lamports: SERVICE_FEE_AMOUNT * LAMPORTS_PER_SOL,
            })
          );
          
          const feeSignature = await sendTransaction(feeTx, connection);
          await connection.confirmTransaction(feeSignature, 'confirmed');
        } catch (error) {
          toast.dismiss();
          if (error instanceof Error && (error.message.includes('User rejected') || error.message.includes('cancelled'))) {
            throw new Error('Service fee transaction was cancelled. Please try again.');
          }
          // Don't disconnect wallet on error - just throw
          throw error;
        }
        
        // Re-validate wallet connection after service fee (before requesting PumpPortal transaction)
        if (!publicKey || !signTransaction || !connection) {
          throw new Error('Wallet connection lost after service fee. Please reconnect your wallet and try again.');
        }
        
        // Request PumpPortal transaction
        toast.dismiss();
        toast.loading("Step 2/3: Creating launch transaction...");

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
                "amount": value.initialBuyAmount || 0, // Initial buy amount in SOL
                "slippage": 10, 
                "priorityFee": 0.0005, // Updated to match PumpPortal docs
                "pool": "meteora",
                "isMayhemMode": "false" // Optional, defaults to false
            })
        });

        if(response.status === 200){
            // Get serialized transaction from PumpPortal
            const data = await response.arrayBuffer();
            const tx = VersionedTransaction.deserialize(new Uint8Array(data));

            // Sign with BOTH mint keypair and user's wallet (required per PumpPortal docs)
            // Reference: https://pumpportal.fun/creation - "creation transaction needs to be signed by mint and creator keypairs"
            
            // First sign with mint keypair
            tx.sign([mintKeypair]);
            
            // Re-validate wallet connection before signing
            if (!publicKey || !signTransaction || !connection) {
              throw new Error('Wallet connection lost. Please reconnect your wallet and try again.');
            }
            
            // Then get user to sign with their wallet
            toast.dismiss();
            toast.loading("Step 3/3: Sign transaction in your wallet", {
              description: "Your wallet (Phantom) will pop up to sign. This pays fees and makes the initial purchase."
            });
            
            // Use signTransaction to get user's signature (adds user's signature to already mint-signed tx)
            let signedTx: VersionedTransaction;
            try {
              // Double-check signTransaction is still available
              if (!signTransaction) {
                throw new Error('Wallet sign function not available. Please reconnect your wallet.');
              }
              signedTx = await signTransaction(tx);
            } catch (error) {
              toast.dismiss();
              if (error instanceof Error && (error.message.includes('User rejected') || error.message.includes('cancelled'))) {
                throw new Error('Transaction signature was cancelled. Please try again.');
              }
              // Check if it's a connection error
              if (error instanceof Error && (error.message.includes('connection') || error.message.includes('disconnect'))) {
                throw new Error('Wallet connection lost during signing. Please reconnect your wallet and try again.');
              }
              throw error;
            }
            
            // Re-validate connection before sending
            if (!connection) {
              throw new Error('Connection lost. Please reconnect your wallet and try again.');
            }
            
            // Send the fully signed transaction to RPC
            toast.dismiss();
            toast.loading("Sending transaction to network...");
            
            const signature = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: false,
                maxRetries: 3,
            });
            
            // Wait for confirmation
            await connection.confirmTransaction(signature, 'confirmed');
            
            // Save token record to CSV
            if (publicKey) {
              try {
                const timestamp = new Date().toISOString();
                const initialBuyInSOL = value.initialBuyAmount || 0;
                const initialBuyInUSD = initialBuyInSOL * 200; // Approximate SOL price
                const initialMarketCapSOL = 0; // Will be updated from on-chain data
                const initialMarketCapUSD = 0;
                
                const tokenRecord: TokenRecord = {
                  timestamp,
                  name: value.tokenName,
                  ticker: value.tokenSymbol,
                  contractAddress: mintAddress,
                  initialBuyInSOL,
                  initialBuyInUSD,
                  initialMarketCapSOL,
                  initialMarketCapUSD,
                  metadataUri,
                  creatorWallet: publicKey.toBase58(),
                };
                
                // Save asynchronously - don't block UI
                await saveTokenToCSV(tokenRecord);
              } catch (error) {
                // Log but don't fail the creation
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to save token record:', error);
                }
              }
            }
            
            toast.dismiss();
            toast.success("Deployment Successful! Your token is live.", {
                description: `Transaction: ${signature.slice(0, 8)}...`
            });
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
        
        // Check if wallet disconnected - but don't force disconnect
        if (errorMessage.includes('connection lost') || errorMessage.includes('reconnect')) {
          toast.error(errorMessage, {
            duration: 5000,
            action: {
              label: 'Reconnect',
              onClick: () => {
                // Trigger wallet reconnect modal
                setShowModal(true);
              }
            }
          });
        } else if (errorMessage.includes('cancelled') || errorMessage.includes('rejected')) {
          toast.error(errorMessage, {
            duration: 3000,
          });
        } else {
          toast.error(errorMessage, {
            duration: 5000,
          });
        }
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

  const [isCreatingCustomToken, setIsCreatingCustomToken] = useState(false);
  const [customMintResult, setCustomMintResult] = useState<{ mint: string; signature: string } | null>(null);

  const handleCreateCustomMint = async () => {
    if (!publicKey || !sendTransaction) {
      setShowModal(true);
      return;
    }
    if (!connection) {
      toast.error('Connection unavailable. Please reconnect your wallet.');
      return;
    }

    const values = form.state.values as FormValues;
    const decimals = values.decimals ?? 6;
    const totalSupply = values.totalSupply ?? 1_000_000_000;

    try {
      setIsCreatingCustomToken(true);
      toast.loading('Creating SPL token...');

      const mintKeypair = Keypair.generate();
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          publicKey,
          values.revokeFreezeAuthority ? null : publicKey
        )
      );

      const associatedToken = await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey);
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedToken,
          publicKey,
          mintKeypair.publicKey
        )
      );

      const supplyBigInt = BigInt(Math.floor(totalSupply));
      const mintAmount = supplyBigInt * BigInt(10) ** BigInt(decimals);

      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedToken,
          publicKey,
          mintAmount
        )
      );

      if (values.revokeMintAuthority) {
        transaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.MintTokens,
            null
          )
        );
      }

      if (values.revokeFreezeAuthority) {
        transaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.FreezeAccount,
            null
          )
        );
      }

      const signature = await sendTransaction(transaction, connection, {
        signers: [mintKeypair],
      });

      await connection.confirmTransaction(signature, 'confirmed');
      toast.dismiss();
      toast.success('Custom SPL token created');
      setCustomMintResult({
        mint: mintKeypair.publicKey.toBase58(),
        signature,
      });
    } catch (error) {
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : 'Failed to create custom token. Please try again.'
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('Custom mint error:', error);
      }
    } finally {
      setIsCreatingCustomToken(false);
    }
  };

  const copyFromExistingToken = async () => {
    if (!copyTokenAddress.trim()) return;

    try {
      setIsLoading(true);
      toast.loading('Fetching token data...');

      // Validate the address format
      const tokenPubkey = new PublicKey(copyTokenAddress.trim());

      // Fetch token metadata using our existing API
      const response = await fetch(`/api/token/${copyTokenAddress}?includeMetadata=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }

      const tokenData = await response.json();

      // Update form with copied data
      form.setFieldValue('tokenName', tokenData.name || '');
      form.setFieldValue('tokenSymbol', tokenData.symbol || '');
      form.setFieldValue('description', tokenData.description || '');

      // If there's an image, we could try to fetch it, but for now just show success
      toast.dismiss();
      toast.success('Token settings copied successfully!', {
        description: `Copied from ${tokenData.name || 'Unknown Token'}`
      });

      setCopyTokenAddress('');

    } catch (error) {
      toast.dismiss();
      toast.error('Failed to copy token data', {
        description: error instanceof Error ? error.message : 'Please check the contract address'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <title>Launchpad - Mayhem</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-neutral-950/50 text-foreground transition-colors duration-300">
        <Header />

        <main className="container mx-auto px-4 py-10 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight">Launchpad</h1>
              </div>
              <p className="text-muted-foreground ml-11">
                Launch your token on Meteora DLMM pools instantly. Your wallet will prompt for signatures to pay fees and seed the pool with market makers.
              </p>
            </div>
          </div>

          {poolCreated && !isLoading ? (
            <PoolCreationSuccess mint={createdTokenMint} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: Form */}
              <div className="flex-1 min-w-0">
                {/* Launch Method Notice */}
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Rocket className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                        Meteora DLMM Launchpad
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Launch your token on Meteora&apos;s Dynamic Liquidity Market Maker (DLMM) pools. Benefit from advanced market makers, dynamic fees, and professional-grade DeFi infrastructure.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                  }}
                  className="space-y-8"
                >
                  {/* Copy Token Feature */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Copy className="h-4 w-4 text-purple-500" />
                      Copy from Existing Token
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Paste any Solana token contract address to copy its settings and metadata
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste token contract address (CA)..."
                        className="flex-1"
                        onChange={(e) => setCopyTokenAddress(e.target.value)}
                        value={copyTokenAddress}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyFromExistingToken}
                        disabled={!copyTokenAddress || isLoading}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Settings
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-border/50 shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      Token Details
                    </h2>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            Token Name*
                            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                              Keep it catchy & memorable
                            </span>
                          </label>
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
                          <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            Token Symbol*
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                              2-5 characters, all caps
                            </span>
                          </label>
                          {form.Field({
                            name: 'tokenSymbol',
                            children: (field) => (
                              <input
                                name={field.name}
                                type="text"
                                className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="e.g. FUN"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
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


                  {/* PumpPortal Launch Configuration */}
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-8 border border-green-500/30 shadow-lg">
                     <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                       <Rocket className="h-5 w-5 text-green-500" />
                       Meteora DLMM Launch
                     </h2>
                     <div className="bg-green-500/5 rounded-lg p-4 mb-6 border border-green-500/20">
                       <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                         🌊 Launch directly on Meteora DLMM pools with market makers
                       </p>
                       <p className="text-xs text-muted-foreground">
                         Your token will be launched instantly with Meteora&apos;s Dynamic Liquidity Market Maker pools, benefiting from advanced market making and dynamic fees.
                       </p>
                     </div>
                     <div className="mb-6">
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Initial Buy Amount (SOL)
                      </label>
                      {form.Field({
                        name: 'initialBuyAmount',
                        children: (field) => (
                          <div className="space-y-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full p-4 bg-background border-2 border-input rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-mono"
                              value={field.state.value || ''}
                              onChange={(e) => field.handleChange(Number(e.target.value))}
                            />
                            <div className="flex flex-wrap gap-2">
                              {[0, 0.1, 0.5, 1.0, 2.0].map((amount) => (
                                <Button
                                  key={amount}
                                  type="button"
                                  variant={field.state.value === amount ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => field.handleChange(amount)}
                                  className="text-xs"
                                >
                                  {amount === 0 ? 'Fair Launch' : `${amount} SOL`}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ),
                      })}
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Optional: Instantly buy tokens for yourself when launching. Leave as 0 for fair launch.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-border/50 shadow-lg">
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
                       <span className="text-muted-foreground">Meteora DLMM Fee</span>
                       <span>~0.01 SOL</span>
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
                   <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg">
                     <h3 className="text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                       <TrendingUp className="h-4 w-4 text-primary" />
                       Estimated Tokens
                     </h3>
                     <EstimatedTokensDisplay initialBuyAmount={form.getFieldValue('initialBuyAmount') || 0} />
                   </div>
                 )}

                 {/* Autosell Settings */}
                 <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg">
                   <h3 className="text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                     <BarChart3 className="h-4 w-4 text-primary" />
                     Autosell Settings
                   </h3>
                   <AutosellSettings form={form} />
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>


      {/* DEX Payment Request Modal */}
      <Dialog open={dexPaymentModalOpen} onOpenChange={setDexPaymentModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Request DEX Fee Coverage
            </DialogTitle>
            <DialogDescription>
              Request the platform to cover your DEX listing fees if you meet the eligibility criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Eligibility Criteria */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <h4 className="font-semibold mb-3 text-sm">Eligibility Requirements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Launched at least 3 successful tokens (MC &gt; $10k)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Minimum $1,000 in trading volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Active community engagement (social posts)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Platform member for 30+ days</span>
                </div>
              </div>
            </div>

            {/* DEX Options */}
            <div className="space-y-4">
              <h4 className="font-semibold">DEX Options</h4>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: 'Raydium', fee: '0.02 SOL', description: 'Most popular DEX on Solana' },
                  { name: 'Meteora', fee: '0.01 SOL', description: 'Dynamic fee AMM with advanced features' },
                  { name: 'Orca', fee: '0.02 SOL', description: 'User-friendly DEX with farming' },
                ].map((dex) => (
                  <div key={dex.name} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium">{dex.name}</div>
                      <div className="text-sm text-muted-foreground">{dex.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{dex.fee}</div>
                      <div className="text-xs text-muted-foreground">listing fee</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Wallet Info */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Community Wallet</span>
              </div>
              <div className="font-mono text-xs bg-background/50 p-2 rounded border break-all">
                {env.communityWallet}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                DEX fees will be paid from the community treasury if your request is approved.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDexPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('DEX fee coverage request submitted! Our team will review your eligibility.');
              setDexPaymentModalOpen(false);
            }}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <Button className="w-full py-6 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg" type="submit" disabled={isSubmitting}>
      {isSubmitting ? '🌊 Launching on Meteora...' : '🌊 Launch on Meteora DLMM'}
    </Button>
  );
};

const PoolCreationSuccess = ({ mint }: { mint: string }) => {
  const [selectedDex, setSelectedDex] = useState<string | null>(null);
  const [isRequestingDex, setIsRequestingDex] = useState(false);

  const dexOptions = [
    { id: 'raydium', name: 'Raydium', fee: '0.02 SOL', icon: '🔄', description: 'Most popular DEX on Solana' },
    { id: 'meteora', name: 'Meteora', fee: '0.01 SOL', icon: '🌊', description: 'Dynamic fee AMM' },
    { id: 'orca', name: 'Orca', fee: '0.02 SOL', icon: '🐋', description: 'User-friendly with farming' },
    { id: 'jupiter', name: 'Jupiter', fee: 'Free', icon: '🪐', description: 'Aggregator (no direct pool)' },
  ];

  const handleRequestDexPayment = async () => {
    if (!selectedDex) {
      toast.error('Please select a DEX');
      return;
    }

    setIsRequestingDex(true);
    try {
      // Submit DEX payment request
      const response = await fetch('/api/request-dex-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint,
          dex: selectedDex,
          requestedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success(`DEX payment request submitted for ${dexOptions.find(d => d.id === selectedDex)?.name}! Our team will review and process it.`);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      toast.error('Failed to submit DEX payment request. Please try again.');
    } finally {
      setIsRequestingDex(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-12 border border-border shadow-sm text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold mb-4">Concoction Complete!</h2>
      <p className="text-muted-foreground mb-8">
        Your financial masterpiece is now live on Meteora DLMM pools.
      </p>

      {/* DEX Selection Section */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20 mb-6 text-left">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Select Free DEX Listing
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          As a token creator on Mayhem, you can select a DEX for free listing. We&apos;ll cover the fees!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {dexOptions.map((dex) => (
            <button
              key={dex.id}
              onClick={() => setSelectedDex(dex.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedDex === dex.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{dex.icon}</span>
                  <span className="font-semibold">{dex.name}</span>
                </div>
                {selectedDex === dex.id && (
                  <BadgeCheck className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{dex.description}</p>
              <p className="text-xs font-medium text-green-500">
                {dex.fee === 'Free' ? '✅ Free' : `Fee: ${dex.fee} (we cover it!)`}
              </p>
            </button>
          ))}
        </div>

        <Button
          onClick={handleRequestDexPayment}
          disabled={!selectedDex || isRequestingDex}
          className="w-full"
        >
          {isRequestingDex ? 'Submitting Request...' : 'Request Free DEX Listing'}
        </Button>
      </div>

      <div className="flex gap-4 justify-center">
        <Link href={`/token/${mint}`} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold hover:opacity-90">
          View Chart & Trade
        </Link>
      </div>
    </div>
  );
};
