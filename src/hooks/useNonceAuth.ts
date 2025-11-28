/**
 * React hook for nonce authentication
 */
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import {
  generateNonce,
  signNonce,
  storeNonceSignature,
  getStoredNonceSignature,
  clearNonceSignature,
  type NonceSignature,
} from '@/lib/nonce-auth';

export function useNonceAuth() {
  const { publicKey, signMessage } = useWallet();
  const [nonceSignature, setNonceSignature] = useState<NonceSignature | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setNonceSignature(null);
      return;
    }

    // Check for existing valid nonce
    const stored = getStoredNonceSignature();
    if (stored && stored.publicKey === publicKey.toBase58()) {
      setNonceSignature(stored);
    } else {
      setNonceSignature(null);
    }
  }, [publicKey]);

  const signNonceForQuickTrading = useCallback(async () => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    // Check if wallet supports message signing
    if (!signMessage) {
      throw new Error('Your wallet does not support message signing. Quick trading requires a wallet that supports signing messages (like Phantom or Solflare).');
    }

    setIsSigning(true);
    try {
      const signature = await signNonce(publicKey, signMessage);
      storeNonceSignature(signature);
      setNonceSignature(signature);
      return signature;
    } finally {
      setIsSigning(false);
    }
  }, [publicKey, signMessage]);

  const clearAuth = useCallback(() => {
    clearNonceSignature();
    setNonceSignature(null);
  }, []);

  return {
    nonceSignature,
    isSignedIn: !!nonceSignature,
    isSigning,
    signNonceForQuickTrading,
    clearAuth,
  };
}

