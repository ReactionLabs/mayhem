/**
 * Hook to get the connected wallet
 * Wallet-only authentication - uses Jupiter's Unified Wallet Adapter
 */

import { useWallet } from '@jup-ag/wallet-adapter';
import { useMemo } from 'react';

export function useUserWallet() {
  const { publicKey, connected } = useWallet();

  const wallet = useMemo(() => {
    if (!publicKey || !connected) return null;
    
    return {
      id: publicKey.toBase58(),
      publicKey: publicKey.toBase58(),
      address: publicKey.toBase58(),
      isPrimary: true,
      connected: true,
    };
  }, [publicKey, connected]);

  return {
    wallet,
    loading: false,
    error: null,
    isAuthenticated: connected && !!publicKey,
  };
}

