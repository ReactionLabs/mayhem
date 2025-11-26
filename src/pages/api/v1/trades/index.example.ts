/**
 * Example: Refactored API Route
 * This demonstrates the new API route pattern using middleware and services
 * 
 * To use this pattern, rename to index.ts and update imports
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMethod, withErrorHandler } from '@/lib/api';
import { sendSuccess, sendError, ApiError } from '@/lib/api/response';
import { pumpFunService } from '@/services/api';
import { solanaService } from '@/services/blockchain';

type TradeRequestBody = {
  action: 'buy' | 'sell';
  mint: string;
  amount: number;
  denominatedInSol?: boolean;
  slippage?: number;
  priorityFee?: number;
  pool?: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get API key from headers or use default
  const userApiKey = req.headers['x-api-key'] as string | undefined;
  
  if (!userApiKey) {
    throw new ApiError(401, 'API key is required', 'MISSING_API_KEY');
  }

  // Validate request body
  const body = req.body as TradeRequestBody;
  
  if (!body.action || !body.mint || !body.amount) {
    throw new ApiError(400, 'Missing required fields: action, mint, amount', 'VALIDATION_ERROR');
  }

  // Validate mint address
  if (!solanaService.isValidAddress(body.mint)) {
    throw new ApiError(400, 'Invalid mint address', 'INVALID_ADDRESS');
  }

  // Execute trade via service layer
  const result = await pumpFunService.executeTrade(
    {
      action: body.action,
      mint: body.mint,
      amount: body.amount,
      denominatedInSol: body.denominatedInSol ?? true,
      slippage: body.slippage ?? 1,
      priorityFee: body.priorityFee,
      pool: body.pool || 'auto',
    },
    userApiKey
  );

  if (!result.success) {
    throw new ApiError(500, result.error || 'Trade execution failed', 'TRADE_FAILED');
  }

  sendSuccess(res, {
    signature: result.signature,
    action: body.action,
    mint: body.mint,
  });
}

// Apply middleware: method validation + error handling
export default withErrorHandler(
  withMethod(['POST'])(handler)
);

