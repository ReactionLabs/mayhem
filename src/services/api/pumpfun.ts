/**
 * PumpFun API Service
 * Service layer for PumpPortal API calls
 */

import { env } from '@/config';

export type TradeAction = 'buy' | 'sell';

export type TradeParams = {
  action: TradeAction;
  mint: string;
  amount: number;
  denominatedInSol?: boolean;
  slippage?: number;
  priorityFee?: number;
  pool?: string;
};

export type TradeResponse = {
  success: boolean;
  signature?: string;
  error?: string;
};

class PumpFunService {
  private readonly baseUrl = 'https://pumpportal.fun/api';

  /**
   * Execute a trade via PumpPortal API
   */
  async executeTrade(params: TradeParams, apiKey?: string): Promise<TradeResponse> {
    const key = apiKey || env.dipApiKey;
    
    if (!key) {
      throw new Error('API key is required for trading');
    }

    try {
      const response = await fetch(`${this.baseUrl}/trade?api-key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: params.action,
          mint: params.mint,
          amount: params.amount,
          denominatedInSol: params.denominatedInSol ?? true,
          slippage: params.slippage ?? 1,
          priorityFee: params.priorityFee,
          pool: params.pool || 'auto',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.errors || data.error || 'Trade execution failed',
        };
      }

      return {
        success: true,
        signature: data.signature,
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PumpFun API error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a new wallet via PumpPortal
   */
  async createWallet(): Promise<{
    publicKey: string;
    privateKey: string;
    apiKey: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/create-wallet`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      return await response.json();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PumpFun wallet creation error:', error);
      }
      throw error;
    }
  }
}

export const pumpFunService = new PumpFunService();

