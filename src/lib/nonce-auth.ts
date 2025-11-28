/**
 * Nonce-based Authentication for Quick Trading
 * Allows users to sign a nonce once to enable faster trades without repeated wallet prompts
 */

import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@jup-ag/wallet-adapter';
import bs58 from 'bs58';

export type NonceSignature = {
  publicKey: string;
  nonce: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
};

const NONCE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const NONCE_STORAGE_KEY = 'mayhem_nonce_auth';

/**
 * Generate a random nonce for signing
 */
export function generateNonce(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Store nonce signature in localStorage
 */
export function storeNonceSignature(signature: NonceSignature): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NONCE_STORAGE_KEY, JSON.stringify(signature));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to store nonce signature:', error);
    }
  }
}

/**
 * Get stored nonce signature if valid
 */
export function getStoredNonceSignature(): NonceSignature | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(NONCE_STORAGE_KEY);
    if (!stored) return null;
    
    const signature: NonceSignature = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > signature.expiresAt) {
      localStorage.removeItem(NONCE_STORAGE_KEY);
      return null;
    }
    
    return signature;
  } catch {
    return null;
  }
}

/**
 * Clear stored nonce signature
 */
export function clearNonceSignature(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(NONCE_STORAGE_KEY);
}

/**
 * Verify nonce signature on server
 */
export async function verifyNonceSignature(
  publicKey: string,
  nonce: string,
  signature: string
): Promise<boolean> {
  try {
    // Send to API for verification
    const response = await fetch('/api/verify-nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey, nonce, signature }),
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

/**
 * Sign nonce with wallet
 * Note: Jupiter wallet adapter may not support signMessage directly
 * This is a placeholder - actual implementation depends on wallet capabilities
 */
export async function signNonce(
  publicKey: PublicKey,
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined,
  nonce?: string
): Promise<NonceSignature> {
  if (!signMessage) {
    throw new Error('Wallet does not support message signing. Please use a compatible wallet.');
  }

  const nonceToSign = nonce || generateNonce();
  const message = new TextEncoder().encode(
    `Sign this message to enable quick trading on Mayhem.\n\nNonce: ${nonceToSign}\n\nThis signature will be valid for 24 hours.`
  );
  
  const signature = await signMessage(message);
  
  return {
    publicKey: publicKey.toBase58(),
    nonce: nonceToSign,
    signature: bs58.encode(signature),
    timestamp: Date.now(),
    expiresAt: Date.now() + NONCE_EXPIRY_MS,
  };
}

// Note: React hook is in a separate file to avoid React dependency in this utility file

