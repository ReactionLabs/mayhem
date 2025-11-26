/**
 * Application Routes
 * Centralized route definitions
 */

export const routes = {
  home: '/',
  explore: '/explore',
  dashboard: '/dashboard',
  portfolio: '/portfolio',
  liquidity: '/liquidity',
  createPool: '/create-pool',
  myTokens: '/my-tokens',
  token: (tokenId: string) => `/token/${tokenId}`,
  signIn: '/sign-in',
  signUp: '/sign-up',
} as const;

export type Route = typeof routes[keyof typeof routes];

