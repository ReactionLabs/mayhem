/**
 * Token Data Utilities
 * Centralized types and utilities for token data fetching
 */

export type TokenData = {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  dex?: string;
  pairAddress?: string;
};

export type TokenSortBy = 'marketCap' | 'volume24h' | 'liquidity' | 'priceChange24h';

export type TokenDataProvider = 'dexscreener' | 'jupiter' | 'fallback';

export type TokenDataResponse = {
  success: true;
  tokens: TokenData[];
  provider: TokenDataProvider;
  cached?: boolean;
};

export type TokenDataError = {
  success: false;
  error: string;
  tokens: TokenData[]; // Fallback tokens
  provider: 'fallback';
};

/**
 * Transform DexScreener pair to TokenData
 */
export function transformDexScreenerPair(pair: any): TokenData | null {
  if (!pair.baseToken?.address) return null;

  return {
    mint: pair.baseToken.address,
    name: pair.baseToken.name || 'Unknown',
    symbol: pair.baseToken.symbol || 'UNKNOWN',
    logoURI: pair.baseToken.logoURI || null,
    price: parseFloat(pair.priceUsd || 0),
    priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
    volume24h: parseFloat(pair.volume?.h24 || 0),
    liquidity: parseFloat(pair.liquidity?.usd || 0),
    marketCap: parseFloat(pair.marketCap || 0),
    dex: pair.dexId || 'Unknown',
    pairAddress: pair.pairAddress,
  };
}

/**
 * Transform Jupiter token to TokenData
 */
export function transformJupiterToken(token: any): TokenData | null {
  if (!token.mint && !token.id) return null;

  return {
    mint: token.mint || token.id,
    name: token.name || 'Unknown',
    symbol: token.symbol || 'UNKNOWN',
    logoURI: token.logoURI || token.icon || null,
    price: parseFloat(token.price || 0),
    priceChange24h: parseFloat(token.priceChange24h || 0),
    volume24h: parseFloat(token.volume24h || 0),
    liquidity: parseFloat(token.liquidity || 0),
    marketCap: parseFloat(token.marketCap || 0),
  };
}

/**
 * Sort tokens by specified criteria
 */
export function sortTokens(tokens: TokenData[], sortBy: TokenSortBy, order: 'asc' | 'desc' = 'desc'): TokenData[] {
  const sorted = [...tokens].sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    return order === 'desc' ? bValue - aValue : aValue - bValue;
  });
  return sorted;
}

/**
 * Fallback tokens (popular Solana tokens)
 */
export const FALLBACK_TOKENS: TokenData[] = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    logoURI: null,
    price: 0,
    priceChange24h: 0,
    volume24h: 0,
    liquidity: 0,
    marketCap: 0,
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    logoURI: null,
    price: 0,
    priceChange24h: 0,
    volume24h: 0,
    liquidity: 0,
    marketCap: 0,
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'Tether',
    symbol: 'USDT',
    logoURI: null,
    price: 0,
    priceChange24h: 0,
    volume24h: 0,
    liquidity: 0,
    marketCap: 0,
  },
];

