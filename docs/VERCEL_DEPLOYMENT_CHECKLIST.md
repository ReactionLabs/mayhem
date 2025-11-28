# ✅ Vercel Deployment Checklist

Use this checklist to ensure your Mayhem application is ready for deployment on Vercel.

## Pre-Deployment

### 1. Environment Variables Setup
- [ ] **OpenAI Configuration** (choose one):
  - [ ] `OPENAI_API_KEY` - Direct OpenAI API key
  - [ ] **OR** `VERCEL_AI_GATEWAY_URL` + `VERCEL_AI_GATEWAY_API_KEY` (Recommended)
- [ ] `NEXT_PUBLIC_RPC_URL` - Solana RPC endpoint (required)
- [ ] `NEXT_PUBLIC_SOLANA_NETWORK` - `mainnet-beta` or `devnet`
- [ ] `DIP-API-KEY` or `DIP_API_KEY` - PumpPortal API key (optional)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (if using database)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (if using database)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk key (if using auth)

### 2. Code Quality
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors (or acceptable warnings)
- [ ] Run `npm run build` - Build succeeds locally
- [ ] Test all critical features locally:
  - [ ] Wallet connection
  - [ ] Token creation
  - [ ] Token trading
  - [ ] AI agents (Harry, Trading Companion)
  - [ ] API routes

### 3. Configuration Files
- [ ] `vercel.json` - Function timeouts configured correctly
- [ ] `next.config.ts` - Webpack config for wallet adapters
- [ ] `.vercelignore` - Unnecessary files excluded
- [ ] `package.json` - Build scripts are correct

### 4. Security
- [ ] No API keys committed to repository
- [ ] `.env.local` is in `.gitignore`
- [ ] All sensitive data uses environment variables
- [ ] CORS headers configured in `vercel.json`

## Vercel Dashboard Setup

### 5. Project Configuration
- [ ] Repository connected to Vercel
- [ ] Framework preset: **Next.js** (auto-detected)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)
- [ ] Install Command: `npm install` (default)
- [ ] Node.js Version: 18.x or higher

### 6. Environment Variables in Vercel
- [ ] All environment variables added in Vercel dashboard
- [ ] Variables set for correct environments:
  - [ ] Production
  - [ ] Preview
  - [ ] Development
- [ ] Vercel AI Gateway enabled (if using)

### 7. Function Configuration
- [ ] API routes have appropriate timeouts:
  - [ ] General APIs: 30s
  - [ ] AI generation: 60s
  - [ ] Streaming endpoints: 60s
- [ ] CORS headers configured for API routes

## Deployment

### 8. Initial Deployment
- [ ] Push code to main branch
- [ ] Vercel automatically triggers deployment
- [ ] Build completes successfully
- [ ] No build errors in Vercel logs

### 9. Post-Deployment Verification
- [ ] Application loads correctly
- [ ] Wallet connection works
- [ ] API routes respond correctly
- [ ] AI features work (if configured)
- [ ] No console errors in browser
- [ ] Check Vercel function logs for errors

### 10. Testing
- [ ] Test token creation flow
- [ ] Test trading functionality
- [ ] Test AI agents
- [ ] Test wallet management
- [ ] Test all API endpoints
- [ ] Test on mobile devices (responsive design)

## Monitoring

### 11. Ongoing Maintenance
- [ ] Monitor Vercel function logs
- [ ] Check error rates in Vercel dashboard
- [ ] Monitor API usage and costs
- [ ] Set up alerts for critical errors
- [ ] Review performance metrics

## Troubleshooting

### Common Issues:

**Build Fails:**
- Check environment variables are set
- Verify Node.js version (18+)
- Check for TypeScript errors
- Review build logs in Vercel

**Runtime Errors:**
- Check browser console for client errors
- Review Vercel function logs
- Verify API keys are correct
- Check CORS configuration

**API Timeouts:**
- Increase timeout in `vercel.json`
- Consider upgrading to Vercel Pro for longer timeouts
- Optimize API route performance

**Environment Variables Not Loading:**
- Verify variables are set in correct environment
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables Guide](./ENV_SETUP.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)

