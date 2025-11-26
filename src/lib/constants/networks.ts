/**
 * Network Constants
 * Solana network and blockchain constants
 */

import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const SOLANA_CONSTANTS = {
  LAMPORTS_PER_SOL,
  DECIMALS: 9,
} as const;

export const NETWORKS = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
} as const;

export type Network = typeof NETWORKS[keyof typeof NETWORKS];

