/**
 * Supabase Client
 * Database connection for Mayhem app
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database Types
export type User = {
  id: string;
  clerk_user_id: string;
  email: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  public_key: string;
  private_key_encrypted: string;
  api_key: string;
  is_primary: boolean;
  label: string;
  created_at: string;
  updated_at: string;
};

export type Token = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  mint_address: string;
  name: string;
  symbol: string;
  metadata_uri: string | null;
  initial_buy_sol: number | null;
  initial_buy_usd: number | null;
  initial_market_cap_sol: number | null;
  initial_market_cap_usd: number | null;
  created_at: string;
  updated_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  token_mint: string;
  trade_type: 'buy' | 'sell';
  amount_sol: number;
  amount_tokens: number | null;
  price_per_token: number | null;
  transaction_signature: string | null;
  created_at: string;
};

