/**
 * Token Creation Service
 * Standardized token creation following PumpPortal API pattern
 * Reference: https://pumpportal.fun/creation
 * 
 * This service handles:
 * - Image generation (optional)
 * - Metadata upload to Pump.fun IPFS
 * - Token creation transaction via PumpPortal
 * - Transaction signing and sending
 */

import { Keypair, VersionedTransaction, Connection, PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: File | string; // File object or base64 string or image URL
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface TokenCreationOptions {
  metadata: TokenMetadata;
  initialBuyAmount?: number; // In SOL
  slippage?: number;
  priorityFee?: number;
  pool?: 'pump' | 'bonk';
  isMayhemMode?: boolean;
}

export interface TokenCreationResult {
  mintAddress: string;
  transactionSignature: string;
  metadataUri: string;
  name: string;
  symbol: string;
}

export interface TokenCreationProgress {
  step: 'uploading' | 'creating' | 'signing' | 'sending';
  message: string;
}

/**
 * Upload metadata to Pump.fun IPFS
 * Reference: https://pumpportal.fun/creation
 */
async function uploadMetadataToIPFS(
  metadata: TokenMetadata,
  onProgress?: (progress: TokenCreationProgress) => void
): Promise<string> {
  onProgress?.({ step: 'uploading', message: 'Uploading metadata to IPFS...' });

  // Convert image to File if needed
  let imageFile: File | null = null;
  
  if (metadata.image) {
    if (typeof metadata.image === 'string') {
      // If it's a base64 string
      if (metadata.image.startsWith('data:')) {
        const matches = metadata.image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const [, contentType, base64Data] = matches;
          const buffer = Buffer.from(base64Data, 'base64');
          imageFile = new File([buffer], `token-logo-${Date.now()}.png`, { type: contentType });
        }
      } else {
        // If it's a URL, fetch and convert
        try {
          const imageResponse = await fetch(metadata.image);
          const blob = await imageResponse.blob();
          imageFile = new File([blob], `token-logo-${Date.now()}.png`, { type: blob.type });
        } catch (error) {
          console.warn('Failed to fetch image from URL:', error);
        }
      }
    } else {
      // It's already a File
      imageFile = metadata.image;
    }
  }

  // Create FormData as per PumpPortal docs
  const formData = new FormData();
  if (imageFile) {
    formData.append('file', imageFile);
  }
  formData.append('name', metadata.name);
  formData.append('symbol', metadata.symbol);
  formData.append('description', metadata.description || '');
  formData.append('showName', 'true');
  if (metadata.twitter) formData.append('twitter', metadata.twitter);
  if (metadata.telegram) formData.append('telegram', metadata.telegram);
  if (metadata.website) formData.append('website', metadata.website);

  // Upload to Pump.fun IPFS
  const response = await fetch('https://pump.fun/api/ipfs', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to upload metadata to Pump.fun IPFS');
  }

  const json = await response.json();
  return json.metadataUri;
}

/**
 * Create token via PumpPortal API
 * Follows the Local Transaction pattern from https://pumpportal.fun/creation
 */
export async function createToken(
  options: TokenCreationOptions,
  signer: {
    publicKey: PublicKey;
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  },
  connection: Connection,
  onProgress?: (progress: TokenCreationProgress) => void
): Promise<TokenCreationResult> {
  const {
    metadata,
    initialBuyAmount = 0,
    slippage = 10,
    priorityFee = 0.0005,
    pool = 'pump',
    isMayhemMode = false,
  } = options;

  // Step 1: Upload metadata to IPFS
  const metadataUri = await uploadMetadataToIPFS(metadata, onProgress);

  // Step 2: Generate mint keypair
  const mintKeypair = Keypair.generate();
  const mintAddress = mintKeypair.publicKey.toBase58();

  onProgress?.({ step: 'creating', message: 'Creating token transaction...' });

  // Step 3: Create transaction via PumpPortal API
  // Reference: https://pumpportal.fun/creation - Local Transaction Examples
  const response = await fetch('https://pumpportal.fun/api/trade-local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publicKey: signer.publicKey.toBase58(),
      action: 'create',
      tokenMetadata: {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadataUri,
      },
      mint: mintAddress,
      denominatedInSol: 'true',
      amount: initialBuyAmount,
      slippage,
      priorityFee,
      pool,
      isMayhemMode: isMayhemMode.toString(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to create token transaction');
  }

  // Step 4: Deserialize and sign transaction
  // Per PumpPortal docs: "creation transaction needs to be signed by mint and creator keypairs"
  const txData = await response.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(txData));

  // Sign with mint keypair first
  tx.sign([mintKeypair]);

  onProgress?.({ step: 'signing', message: 'Please sign the transaction in your wallet...' });

  // Sign with creator's wallet
  let signedTx: VersionedTransaction;
  try {
    signedTx = await signer.signTransaction(tx);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('User rejected') || error.message.includes('cancelled'))) {
      throw new Error('Transaction signature was cancelled. Please try again.');
    }
    throw error;
  }

  // Step 5: Send transaction to RPC
  onProgress?.({ step: 'sending', message: 'Sending transaction to network...' });

  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  return {
    mintAddress,
    transactionSignature: signature,
    metadataUri,
    name: metadata.name,
    symbol: metadata.symbol,
  };
}

/**
 * Generate image for token (optional helper)
 */
export async function generateTokenImage(prompt: string): Promise<string> {
  const response = await fetch('/api/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'image',
      prompt,
      quality: 'standard',
      size: '1024x1024',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  return data.result || data.url || '';
}

/**
 * Generate token name and symbol (optional helper)
 */
export async function generateTokenDetails(prompt: string): Promise<{ name: string; symbol: string; description: string }> {
  const response = await fetch('/api/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'coin',
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate token details');
  }

  const data = await response.json();
  return {
    name: data.name || 'Token',
    symbol: data.symbol || 'TKN',
    description: data.description || '',
  };
}

