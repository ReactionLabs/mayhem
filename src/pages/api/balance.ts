import { NextApiRequest, NextApiResponse } from 'next';
import { getRpcConnection, getFallbackRpcConnection } from '@/config/rpc';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid address' });
    }

    // Validate address format
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(address);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana address format' });
    }

    // Try primary RPC first
    const connection = getRpcConnection();
    let balance: number;
    let error: Error | null = null;

    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      balance = lamports / LAMPORTS_PER_SOL;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      
      // Check if it's a 403 or rate limit error
      const errorMessage = error.message || String(err || '');
      const is403 = 
        errorMessage.includes('403') ||
        errorMessage.includes('Access forbidden') ||
        errorMessage.includes('forbidden');

      // Try fallback RPC if primary fails
      if (is403 || errorMessage.includes('Failed to fetch')) {
        try {
          const fallbackConnection = getFallbackRpcConnection();
          const lamports = await fallbackConnection.getBalance(publicKey, 'confirmed');
          balance = lamports / LAMPORTS_PER_SOL;
          error = null;
        } catch (fallbackErr) {
          // Both failed, return error
          return res.status(500).json({
            error: 'Failed to fetch balance from RPC',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          });
        }
      } else {
        // Non-403 error, return it
        return res.status(500).json({
          error: 'Failed to fetch balance',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        });
      }
    }

    return res.status(200).json({
      success: true,
      balance,
      address: address,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Balance API error:', error);
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch balance',
    });
  }
}

