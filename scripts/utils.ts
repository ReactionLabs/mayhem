import { Connection, Keypair, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

type Net = 'devnet' | 'mainnet-beta' | 'testnet';

export type Config = {
  network: Net;
  rpcUrl?: string;
  mintDecimals: number;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: number; // display units
  ownerSharePercent: number;
  buyInSol: number;
  tokensPerBuy: number; // display units
  metadataUri: string;
};

export function loadConfig(): Config {
  const raw = readFileSync('config.json', 'utf-8');
  return JSON.parse(raw);
}

export function connectionFromConfig(cfg: Config): Connection {
  const url = cfg.rpcUrl && cfg.rpcUrl.length > 0 ? cfg.rpcUrl : clusterApiUrl(cfg.network);
  return new Connection(url, 'confirmed');
}

export function loadKeypair(): Keypair {
  // Default Solana CLI keypair path
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  const kpPath = `${home}/.config/solana/id.json`;
  const secret = JSON.parse(readFileSync(kpPath, 'utf-8')) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export function amountToAtoms(displayAmount: number, decimals: number): bigint {
  const factor = BigInt(10) ** BigInt(decimals);
  const scaled = BigInt(Math.round(displayAmount * Math.pow(10, decimals)));
  return scaled; // already in atoms
}

export function atomsFromDisplay(displayAmount: number, decimals: number): bigint {
  // same as amountToAtoms, clearer name
  return amountToAtoms(displayAmount, decimals);
}

export function atomsPerDisplayUnit(decimals: number): bigint {
  return BigInt(10) ** BigInt(decimals);
}

export function saveState(obj: any) {
  if (!existsSync('.state')) mkdirSync('.state');
  writeFileSync('.state/state.json', JSON.stringify(obj, null, 2));
}

export function loadState(): any | null {
  try {
    const raw = readFileSync('.state/state.json', 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parsePubkey(s: string): PublicKey { return new PublicKey(s); }

