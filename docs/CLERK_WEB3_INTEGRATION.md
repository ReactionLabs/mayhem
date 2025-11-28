# Clerk + Web3 Wallet Integration Guide

## Overview

Mayhem uses a **dual-layer authentication system**:
- **Clerk**: Identity and session management (base layer)
- **Solana Wallets**: Blockchain connection and transaction signing (native layer)

Both are treated as **first-class** features, displayed side-by-side in the UI.

## Architecture

### Provider Hierarchy

```
ClerkProvider (Identity Layer)
  └── UnifiedWalletProvider (Web3 Layer)
      └── App Components
```

### Key Principles

1. **Clerk handles identity**: User accounts, sessions, route protection
2. **Wallets handle blockchain**: Address ownership, transaction signing
3. **Never store private keys**: All wallet keys remain client-side only
4. **Optional linking**: Wallet addresses can be stored in Clerk metadata for convenience

## Implementation Details

### Middleware (`src/middleware.ts`)

Uses `clerkMiddleware()` from `@clerk/nextjs/server` to protect routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhooks/clerk',
  // ... other public routes
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

### App Wrapper (`src/pages/_app.tsx`)

Wraps the app with both providers:

```typescript
<ClerkProvider>
  <UnifiedWalletProvider>
    {/* App */}
  </UnifiedWalletProvider>
</ClerkProvider>
```

### Header Component (`src/components/Header.tsx`)

Displays both Clerk and wallet controls side-by-side:

- **Clerk**: `<SignInButton>`, `<SignUpButton>`, `<UserButton>`
- **Wallet**: Connect button, address display, wallet dropdown

## User Flow

1. **Sign Up/Sign In**: User authenticates via Clerk (email, Google, Twitter, etc.)
2. **Auto Wallet Generation**: Webhook creates PumpPortal wallet and stores in database
3. **Connect Wallet**: User connects their Solana wallet (Phantom, Solflare, etc.) for trading
4. **Optional Linking**: Wallet address can be saved to Clerk metadata for convenience

## Security Guidelines

### ✅ DO

- Use Clerk for authentication and sessions
- Keep wallet private keys client-side only
- Store wallet addresses (public keys) in Clerk metadata if needed
- Use wallet adapters for signing transactions
- Protect routes with Clerk middleware

### ❌ DON'T

- Never ask users for private keys, seed phrases, or keystore files
- Never store private keys in Clerk, database, or local storage
- Never sign transactions server-side using user's private keys
- Never treat Clerk as a wallet (it's identity only)

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase (for wallet storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Solana
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## Webhook Integration

When a user signs up via Clerk, the webhook at `/api/webhooks/clerk`:

1. Creates user record in Supabase
2. Generates PumpPortal wallet via API
3. Stores wallet (with encrypted private key) in database
4. Links wallet to Clerk user ID

## API Routes

### `/api/user/wallet`

Returns the authenticated user's primary wallet:

```typescript
const response = await fetch('/api/user/wallet');
const { wallet } = await response.json();
// wallet.apiKey - Use for PumpPortal API calls
// wallet.publicKey - User's Solana address
```

## Components

### `<Header />`

Displays both Clerk and wallet controls:
- Clerk: Sign in/up buttons or user button
- Wallet: Connect button or address dropdown

### `<UserButton />` (Clerk)

Shows user avatar and account menu

### Wallet Dropdown

Shows connected wallet address with options:
- Portfolio & Tools
- My Tokens
- Copy Address
- Change Wallet
- Disconnect

## Future Enhancements

- Sync wallet address to Clerk `publicMetadata.walletAddress` after connect
- Show wallet balance in header (when RPC is available)
- Multi-wallet support per user
- Wallet connection history

