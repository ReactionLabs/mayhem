/**
 * Solana Blockchain Service
 * Service layer for Solana blockchain operations
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getRpcConnection, getFallbackRpcConnection } from '@/config/rpc';

class SolanaService {
  private connection: Connection;
  private fallbackConnection: Connection;

  constructor() {
    this.connection = getRpcConnection();
    this.fallbackConnection = getFallbackRpcConnection();
  }

  /**
   * Get SOL balance for an address
   * Uses API route if running in browser to avoid CORS issues
   */
  async getBalance(address: string, useFallback = false): Promise<number> {
    // If running in browser, use API route to avoid CORS issues
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success && typeof data.balance === 'number') {
          return data.balance;
        }
        throw new Error('Invalid response from balance API');
      } catch (error: any) {
        const errorMessage = error?.message || String(error || '');
        
        // If it's a network error, return -1 to indicate unavailable
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Network error fetching balance for ${address}, returning unavailable`);
          }
          return -1;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to fetch balance via API for ${address}:`, errorMessage);
        }
        return -1;
      }
    }

    // Server-side: use direct RPC connection
    const conn = useFallback ? this.fallbackConnection : this.connection;
    
    try {
      const publicKey = new PublicKey(address);
      const lamports = await conn.getBalance(publicKey, 'confirmed');
      return lamports / LAMPORTS_PER_SOL;
    } catch (error: any) {
      // Parse error to check for 403 (rate limit or auth issues)
      const errorMessage = error?.message || String(error || '');
      const errorCode = error?.code;
      
      // Check JSON-RPC error structure
      let jsonRpcError: any = null;
      try {
        // Try to parse JSON-RPC error from message
        const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonRpcError = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Not JSON, continue with other checks
      }
      
      const is403 = 
        errorCode === 403 ||
        errorMessage.includes('403') ||
        errorMessage.includes('Access forbidden') ||
        errorMessage.includes('forbidden') ||
        jsonRpcError?.error?.code === 403 ||
        jsonRpcError?.error?.message?.toLowerCase().includes('forbidden');
      
      // Only log non-403 errors in development (403s are expected and handled gracefully)
      if (process.env.NODE_ENV === 'development' && !is403) {
        console.error(`Failed to fetch balance for ${address}${useFallback ? ' (fallback)' : ''}:`, error);
      }
      
      // If primary RPC returns 403, try fallback
      if (is403 && !useFallback) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Primary RPC returned 403, trying fallback RPC');
        }
        return this.getBalance(address, true);
      }
      
      // If fallback also fails with 403, return 0 but log it
      // This allows UI to show "unavailable" vs "0 balance"
      if (is403 && useFallback) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Fallback RPC also returned 403, balance unavailable');
        }
        // Return -1 to indicate "unavailable" vs 0 which means "no balance"
        return -1;
      }
      
      // For other errors, try fallback if not already using it
      if (!useFallback) {
        return this.getBalance(address, true);
      }
      
      // If fallback also fails, return -1 to indicate unavailable
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to fetch balance for ${address}:`, errorMessage);
      }
      return -1;
    }
  }

  /**
   * Get multiple balances
   */
  async getBalances(addresses: string[]): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};
    
    await Promise.all(
      addresses.map(async (address) => {
        try {
          balances[address] = await this.getBalance(address);
        } catch {
          balances[address] = 0;
        }
      })
    );
    
    return balances;
  }

  /**
   * Validate a Solana address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
}

export const solanaService = new SolanaService();

