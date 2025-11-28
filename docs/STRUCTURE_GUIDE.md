# Mayhem Application Structure Guide

## Overview

This document describes the restructured application architecture following modern Next.js and React best practices.

## Directory Structure

```
src/
├── config/              # Configuration management
├── services/            # External API and service layer
├── features/            # Feature-based modules (business logic)
├── components/          # Shared UI components
├── lib/                 # Utilities and helpers
├── contexts/            # React contexts
├── hooks/               # Shared React hooks
├── types/               # Global TypeScript types
└── pages/               # Next.js pages and API routes
```

## Architecture Principles

### 1. Feature-Based Organization

Features are self-contained modules that include:
- Components specific to that feature
- Hooks for feature-specific logic
- Services for feature-specific API calls
- Types for feature-specific data structures

Example:
```
features/token/
├── components/
│   ├── TokenCard.tsx
│   └── TokenHeader.tsx
├── hooks/
│   └── useTokenData.ts
├── services/
│   └── tokenService.ts
├── types.ts
└── index.ts
```

### 2. Service Layer

All external API calls go through the service layer:
- `services/api/` - External REST APIs (Jupiter, PumpFun, etc.)
- `services/blockchain/` - Blockchain operations (Solana)
- `services/storage/` - Database operations (Supabase)

**Benefits:**
- Centralized error handling
- Easy to mock for testing
- Consistent API patterns
- Single source of truth for API endpoints

### 3. Configuration Management

All configuration lives in `config/`:
- `env.ts` - Environment variables with validation
- `rpc.ts` - RPC connection configuration

**Usage:**
```typescript
import { env } from '@/config';
import { getRpcConnection } from '@/config/rpc';
```

### 4. Constants

Application constants are centralized:
- `lib/constants/routes.ts` - Route definitions
- `lib/constants/networks.ts` - Network constants

**Usage:**
```typescript
import { routes } from '@/lib/constants';
router.push(routes.token(tokenId));
```

### 5. API Routes

API routes follow consistent patterns:
- Use middleware for common concerns (method validation, error handling)
- Standardized response format
- Consistent error handling

**Example:**
```typescript
import { withMethod, withErrorHandler } from '@/lib/api';
import { sendSuccess, sendError } from '@/lib/api/response';

const handler = withErrorHandler(
  withMethod(['GET'])(async (req, res) => {
    // Handler logic
    sendSuccess(res, data);
  })
);

export default handler;
```

## Migration Checklist

- [x] Create config directory and environment management
- [x] Create services layer (API, blockchain)
- [x] Create constants directory
- [x] Create API utilities (response helpers, middleware)
- [ ] Move feature components to features/
- [ ] Update API routes to use new patterns
- [ ] Consolidate types
- [ ] Update all imports
- [ ] Add comprehensive error boundaries
- [ ] Add loading states consistently
- [ ] Add proper TypeScript types throughout

## Best Practices

### Component Organization

1. **Feature Components** → `features/[feature]/components/`
2. **Shared Business Components** → `components/common/`
3. **UI Primitives** → `components/ui/`

### Import Paths

Use absolute imports with `@/` prefix:
```typescript
import { env } from '@/config';
import { jupiterService } from '@/services/api';
import { routes } from '@/lib/constants';
```

### Error Handling

1. Use `ApiError` for API errors
2. Use `handleApiError` in API routes
3. Use ErrorBoundary for React errors
4. Log errors appropriately based on environment

### Type Safety

1. Define types close to where they're used (feature types in features/)
2. Shared types in `types/`
3. Use TypeScript strictly (no `any` unless necessary)
4. Export types from feature index files

## Next Steps

1. Gradually migrate components to features/
2. Update API routes to use new middleware
3. Extract more services from components
4. Add comprehensive error handling
5. Add loading and error states consistently
6. Improve TypeScript coverage

