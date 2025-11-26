# Mayhem Database Schema

## Overview

The Mayhem application uses Supabase (PostgreSQL) to store user accounts, wallets, API keys, and trading data. When a user signs up via Clerk, a wallet is automatically generated via the PumpPortal API and stored in the database.

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key
4. Add them to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Run Schema

Execute the SQL in `supabase/schema.sql` in your Supabase SQL editor to create all tables.

### 3. Seed Mock Data (Optional)

Execute the SQL in `supabase/seed.sql` to populate the database with mock data for testing.

## Tables

### `users`
Stores user accounts linked to Clerk user IDs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `clerk_user_id` | VARCHAR(255) | Unique Clerk user ID |
| `email` | VARCHAR(255) | User email |
| `username` | VARCHAR(100) | Username |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |

### `wallets`
Stores PumpPortal-generated wallets for each user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `public_key` | VARCHAR(255) | Solana public key |
| `private_key_encrypted` | TEXT | Encrypted private key |
| `api_key` | VARCHAR(255) | PumpPortal API key |
| `is_primary` | BOOLEAN | Main wallet flag |
| `label` | VARCHAR(100) | Wallet label |
| `created_at` | TIMESTAMP | Wallet creation time |
| `updated_at` | TIMESTAMP | Last update time |

### `tokens`
Tracks tokens created by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `wallet_id` | UUID | Foreign key to wallets |
| `mint_address` | VARCHAR(255) | Token mint address (unique) |
| `name` | VARCHAR(255) | Token name |
| `symbol` | VARCHAR(50) | Token symbol |
| `metadata_uri` | TEXT | IPFS/metadata URI |
| `initial_buy_sol` | DECIMAL(18,9) | Initial buy amount in SOL |
| `initial_buy_usd` | DECIMAL(18,2) | Initial buy amount in USD |
| `initial_market_cap_sol` | DECIMAL(18,9) | Initial market cap in SOL |
| `initial_market_cap_usd` | DECIMAL(18,2) | Initial market cap in USD |
| `created_at` | TIMESTAMP | Token creation time |
| `updated_at` | TIMESTAMP | Last update time |

### `trades`
Tracks all user trades.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `wallet_id` | UUID | Foreign key to wallets |
| `token_mint` | VARCHAR(255) | Token mint address |
| `trade_type` | VARCHAR(10) | 'buy' or 'sell' |
| `amount_sol` | DECIMAL(18,9) | Amount in SOL |
| `amount_tokens` | DECIMAL(36,18) | Amount of tokens |
| `price_per_token` | DECIMAL(36,18) | Price per token |
| `transaction_signature` | VARCHAR(255) | Solana transaction signature |
| `created_at` | TIMESTAMP | Trade timestamp |

## Indexes

- `idx_users_clerk_id` - Fast lookup by Clerk user ID
- `idx_wallets_user_id` - Fast wallet lookup by user
- `idx_wallets_primary` - Fast primary wallet lookup
- `idx_tokens_user_id` - Fast token lookup by user
- `idx_tokens_mint` - Fast token lookup by mint address
- `idx_trades_user_id` - Fast trade lookup by user
- `idx_trades_token_mint` - Fast trade lookup by token
- `idx_trades_created_at` - Fast trade lookup by date

## Webhook Integration

When a user signs up via Clerk, the webhook at `/api/webhooks/clerk` automatically:
1. Creates a user record in the database
2. Generates a wallet via PumpPortal API
3. Stores the wallet and API key in the database

## Environment Variables

Add these to your `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Mock Data

The `seed.sql` file includes mock data for:
- 5 test users
- 7 wallets (5 primary + 2 secondary)
- 15 tokens (3 per user)
- 75 trades (5 per token)

All mock data uses placeholder values and is safe for testing.

