import { NextApiRequest, NextApiResponse } from 'next';
import { PublicKey, Connection } from '@solana/web3.js';

/**
 * API Route to find liquidity pools for a given token
 * Searches across multiple DEXs: Raydium, Orca, Meteora, etc.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token address is required' });
  }

  try {
    // Validate token address
    const tokenPubkey = new PublicKey(token);

    // Get RPC URL
    const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(RPC_URL, 'confirmed');

    const pools: any[] = [];

    // 1. Search Raydium pools
    try {
      const raydiumPools = await searchRaydiumPools(connection, tokenPubkey);
      pools.push(...raydiumPools);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Raydium pool search failed:', error);
      }
    }

    // 2. Search Orca pools
    try {
      const orcaPools = await searchOrcaPools(connection, tokenPubkey);
      pools.push(...orcaPools);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Orca pool search failed:', error);
      }
    }

    // 3. Search Meteora pools
    try {
      const meteoraPools = await searchMeteoraPools(connection, tokenPubkey);
      pools.push(...meteoraPools);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Meteora pool search failed:', error);
      }
    }

    // 4. Search Jupiter aggregated pools
    try {
      const jupiterPools = await searchJupiterPools(token);
      pools.push(...jupiterPools);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Jupiter pool search failed:', error);
      }
    }

    return res.status(200).json({
      success: true,
      pools: pools.slice(0, 20), // Limit to top 20
      count: pools.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error searching pools:', error);
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to search pools',
    });
  }
}

/**
 * Search Raydium pools
 */
async function searchRaydiumPools(connection: Connection, tokenMint: PublicKey): Promise<any[]> {
  // Raydium uses program-derived addresses for pools
  // This is a simplified search - in production, you'd query Raydium's API or on-chain data
  try {
    const response = await fetch(
      `https://api.raydium.io/v2/ammPools/ammPools?poolType=all&poolSortField=liquidity&poolSortType=desc&pageSize=100`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const pools = data.data || [];
    
    return pools
      .filter((pool: any) => 
        pool.baseMint === tokenMint.toBase58() || 
        pool.quoteMint === tokenMint.toBase58()
      )
      .map((pool: any) => ({
        address: pool.id,
        dex: 'Raydium',
        tokenA: {
          mint: pool.baseMint,
          symbol: pool.baseSymbol || 'UNKNOWN',
          amount: pool.baseReserve || 0,
          decimals: pool.baseDecimals || 9,
        },
        tokenB: {
          mint: pool.quoteMint,
          symbol: pool.quoteSymbol || 'SOL',
          amount: pool.quoteReserve || 0,
          decimals: pool.quoteDecimals || 9,
        },
        liquidity: pool.liquidity || 0,
        volume24h: pool.volume24h || 0,
        feeTier: `${(pool.feeRate || 0) * 100}%`,
        apr: pool.apr || undefined,
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Search Orca pools
 */
async function searchOrcaPools(connection: Connection, tokenMint: PublicKey): Promise<any[]> {
  try {
    const response = await fetch('https://api.mainnet.orca.so/v1/whirlpool/list');
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const whirlpools = data.whirlpools || [];
    
    return whirlpools
      .filter((pool: any) => 
        pool.tokenA.mint === tokenMint.toBase58() || 
        pool.tokenB.mint === tokenMint.toBase58()
      )
      .map((pool: any) => ({
        address: pool.address,
        dex: 'Orca',
        tokenA: {
          mint: pool.tokenA.mint,
          symbol: pool.tokenA.symbol || 'UNKNOWN',
          amount: pool.tvl || 0,
          decimals: pool.tokenA.decimals || 9,
        },
        tokenB: {
          mint: pool.tokenB.mint,
          symbol: pool.tokenB.symbol || 'SOL',
          amount: pool.tvl || 0,
          decimals: pool.tokenB.decimals || 9,
        },
        liquidity: pool.tvl || 0,
        volume24h: pool.volume?.day || 0,
        feeTier: `${pool.feeRate || 0}%`,
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Search Meteora pools
 */
async function searchMeteoraPools(connection: Connection, tokenMint: PublicKey): Promise<any[]> {
  try {
    // Meteora API endpoint (if available)
    const response = await fetch(
      `https://dlmm-api.meteora.ag/pair/all`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const pairs = data || [];
    
    return pairs
      .filter((pair: any) => 
        pair.mint_x === tokenMint.toBase58() || 
        pair.mint_y === tokenMint.toBase58()
      )
      .map((pair: any) => ({
        address: pair.address,
        dex: 'Meteora',
        tokenA: {
          mint: pair.mint_x,
          symbol: pair.name_x || 'UNKNOWN',
          amount: pair.reserve_x || 0,
          decimals: pair.decimals_x || 9,
        },
        tokenB: {
          mint: pair.mint_y,
          symbol: pair.name_y || 'SOL',
          amount: pair.reserve_y || 0,
          decimals: pair.decimals_y || 9,
        },
        liquidity: (pair.reserve_x || 0) + (pair.reserve_y || 0),
        volume24h: pair.volume24h || 0,
        feeTier: '0.3%', // Default for Meteora
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Search Jupiter aggregated pools
 */
async function searchJupiterPools(tokenMint: string): Promise<any[]> {
  try {
    // Jupiter's token list includes pool information
    const response = await fetch('https://token.jup.ag/all');
    
    if (!response.ok) return [];
    
    const tokens = await response.json();
    const token = tokens.find((t: any) => t.address === tokenMint);
    
    if (!token) return [];
    
    // For now, return a placeholder - Jupiter doesn't directly expose pool data
    // In production, you'd query Jupiter's quote API or use their SDK
    return [];
  } catch (error) {
    return [];
  }
}

