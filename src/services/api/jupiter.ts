/**
 * Jupiter API Service
 * Service layer for Jupiter aggregator API calls
 */

import { PublicKey } from '@solana/web3.js';

export type TokenPrice = {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  priceChange24h?: number;
};

export type TokenInfo = {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  pools?: Array<{
    id: string;
    baseAsset: { id: string; symbol: string; name: string };
    quoteAsset: { id: string; symbol: string };
  }>;
};

class JupiterService {
  private readonly baseUrl = 'https://price.jup.ag/v4';

  /**
   * Get token price by mint address
   */
  async getTokenPrice(mint: string): Promise<TokenPrice | null> {
    try {
      const response = await fetch(`${this.baseUrl}/price?ids=${mint}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.data?.[mint] || null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Jupiter API error:', error);
      }
      return null;
    }
  }

  /**
   * Get multiple token prices
   */
  async getTokenPrices(mints: string[]): Promise<Record<string, TokenPrice>> {
    try {
      const ids = mints.join(',');
      const response = await fetch(`${this.baseUrl}/price?ids=${ids}`);
      if (!response.ok) return {};
      
      const data = await response.json();
      return data.data || {};
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Jupiter API error:', error);
      }
      return {};
    }
  }

  /**
   * Search for token by address or symbol
   */
  async searchToken(query: string): Promise<TokenInfo | null> {
    try {
      // Validate if it's a valid Solana address
      try {
        new PublicKey(query);
        // It's an address, fetch token info
        const response = await fetch(`https://token.jup.ag/strict/${query}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data || null;
      } catch {
        // Not a valid address, return null (name search not supported)
        return null;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Jupiter search error:', error);
      }
      return null;
    }
  }
}

export const jupiterService = new JupiterService();

