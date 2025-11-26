/**
 * Environment Configuration
 * Centralized environment variable access with validation
 */

type EnvConfig = {
  // Solana Network
  solanaNetwork: 'mainnet-beta' | 'devnet';
  
  // RPC URLs
  rpcUrl: string;
  heliusRpcUrl?: string;
  
  // API Keys
  dipApiKey?: string;
  
  // Database
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  
  // App
  appUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Feature Flags
  features: {
    enableExtension: boolean;
    enableClerk: boolean;
  };
};

function getEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  const solanaNetwork = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') as EnvConfig['solanaNetwork'];
  
  return {
    solanaNetwork,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    heliusRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    dipApiKey: process.env['DIP-API-KEY'] || process.env.DIP_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://mayhem.vercel.app',
    nodeEnv,
    features: {
      enableExtension: process.env.NEXT_PUBLIC_ENABLE_EXTENSION === 'true',
      enableClerk: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
  };
}

export const env = getEnvConfig();

// Validation helpers
export function requireEnv(key: keyof EnvConfig, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

