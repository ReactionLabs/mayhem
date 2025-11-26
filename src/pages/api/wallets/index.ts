import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { runQuery } from '@/lib/db';
import { encryptSecret } from '@/lib/encryption';

type WalletResponse = {
  id: string;
  label: string;
  address: string;
  type: 'connected' | 'generated' | 'imported';
  apiKey?: string | null;
  archived: boolean;
  created_at: string;
};

async function ensureAirdropEntry(clerkUserId: string) {
  await runQuery(
    `INSERT INTO airdrop_entries (clerk_user_id)
     VALUES ($1)
     ON CONFLICT (clerk_user_id) DO NOTHING`,
    [clerkUserId]
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    if (req.method === 'GET') {
      const wallets = await runQuery<WalletResponse>(
        `SELECT id, label, address, type, api_key, archived, created_at
         FROM wallets
         WHERE clerk_user_id = $1 AND archived = false
         ORDER BY created_at ASC`,
        [userId]
      );

      await ensureAirdropEntry(userId);

      return res.status(200).json({ wallets });
    }

    if (req.method === 'POST') {
      const { label, address, type, apiKey, privateKey } = req.body as {
        label?: string;
        address?: string;
        type?: string;
        apiKey?: string | null;
        privateKey?: string | null;
      };

      if (!label || !address || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!['connected', 'generated', 'imported'].includes(type)) {
        return res.status(400).json({ error: 'Invalid wallet type' });
      }

      const existing = await runQuery<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM wallets WHERE clerk_user_id = $1 AND archived = false`,
        [userId]
      );
      const count = parseInt(existing[0]?.count || '0', 10);

      if (count >= 10) {
        return res.status(400).json({ error: 'Wallet limit reached (10).' });
      }

      let encryptedPrivateKey: string | null = null;
      let privateKeyIv: string | null = null;

      if (privateKey) {
        const encrypted = encryptSecret(privateKey);
        encryptedPrivateKey = encrypted.cipherText;
        privateKeyIv = encrypted.iv;
      }

      const inserted = await runQuery<WalletResponse>(
        `INSERT INTO wallets (clerk_user_id, label, address, type, api_key, private_key_encrypted, private_key_iv)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, label, address, type, api_key, archived, created_at`,
        [userId, label, address, type, apiKey || null, encryptedPrivateKey, privateKeyIv]
      );

      await ensureAirdropEntry(userId);

      return res.status(201).json({ wallet: inserted[0] });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Wallet API error:', error);
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

