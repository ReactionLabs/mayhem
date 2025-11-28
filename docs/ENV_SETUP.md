# Environment Variables Setup Guide

## Required Environment Variables

### OpenAI Configuration

You can use **either** direct OpenAI API key **or** Vercel AI Gateway (recommended for production).

#### Option 1: Direct OpenAI API Key
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### Option 2: Vercel AI Gateway (Recommended)
Vercel AI Gateway provides better rate limiting, caching, and cost optimization.

```bash
# Vercel AI Gateway (automatically provided by Vercel in production)
VERCEL_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/openai
VERCEL_AI_GATEWAY_API_KEY=your-vercel-ai-gateway-api-key

# OR alternative naming (if not using Vercel's automatic variables)
AI_GATEWAY_URL=https://your-gateway-url.com
AI_GATEWAY_API_KEY=your-gateway-api-key
```

**Priority Order:**
1. `VERCEL_AI_GATEWAY_API_KEY` + `VERCEL_AI_GATEWAY_URL` (Vercel's naming)
2. `AI_GATEWAY_API_KEY` + `AI_GATEWAY_URL` (Alternative naming)
3. `OPENAI_API_KEY` (Direct OpenAI - fallback)

### PumpPortal API Key
```bash
DIP-API-KEY=your-pumpportal-api-key
# OR
DIP_API_KEY=your-pumpportal-api-key
```

### Solana Configuration
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

### Optional: Supabase (for database)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional: Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
```

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### For Production:
- `OPENAI_API_KEY` - Your OpenAI API key
- `VERCEL_AI_GATEWAY_URL` - Vercel AI Gateway URL (if using)
- `VERCEL_AI_GATEWAY_API_KEY` - Vercel AI Gateway API key (if using)
- `DIP-API-KEY` or `DIP_API_KEY` - PumpPortal API key
- `NEXT_PUBLIC_SOLANA_NETWORK` - `mainnet-beta` or `devnet`
- `NEXT_PUBLIC_RPC_URL` - Your Solana RPC endpoint

### For Local Development:
Create a `.env.local` file in the root directory:

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
# OR use Vercel AI Gateway
VERCEL_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/openai
VERCEL_AI_GATEWAY_API_KEY=your-key-here

DIP-API-KEY=your-pumpportal-key
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

## Verification

The application will automatically:
1. Check for `VERCEL_AI_GATEWAY_API_KEY` first (Vercel's naming)
2. Fall back to `AI_GATEWAY_API_KEY` (alternative naming)
3. Finally use `OPENAI_API_KEY` (direct OpenAI)

In development mode, you'll see console logs indicating which method is being used:
- `[AI] Using Vercel AI Gateway`
- `[AI] Using direct OpenAI API`

## Troubleshooting

### "OpenAI API key not configured" Error

This means none of the following variables are set:
- `VERCEL_AI_GATEWAY_API_KEY`
- `AI_GATEWAY_API_KEY`
- `AIGATEWAYAPI`
- `OPENAI_API_KEY`

**Solution:** Add at least one of these to your environment variables.

### Variables Not Loading in Production

1. Make sure variables are set in Vercel dashboard
2. Redeploy your application after adding variables
3. Check that variable names match exactly (case-sensitive)
4. For Vercel AI Gateway, ensure you've enabled it in your Vercel project settings

### Using Both OpenAI and AI Gateway

If you have both set, the application will prioritize:
1. AI Gateway (if URL and API key are both present)
2. Direct OpenAI API (fallback)

This allows you to use AI Gateway in production and direct OpenAI in development.

