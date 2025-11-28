# Clerk Authentication Setup Guide

## Overview

Mayhem uses Clerk for authentication. When users sign up, a PumpPortal wallet is automatically generated and stored in the database.

## Setup Steps

### 1. Install Dependencies

```bash
npm install @clerk/nextjs @supabase/supabase-js svix
```

### 2. Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your API keys:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)

### 3. Configure Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Generated when you create the webhook
```

### 4. Set Up Webhook in Clerk

1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Set URL to: `https://your-domain.com/api/webhooks/clerk` (or `http://localhost:3000/api/webhooks/clerk` for local)
4. Select event: `user.created`
5. Copy the webhook secret and add it to `.env.local` as `CLERK_WEBHOOK_SECRET`

### 5. Set Up Supabase Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase/schema.sql` in the SQL editor
3. (Optional) Run `supabase/seed.sql` for mock data
4. Add Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 6. Update Your App

The app is already configured with:
- Clerk provider in `_app.tsx`
- Middleware for route protection
- Sign-in page at `/sign-in`
- Sign-up page at `/sign-up`
- Webhook handler at `/api/webhooks/clerk`

## How It Works

1. User signs up via Clerk (email, Google, Twitter, etc.)
2. Clerk sends `user.created` webhook to `/api/webhooks/clerk`
3. Webhook handler:
   - Creates user record in Supabase
   - Calls PumpPortal API to generate wallet
   - Stores wallet and API key in database
4. User can now use their auto-generated wallet for trading

## Authentication Flow

- **Public routes**: `/`, `/token/*`, API routes (except protected ones)
- **Protected routes**: `/dashboard`, `/portfolio`, `/my-tokens`, `/create-pool`
- **Auth pages**: `/sign-in`, `/sign-up`

## Getting User's Wallet

Use the API endpoint:
```typescript
const response = await fetch('/api/user/wallet');
const { wallet } = await response.json();
// wallet.apiKey - Use this for PumpPortal API calls
// wallet.publicKey - User's Solana address
```

## Notes

- Private keys are stored encrypted in the database (currently base64, upgrade to proper encryption in production)
- Each user gets one primary wallet automatically
- Users can create additional wallets via the portfolio page
- The API key is stored unencrypted (consider encrypting in production)

