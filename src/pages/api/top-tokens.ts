import { NextApiRequest, NextApiResponse } from 'next';
import {
  TokenData,
  TokenDataResponse,
  TokenDataError,
  TokenSortBy,
  transformDexScreenerPair,
  transformJupiterToken,
  sortTokens,
  FALLBACK_TOKENS,
} from '@/lib/token-data';

const CACHE_DURATION = 60; // Cache for 60 seconds
let cache: { data: TokenDataResponse | TokenDataError; timestamp: number } | null = null;

/**
 * Fetch top tokens from DexScreener
 * Uses the proper endpoint for Solana chain tokens sorted by liquidity
 */
async function fetchFromDexScreener(limit: number): Promise<TokenData[] | null> {
  try {
    // DexScreener's latest pairs endpoint for Solana chain
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) return null;

    const data = await response.json();
    const pairs = data.pairs || [];

    // Filter for Solana chain, valid liquidity, and transform
    const tokens = pairs
      .filter((pair: any) => pair.chainId === 'solana' && pair.liquidity?.usd > 1000) // Min $1k liquidity
      .map((pair: any) => transformDexScreenerPair(pair))
      .filter((token: TokenData | null): token is TokenData => token !== null)
      .slice(0, limit);

    return tokens.length > 0 ? tokens : null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('DexScreener fetch failed:', error);
    }
    return null;
  }
}

/**
 * Fetch top tokens from Jupiter Data API
 * Uses direct fetch to Jupiter's gems endpoint
 */
async function fetchFromJupiter(limit: number, sortBy: TokenSortBy): Promise<TokenData[] | null> {
  try {
    // Map our sortBy to Jupiter's sortBy field
    const jupiterSortBy = sortBy === 'marketCap' ? 'mcap' : sortBy === 'volume24h' ? 'volume24h' : 'liquidity';
    
    const response = await fetch('https://datapi.jup.ag/v1/pools/gems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sortBy: jupiterSortBy,
        order: 'desc',
        limit: limit * 2, // Fetch more to ensure we have enough after filtering
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) return null;

    const data = await response.json();
    const tokens = (data.tokens || [])
      .map((token: any) => transformJupiterToken(token))
      .filter((token: TokenData | null): token is TokenData => token !== null)
      .slice(0, limit);

    return tokens.length > 0 ? tokens : null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Jupiter fetch failed:', error);
    }
    return null;
  }
}

/**
 * Fetch top tokens with parallel requests and fallback strategy
 */
async function fetchTopTokens(
  limit: number = 10,
  sortBy: TokenSortBy = 'marketCap'
): Promise<TokenDataResponse | TokenDataError> {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION * 1000) {
    return { ...cache.data, cached: true } as TokenDataResponse;
  }

  // Fetch from both sources in parallel
  const [dexscreenerResult, jupiterResult] = await Promise.allSettled([
    fetchFromDexScreener(limit),
    fetchFromJupiter(limit, sortBy),
  ]);

  // Try DexScreener first (usually more comprehensive)
  if (dexscreenerResult.status === 'fulfilled' && dexscreenerResult.value) {
    const tokens = sortTokens(dexscreenerResult.value, sortBy).slice(0, limit);
    const response: TokenDataResponse = {
      success: true,
      tokens,
      provider: 'dexscreener',
    };
    cache = { data: response, timestamp: Date.now() };
    return response;
  }

  // Fallback to Jupiter
  if (jupiterResult.status === 'fulfilled' && jupiterResult.value) {
    const tokens = sortTokens(jupiterResult.value, sortBy).slice(0, limit);
    const response: TokenDataResponse = {
      success: true,
      tokens,
      provider: 'jupiter',
    };
    cache = { data: response, timestamp: Date.now() };
    return response;
  }

  // Final fallback to hardcoded tokens
  const errorResponse: TokenDataError = {
    success: false,
    error: 'All data sources failed',
    tokens: FALLBACK_TOKENS.slice(0, limit),
    provider: 'fallback',
  };
  return errorResponse;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 tokens
    const sortBy = (req.query.sortBy as TokenSortBy) || 'marketCap';

    const result = await fetchTopTokens(limit, sortBy);

    // Return appropriate status code
    if (result.success) {
      return res.status(200).json(result);
    } else {
      // Still return 200 but with error info
      return res.status(200).json(result);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in top-tokens API:', error);
    }

    // Return fallback tokens on error
    const errorResponse: TokenDataError = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tokens: FALLBACK_TOKENS.slice(0, 10),
      provider: 'fallback',
    };

    return res.status(200).json(errorResponse);
  }
}
