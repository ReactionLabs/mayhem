import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for user-provided API key in headers first
  const userApiKey = req.headers['x-api-key'] as string;
  
  // Fallback to server env var
  const serverApiKey = process.env['DIP-API-KEY'] || process.env.DIP_API_KEY || process.env['DIP_API_KEY'];
  
  const API_KEY = userApiKey || serverApiKey;

  if (!API_KEY) {
    // If no key provided, we cannot execute the trade via PumpPortal API
    return res.status(401).json({ error: 'Please set up your Trading Wallet first.' });
  }

  try {
    const { action, mint, amount, denominatedInSol, slippage, priorityFee, pool } = req.body;

    // Validate required fields
    if (!action || !mint || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        mint,
        amount,
        denominatedInSol,
        slippage,
        priorityFee,
        pool: pool || 'auto',
      }),
    });

    const data = await response.json();

    if (response.status !== 200) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('PumpPortal API Error:', data);
      }
      return res.status(response.status).json({ 
        error: data.errors || data.error || 'Failed to execute trade. Please try again.' 
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Trade error:', error);
    }
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
    });
  }
}
