import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { runQuery } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Wallet ID required' });
  }

  try {
    if (req.method === 'DELETE') {
      await runQuery(
        `UPDATE wallets SET archived = true WHERE id = $1 AND clerk_user_id = $2`,
        [id, userId]
      );
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Wallet archive error:', error);
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

