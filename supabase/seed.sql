-- Mock Data Seeding Script
-- This script populates the database with mock data for testing

-- Insert mock users (linked to Clerk user IDs)
INSERT INTO users (clerk_user_id, email, username, created_at) VALUES
  ('user_2mock1234567890', 'alice@example.com', 'alice_crypto', NOW() - INTERVAL '30 days'),
  ('user_2mock0987654321', 'bob@example.com', 'bob_trader', NOW() - INTERVAL '15 days'),
  ('user_2mock1122334455', 'charlie@example.com', 'charlie_degen', NOW() - INTERVAL '7 days'),
  ('user_2mock5566778899', 'diana@example.com', 'diana_moon', NOW() - INTERVAL '3 days'),
  ('user_2mock9988776655', 'eve@example.com', 'eve_whale', NOW() - INTERVAL '1 day')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Insert mock wallets (with mock PumpPortal API keys)
INSERT INTO wallets (user_id, public_key, private_key_encrypted, api_key, is_primary, label, created_at)
SELECT 
  u.id,
  'So11111111111111111111111111111111111111112', -- Mock public key
  'encrypted_private_key_' || u.id::text, -- Mock encrypted private key
  'pumpportal_api_key_' || SUBSTRING(u.clerk_user_id, -10), -- Mock API key
  true,
  'Main Wallet',
  u.created_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.is_primary = true
);

-- Insert additional mock wallets for some users
INSERT INTO wallets (user_id, public_key, private_key_encrypted, api_key, is_primary, label, created_at)
SELECT 
  u.id,
  'So22222222222222222222222222222222222222223',
  'encrypted_private_key_secondary_' || u.id::text,
  'pumpportal_api_key_secondary_' || SUBSTRING(u.clerk_user_id, -10),
  false,
  'Trading Wallet',
  u.created_at + INTERVAL '1 day'
FROM users u
WHERE u.username IN ('alice_crypto', 'bob_trader')
LIMIT 2;

-- Insert mock tokens
INSERT INTO tokens (
  user_id, 
  wallet_id, 
  mint_address, 
  name, 
  symbol, 
  metadata_uri, 
  initial_buy_sol, 
  initial_buy_usd, 
  initial_market_cap_sol, 
  initial_market_cap_usd,
  created_at
)
SELECT 
  u.id,
  w.id,
  'Token' || LPAD(ROW_NUMBER() OVER ()::text, 44, '0'), -- Mock mint address
  CASE (ROW_NUMBER() OVER () % 5)
    WHEN 0 THEN 'MoonToken'
    WHEN 1 THEN 'DogeCoin'
    WHEN 2 THEN 'PepeCoin'
    WHEN 3 THEN 'BonkToken'
    ELSE 'ShitCoin'
  END,
  CASE (ROW_NUMBER() OVER () % 5)
    WHEN 0 THEN 'MOON'
    WHEN 1 THEN 'DOGE'
    WHEN 2 THEN 'PEPE'
    WHEN 3 THEN 'BONK'
    ELSE 'SHIT'
  END,
  'https://pump.fun/ipfs/mock_metadata_' || u.id::text,
  (RANDOM() * 2 + 0.1)::DECIMAL(18, 9), -- Random between 0.1 and 2.1 SOL
  (RANDOM() * 400 + 20)::DECIMAL(18, 2), -- Random between 20 and 420 USD
  (RANDOM() * 1000 + 100)::DECIMAL(18, 9), -- Random between 100 and 1100 SOL
  (RANDOM() * 200000 + 20000)::DECIMAL(18, 2), -- Random between 20k and 220k USD
  u.created_at + (RANDOM() * INTERVAL '20 days')
FROM users u
JOIN wallets w ON w.user_id = u.id AND w.is_primary = true
CROSS JOIN generate_series(1, 3) -- 3 tokens per user
ON CONFLICT (mint_address) DO NOTHING;

-- Insert mock trades
INSERT INTO trades (
  user_id,
  wallet_id,
  token_mint,
  trade_type,
  amount_sol,
  amount_tokens,
  price_per_token,
  transaction_signature,
  created_at
)
SELECT 
  u.id,
  w.id,
  t.mint_address,
  CASE WHEN RANDOM() > 0.5 THEN 'buy' ELSE 'sell' END,
  (RANDOM() * 1 + 0.01)::DECIMAL(18, 9), -- Random between 0.01 and 1.01 SOL
  (RANDOM() * 1000000 + 1000)::DECIMAL(36, 18), -- Random token amount
  (RANDOM() * 0.001 + 0.0001)::DECIMAL(36, 18), -- Random price
  'tx_' || MD5(RANDOM()::text || u.id::text || NOW()::text), -- Mock signature
  t.created_at + (RANDOM() * INTERVAL '5 days')
FROM users u
JOIN wallets w ON w.user_id = u.id AND w.is_primary = true
JOIN tokens t ON t.user_id = u.id
CROSS JOIN generate_series(1, 5) -- 5 trades per token
ON CONFLICT DO NOTHING;

