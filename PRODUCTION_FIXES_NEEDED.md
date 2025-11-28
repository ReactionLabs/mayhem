# Production Fixes - Priority Action Items

## 🔴 CRITICAL - Fix Immediately

### 1. Harry Agent - Wallet Storage & Trading ✅ FIXED
- ✅ Wallet storage restored
- ✅ Real trading implemented (uses PumpPortal API)
- ✅ Token creation with launch capability
- ✅ All claimed features now functional

### 2. Security - Private Key Encryption
**File**: `src/pages/api/webhooks/clerk.ts`, `src/lib/wallet-storage.ts`
**Issue**: Private keys stored with basic obfuscation
**Fix**: Implement AES-256 encryption
```typescript
// Use crypto-js or Web Crypto API
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes

function encryptPrivateKey(privateKey: string): string {
  return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY!).toString();
}

function decryptPrivateKey(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY!);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### 3. Rate Limiting
**Files**: All `/api/*` routes
**Fix**: Add rate limiting middleware
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Add to each API route:
const { success } = await ratelimit.limit(identifier);
if (!success) {
  return res.status(429).json({ error: "Rate limit exceeded" });
}
```

### 4. Input Validation
**Files**: All API routes
**Fix**: Add Zod schemas
```typescript
import { z } from 'zod';

const tradeSchema = z.object({
  action: z.enum(['buy', 'sell']),
  mint: z.string().regex(/^[A-Za-z0-9]{32,44}$/),
  amount: z.number().positive().max(1000), // Max 1000 SOL
  slippage: z.number().min(0).max(50),
});

// In API route:
const result = tradeSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: result.error });
}
```

### 5. CORS Configuration
**File**: `vercel.json`
**Issue**: CORS allows all origins (`*`)
**Fix**: Restrict to specific domains
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "https://mayhem.vercel.app,https://www.mayhem.vercel.app"
}
```

### 6. Environment Variable Security
**File**: `.env.example` (create if missing)
**Issue**: No documentation of required env vars
**Fix**: Create `.env.example` with all required variables (no actual values)

### 7. Error Logging
**Files**: All API routes
**Issue**: Sensitive data may be logged
**Fix**: Sanitize logs
```typescript
function sanitizeError(error: any): any {
  const sanitized = { ...error };
  delete sanitized.privateKey;
  delete sanitized.apiKey;
  delete sanitized.secretKey;
  return sanitized;
}
```

---

## 🟡 HIGH PRIORITY

### 8. Transaction Validation
**File**: `src/pages/create-pool.tsx`, trading endpoints
**Fix**: Add pre-flight checks
- Validate balance before transaction
- Simulate transaction before sending
- Check slippage limits
- Verify transaction structure

### 9. Database Connection Pooling
**File**: `src/lib/db.ts`
**Fix**: Use serverless-compatible pooling
```typescript
import { Pool } from 'pg';
import { neonConfig } from '@neondatabase/serverless';

// Configure for serverless
neonConfig.webSocketConstructor = ws;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Serverless-friendly
});
```

### 10. API Timeout Handling
**Files**: All external API calls
**Fix**: Add timeouts
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeoutId);
}
```

### 11. Retry Logic
**Files**: External API calls
**Fix**: Implement exponential backoff
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 12. Content Security Policy
**File**: `next.config.ts`
**Fix**: Add CSP headers
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

---

## 🟢 MEDIUM PRIORITY

### 13. Monitoring & Error Tracking
**Fix**: Add Sentry
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 14. Caching Strategy
**Fix**: Add Redis/KV caching
- Cache token metadata (5 min TTL)
- Cache RPC responses (1 min TTL)
- Cache user wallet data (1 min TTL)

### 15. Database Migrations
**Fix**: Use Prisma or Drizzle
- Version control schema changes
- Automated migrations on deploy

### 16. Load Testing
**Fix**: Test with k6 or Artillery
- Test API endpoints under load
- Test concurrent trading
- Test RPC rate limits

---

## 📋 QUICK WINS (Can Fix Today)

1. ✅ Harry agent functionality - DONE
2. Add input validation to 3 most-used API routes
3. Add rate limiting to trading endpoints
4. Restrict CORS in vercel.json
5. Add timeout to external API calls
6. Create .env.example file
7. Add error sanitization helper

---

## 🎯 RECOMMENDED ORDER

1. **Today**: Fix Harry, add input validation, restrict CORS
2. **This Week**: Add rate limiting, encryption, error tracking
3. **Next Week**: Performance optimization, caching, monitoring
4. **Before Launch**: Security audit, load testing, penetration testing


