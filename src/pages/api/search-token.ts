import { NextApiRequest, NextApiResponse } from 'next';
import { ApeClient } from '@/components/Explore/client';
import { PublicKey } from '@solana/web3.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Check if it's a valid Solana address
    let isAddress = false;
    try {
      new PublicKey(q);
      isAddress = true;
    } catch {
      // Not a valid address, treat as name/symbol search
    }

    if (isAddress) {
      // Direct address lookup - fetch token info
      try {
        const tokenInfo = await ApeClient.getToken({ id: q });
        if (tokenInfo?.pools?.[0]) {
          return res.status(200).json({
            type: 'address',
            token: tokenInfo.pools[0],
          });
        }
      } catch (error) {
        // Token not found in Jupiter API
        return res.status(404).json({ error: 'Token not found' });
      }
    }

    // For name/symbol search, we'd need a search API
    // For now, return error suggesting to use contract address
    return res.status(400).json({ 
      error: 'Name/symbol search not yet implemented. Please use contract address (CA).',
      suggestion: 'You can search by pasting the token contract address directly.'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Search error:', error);
    }
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Search failed' 
    });
  }
}

