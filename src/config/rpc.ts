/**
 * RPC Configuration
 * Centralized RPC connection management
 */

import { Connection, CommitmentLevel } from '@solana/web3.js';
import { env } from './env';

export type RpcConfig = {
  url: string;
  commitment: CommitmentLevel;
  timeout: number;
};

export const rpcConfig: RpcConfig = {
  url: env.rpcUrl,
  commitment: 'confirmed',
  timeout: 30000,
};

export const fallbackRpcConfig: RpcConfig = {
  url: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  timeout: 30000,
};

/**
 * Create a new Solana RPC connection
 */
export function createRpcConnection(config: RpcConfig = rpcConfig): Connection {
  return new Connection(config.url, {
    commitment: config.commitment,
    confirmTransactionInitialTimeout: config.timeout,
  });
}

/**
 * Get the primary RPC connection
 */
export function getRpcConnection(): Connection {
  return createRpcConnection();
}

/**
 * Get fallback RPC connection
 */
export function getFallbackRpcConnection(): Connection {
  return createRpcConnection(fallbackRpcConfig);
}

