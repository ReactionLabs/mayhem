import { NextApiRequest, NextApiResponse } from 'next';
import { tradeRequestSchema, validateRequest } from '@/lib/api/validation';
import { rateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/api/rate-limit';
import { safeLogError } from '@/lib/log-sanitizer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.trading);
    
    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      });
    }

    // Input validation
    const validation = validateRequest(tradeRequestSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { action, mint, amount, denominatedInSol, slippage, priorityFee, pool } = validation.data;

    // Check for user-provided API key in headers first
    const userApiKey = req.headers['x-api-key'] as string;
    
    // Fallback to server env var
    const serverApiKey = process.env['DIP-API-KEY'] || process.env.DIP_API_KEY || process.env['DIP_API_KEY'];
    
    const API_KEY = userApiKey || serverApiKey;

    if (!API_KEY) {
      return res.status(401).json({ error: 'Please set up your Trading Wallet first.' });
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
      safeLogError('PumpPortal API Error', data);
      return res.status(response.status).json({ 
        error: data.errors || data.error || 'Failed to execute trade. Please try again.' 
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    safeLogError('Trade execution error', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
    });
  }
}
