import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { runQuery } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    const ideas = await runQuery(
      `SELECT id, title, description, inspiration, created_at
       FROM ideas
       WHERE clerk_user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.status(200).json({ ideas });
  }

  if (req.method === 'POST') {
    const { title, description, inspiration } = req.body as {
      title?: string;
      description?: string;
      inspiration?: string[];
    };

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const inserted = await runQuery(
      `INSERT INTO ideas (clerk_user_id, title, description, inspiration)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, inspiration, created_at`,
      [userId, title, description || null, inspiration || []]
    );

    return res.status(201).json({ idea: inserted[0] });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

