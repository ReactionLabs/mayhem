# 🚀 Vercel Deployment Guide for Mayhem App

## Prerequisites

- Vercel account (free tier available)
- GitHub repository with this codebase
- API keys for required services

## Quick Deploy

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Vercel will automatically detect Next.js settings

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

#### Required Variables:
```bash
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
OPENAI_API_KEY=your_openai_api_key_here
```

#### Optional Variables:
```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Additional RPC
RPC_URL=https://api.mainnet-beta.solana.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_ENABLE_EXTENSION=false
```

### 3. Deploy

Vercel will automatically deploy on every push to main branch.

## Manual Deployment

If you prefer manual deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Environment Variables Setup

1. Copy `.env.example` to `.env.local` locally
2. Fill in your actual API keys
3. Add the same variables to Vercel dashboard under Project Settings > Environment Variables

## Build Configuration

The app is configured with:
- **Framework**: Next.js 15.5.6
- **Node.js**: 18.x+ (automatically detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## API Routes Configuration

Special configurations for API routes:
- **Max Duration**: 30s for general APIs, 60s for AI generation
- **CORS Headers**: Enabled for cross-origin requests

## Troubleshooting

### Build Fails
- Check that all required environment variables are set
- Ensure `npm ci` installs dependencies correctly
- Verify TypeScript compilation passes

### Runtime Errors
- Check browser console for client-side errors
- Review Vercel function logs for server-side issues
- Ensure API keys are valid and have proper permissions

### Performance Issues
- API routes have timeout limits (30s/60s)
- Consider upgrading to Vercel Pro for longer execution times
- Monitor function usage in Vercel dashboard

## Domain Configuration

To use a custom domain:
1. Go to Project Settings > Domains
2. Add your domain
3. Configure DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Monitoring & Analytics

Vercel provides built-in analytics:
- Function execution times
- Error rates
- Bandwidth usage
- Real user monitoring

## Support

For Vercel-specific issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

For app-specific issues, check the main README.md and issue tracker.
