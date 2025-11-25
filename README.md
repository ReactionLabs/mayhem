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

# Optional - Pump.fun API key (users can also provide their own)
DIP_API_KEY=your_api_key_here

# Optional - Gemini AI for token analysis
GEMINI_API_KEY=your_gemini_key_here
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

Set these in your Vercel project settings:

- `NEXT_PUBLIC_RPC_URL` - Your Solana RPC endpoint (required)
  - Example: `https://mainnet.helius-rpc.com/?api-key=your_api_key_here`
  - Or use public RPC: `https://api.mainnet-beta.solana.com`
- `RPC_URL` - Server-side RPC endpoint (optional, defaults to NEXT_PUBLIC_RPC_URL)
  - Use same value as NEXT_PUBLIC_RPC_URL for consistency
- `NEXT_PUBLIC_SOLANA_NETWORK` - Network: `mainnet-beta` or `devnet` (optional, defaults to mainnet-beta)
- `DIP_API_KEY` - (Optional) Pump.fun API key
- `GEMINI_API_KEY` - (Optional) Gemini AI key

**Important**: Never commit API keys to the repository. Always use environment variables.

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
