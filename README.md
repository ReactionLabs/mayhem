# Mayhem - Pump.fun Token Launchpad & Trading Platform

A modern Next.js application for launching and trading tokens on Pump.fun.

## Features

- 🚀 **Token Launchpad**: Create and launch tokens on Pump.fun with a simple interface
- 📊 **Real-time Trading**: Trade tokens with live price updates and charts
- 🔍 **Token Explorer**: Browse new, graduating, and graduated tokens
- 💼 **Portfolio Management**: Track your positions and trading history
- 🎨 **Modern UI**: Beautiful dark/light mode interface

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js, Jupiter Wallet Adapter
- **State Management**: Jotai, React Query
- **UI Components**: Radix UI, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
# Required - Solana RPC endpoint
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here

# Optional - for server-side RPC calls (defaults to NEXT_PUBLIC_RPC_URL)
RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here

# Optional - Solana network (mainnet-beta or devnet, defaults to mainnet-beta)
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# OpenAI Configuration (choose one)
# Option 1: Direct OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Option 2: Vercel AI Gateway (Recommended for production)
VERCEL_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/openai
VERCEL_AI_GATEWAY_API_KEY=your-vercel-ai-gateway-api-key

# PumpPortal API Key
DIP-API-KEY=your-pumpportal-api-key
# OR
DIP_API_KEY=your-pumpportal-api-key

# Optional - Supabase (for database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional - Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This app is configured for Vercel deployment. Simply connect your GitHub repository to Vercel and deploy.

### Environment Variables for Vercel

Set these in your Vercel project settings (Settings → Environment Variables):

#### Required:
- `NEXT_PUBLIC_RPC_URL` - Your Solana RPC endpoint
  - Example: `https://mainnet.helius-rpc.com/?api-key=your_api_key_here`
  - Or use public RPC: `https://api.mainnet-beta.solana.com`

#### OpenAI Configuration (choose one):
- `OPENAI_API_KEY` - Direct OpenAI API key
- **OR** (Recommended for production):
  - `VERCEL_AI_GATEWAY_URL` - Vercel AI Gateway URL
  - `VERCEL_AI_GATEWAY_API_KEY` - Vercel AI Gateway API key

#### Optional:
- `RPC_URL` - Server-side RPC endpoint (defaults to NEXT_PUBLIC_RPC_URL)
- `NEXT_PUBLIC_SOLANA_NETWORK` - Network: `mainnet-beta` or `devnet` (defaults to mainnet-beta)
- `DIP-API-KEY` or `DIP_API_KEY` - PumpPortal API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

**Important**: 
- Never commit API keys to the repository
- Always use environment variables in Vercel dashboard
- Vercel AI Gateway is automatically configured if you enable it in your Vercel project
- See `docs/ENV_SETUP.md` for detailed environment variable documentation

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/         # Next.js pages and API routes
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   └── styles/        # Global styles
├── public/            # Static assets
└── package.json       # Dependencies
```

## License

ISC
