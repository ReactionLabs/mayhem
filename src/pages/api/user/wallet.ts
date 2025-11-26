/**
 * API Route to get user's wallet information
 * Returns the primary wallet and API key for the authenticated user
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { getUserByClerkId, getUserPrimaryWallet } from '@/lib/db/users';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // If Supabase is not configured, return a placeholder response so the app can run without a DB
    if (!supabase) {
      return res.status(200).json({
        success: true,
        wallet: null,
        note: 'Database not configured; returning null wallet for no-DB mode.'
      });
    }

    // Get user from database
    const user = await getUserByClerkId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get primary wallet
    const wallet = await getUserPrimaryWallet(user.id);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Return wallet info (without encrypted private key)
    return res.status(200).json({
      success: true,
      wallet: {
        id: wallet.id,
        publicKey: wallet.public_key,
        apiKey: wallet.api_key,
        label: wallet.label,
        isPrimary: wallet.is_primary,
        createdAt: wallet.created_at,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching wallet:', error);
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch wallet',
    });
  }
}

