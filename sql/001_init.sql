-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('connected', 'generated', 'imported')),
  api_key TEXT,
  private_key_encrypted TEXT,
  private_key_iv TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, address, type)
);

-- Wallet groups
CREATE TABLE IF NOT EXISTS wallet_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  source_wallet_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  receiver_wallet_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airdrop entries
CREATE TABLE IF NOT EXISTS airdrop_entries (
  clerk_user_id TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ideas board
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  inspiration TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

