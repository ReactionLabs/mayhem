/**
 * Hook to get the authenticated user's primary wallet
 * Uses Clerk for auth and Supabase for wallet data
 */

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import type { Wallet } from '@/lib/supabase';

type UserWallet = {
  id: string;
  publicKey: string;
  apiKey: string;
  label: string;
  isPrimary: boolean;
  createdAt: string;
} | null;

export function useUserWallet() {
  const { user, isLoaded } = useUser();
  const [wallet, setWallet] = useState<UserWallet>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    // Fetch user's wallet
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/wallet');
        
        if (!response.ok) {
          if (response.status === 404) {
            // User exists but no wallet yet (shouldn't happen with webhook, but handle gracefully)
            setWallet(null);
            setError('Wallet not found. Please contact support.');
          } else {
            throw new Error('Failed to fetch wallet');
          }
          return;
        }

        const data = await response.json();
        setWallet(data.wallet);
        setError(null);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching wallet:', err);
        }
        setError(err instanceof Error ? err.message : 'Failed to load wallet');
        setWallet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user, isLoaded]);

  return {
    wallet,
    loading,
    error,
    isAuthenticated: !!user,
  };
}

