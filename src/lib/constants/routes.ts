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
  launchpad: '/launchpad',
  createPool: '/launchpad', // Legacy alias
  myTokens: '/my-tokens',
  token: (tokenId: string) => `/token/${tokenId}`,
  login: '/login', // Unified authentication entry point
  signIn: '/login', // Legacy alias - redirects to /login
  signUp: '/login', // Legacy alias - redirects to /login
} as const;

export type Route = typeof routes[keyof typeof routes];

