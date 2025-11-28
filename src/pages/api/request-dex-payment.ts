import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mint, dex, requestedAt } = req.body;

    if (!mint || !dex) {
      return res.status(400).json({ error: 'Missing required fields: mint and dex' });
    }

    // In production, this would:
    // 1. Verify the user created the token
    // 2. Check eligibility criteria
    // 3. Store the request in database
    // 4. Queue for team review/automated processing

    // For now, we'll just acknowledge the request
    // TODO: Implement database storage and processing queue

    return res.status(200).json({
      success: true,
      message: 'DEX payment request received. Our team will review and process it within 24-48 hours.',
      requestId: `dex-${Date.now()}`,
      mint,
      dex,
      requestedAt,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('DEX payment request error:', error);
    }
    return res.status(500).json({
      error: 'Failed to process DEX payment request',
    });
  }
}

