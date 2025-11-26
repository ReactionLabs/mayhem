# Deploy Readiness & Hardening Checklist

This document summarizes gaps found in the repo for a safe Vercel deployment, scalability, and adding a Farcaster (Frames) surface. It also includes concrete fixes and recommended next steps.

## 1) Secrets & Environment Hygiene (Critical)
- Issues
  - `.env.local` is committed with live-looking secrets (Cloudflare R2, UploadThing, Helius mainnet RPC).
  - No `.env.example` to document required variables.
- Actions
  - Remove `.env.local` from git and rotate exposed credentials in their providers immediately.
  - Create `.env.example` containing variable names only and safe placeholders.
  - Configure Vercel Project Settings ? Environment Variables (Development/Preview/Production). Do not commit secrets.
  - Prefer devnet defaults for non-production environments.
- Suggested Variables (non-exhaustive; tailor as needed)
  - NEXT_PUBLIC_RPC_URL=
  - RPC_URL=
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  - CLERK_SECRET_KEY=
  - CLERK_WEBHOOK_SECRET=
  - NEXT_PUBLIC_SUPABASE_URL=
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=
  - R2_ACCESS_KEY_ID=
  - R2_SECRET_ACCESS_KEY=
  - R2_ACCOUNT_ID=
  - R2_BUCKET=
  - UPLOADTHING_TOKEN=
  - NEXT_PUBLIC_ENABLE_CLERK=
  - VERCEL_AI_GATEWAY_URL=
  - VERCEL_AI_GATEWAY_API_KEY=

## 2) Build Integrity & CI
- Issues
  - `next.config.ts` ignores TypeScript and ESLint build errors, hiding real issues.
- Actions
  - Enable strict builds in production (or at least in CI):
    - typescript.ignoreBuildErrors = false
    - eslint.ignoreDuringBuilds = false
  - Add CI steps (GitHub Actions or Vercel�s Build Step):
    - `npm ci`
    - `npm run type-check`
    - `npm run lint`
    - `npm run build`
  - Fix surfaced type and lint errors before deploying.

## 3) Vercel Serverless Compatibility
- Areas to review in `src/pages/api/*`:
  - Long-running tasks: ensure each handler completes within Vercel function limits or offload to a job queue.
  - Webhooks (e.g., `api/webhooks/clerk.ts`): verify signature validation and return 2xx quickly.
  - File uploads (`api/upload.ts`): avoid local filesystem, stream directly to R2/S3; enforce size limits.
  - Database (`pg`, `src/lib/db.ts`): use serverless-friendly pooling or a serverless driver; open connections per request, not globally persistent.
  - RPC calls: add timeouts, retries with backoff, and caching where possible.
- Actions
  - Add input validation (e.g., `zod`) to API routes.
  - Wrap outbound calls with timeouts + retry (exponential backoff) patterns.
  - Return explicit HTTP status codes and error shapes.

## 4) Solana Mainnet Safety
- Issues
  - Mainnet Helius RPC is present in committed env; risk of unintended mainnet actions and rate limits.
- Actions
  - Default to `devnet` in Development/Preview envs; only use mainnet in Production with explicit gating.
  - For any transaction-sending endpoints (`api/send-transaction.ts`, `api/trade-pump.ts`):
    - Require explicit user confirmation and enforce max amounts/limits.
    - Never store private keys server-side. Users sign with their own wallets client-side.
  - Add request-rate limiting (e.g., in-memory for single instance, or edge/cache-based) for abuse protection.

## 5) Scaling & Performance
- RPC & External APIs
  - Use a paid RPC tier or multiplex keys; add caching for token lists/metadata and exponential backoff on failures.
- Caching Strategy
  - For expensive API routes, add server-side caching (HTTP cache headers, KV store, or ISR/SSR with caching where applicable).
- React Query
  - Ensure sensible defaults: `staleTime`, `retry` counts, `refetchOnWindowFocus`, to prevent thundering herds.
- Bundles & Code-splitting
  - Audit bundle size; lazy-load heavy components (charts, large libs). Use Next dynamic imports for non-critical UI.

## 6) Database & State
- If using `pg` directly:
  - Use connection pooling compatible with serverless (e.g., Neon, RDS Proxy) or a serverless driver.
  - Instantiate clients per request and close promptly. Avoid global long-lived connections.
- Apply schema migrations via a repeatable process (document how to run them in CI/CD or manually).

## 7) Observability & Reliability
- Add basic logging in API routes (structured logs, no secrets).
- Add error boundary UI for React pages.
- Add monitoring:
  - Vercel Analytics/Logs, and provider-side dashboards (Clerk, Supabase, RPC, R2).
- Define incident playbooks for rate limit errors and provider outages.

## 8) Security & Validation
- Input validation in all API routes (zod schema, length/type checks).
- Verify webhook signatures (Clerk) and short-circuit on failure.
- Enforce CORS as needed for sensitive endpoints.
- Sanitize any user-supplied content before rendering.

## 9) Farcaster (Frames) Surface
- What�s missing
  - No frame endpoints or Farcaster SDK usage.
- Minimal plan to add Frames
  - Add `/api/frames` to serve initial frame (HTML + OG image, proper meta tags).
  - Add action endpoints for button taps; verify Farcaster signature per spec (or use Neynar SDK).
  - Generate/host OG image (static or dynamic) per token/action.
  - Document domain and HTTPS requirements; test with Warpcast frame validator.

## 10) Documentation & Dev Experience
- Add `.env.example` with all required variables and comments.
- Update README with:
  - Environment setup (devnet vs mainnet), how to provision keys/providers.
  - How to run locally: `npm ci`, `npm run dev`.
  - How to deploy on Vercel: required env vars per environment and any build flags.
  - Safety guidelines for Solana interactions.

## 11) Quick Start Actions (Checklist)
- [ ] Purge `.env.local` from repo history; rotate exposed secrets.
- [ ] Add `.env.example`; configure Vercel envs.
- [ ] Re-enable strict build checks and fix resulting errors.
- [ ] Audit API routes for serverless timeouts, validation, and security.
- [ ] Default to devnet in non-prod; add rate limits on tx routes.
- [ ] Verify DB pooling or move to serverless driver.
- [ ] Add basic caching/backoff to RPC-heavy endpoints.
- [ ] Add minimal Farcaster Frame endpoints if desired.
- [ ] Update README with deployment/run steps.

---

Need help applying any of the changes above? I can:
- Generate `.env.example` from current code,
- Patch `next.config.ts` for CI safety,
- Add input validation and rate limiting to API routes,
- Scaffold a minimal Farcaster Frames flow.