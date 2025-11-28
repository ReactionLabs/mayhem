# Quick Start: Using the New Structure

## Immediate Wins

### 1. Use Configuration Instead of process.env

**Before:**
```typescript
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
```

**After:**
```typescript
import { env } from '@/config';
const rpcUrl = env.rpcUrl;
```

### 2. Use Services Instead of Direct API Calls

**Before:**
```typescript
const response = await fetch('https://price.jup.ag/v4/price?ids=' + mint);
const data = await response.json();
```

**After:**
```typescript
import { jupiterService } from '@/services/api';
const price = await jupiterService.getTokenPrice(mint);
```

### 3. Use Constants for Routes

**Before:**
```typescript
router.push(`/token/${tokenId}`);
```

**After:**
```typescript
import { routes } from '@/lib/constants';
router.push(routes.token(tokenId));
```

### 4. Use API Middleware in Routes

**Before:**
```typescript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // handler logic
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**After:**
```typescript
import { withMethod, withErrorHandler } from '@/lib/api';
import { sendSuccess } from '@/lib/api/response';

export default withErrorHandler(
  withMethod(['POST'])(async (req, res) => {
    // handler logic
    sendSuccess(res, data);
  })
);
```

## Migration Checklist

- [ ] Replace `process.env` with `env` from `@/config`
- [ ] Replace direct `fetch` calls with service layer
- [ ] Update API routes to use middleware
- [ ] Replace hardcoded routes with `routes` constant
- [ ] Update RPC connections to use `getRpcConnection()`

## Examples

See:
- `src/pages/api/v1/trades/index.example.ts` - Refactored API route
- `src/contexts/WalletManagerContext.tsx` - Updated to use `solanaService`

