# Mayhem Application Restructure Plan

## Current Issues

1. **Inconsistent API Route Organization**: Mixed patterns, some nested, some flat
2. **Feature Components Mixed with UI**: Business logic components in same directory as UI primitives
3. **No Service Layer**: API calls scattered across components and API routes
4. **Scattered Types**: Types defined in components, contexts, and separate files
5. **Hardcoded Configuration**: Environment variables and constants not centralized
6. **Inconsistent Error Handling**: Different patterns across the codebase
7. **Missing Feature-Based Organization**: Components organized by type, not feature

## New Structure

```
src/
├── app/                          # Next.js App Router (future migration)
├── pages/                        # Current Pages Router
│   ├── api/
│   │   ├── v1/                   # Versioned API routes
│   │   │   ├── tokens/
│   │   │   ├── trades/
│   │   │   ├── wallets/
│   │   │   └── users/
│   │   └── webhooks/
│   └── [pages].tsx
├── features/                     # Feature-based modules
│   ├── explore/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── token/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── trading/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── wallet/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types.ts
│       └── index.ts
├── components/                   # Shared UI components only
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Layout components
│   └── common/                   # Shared business components
│       ├── Header.tsx
│       ├── ErrorBoundary.tsx
│       └── ThemeToggle.tsx
├── services/                     # External API services
│   ├── api/
│   │   ├── jupiter.ts
│   │   ├── pumpfun.ts
│   │   ├── dexscreener.ts
│   │   └── index.ts
│   ├── blockchain/
│   │   ├── solana.ts
│   │   └── index.ts
│   └── storage/
│       ├── supabase.ts
│       └── index.ts
├── lib/                          # Utilities and helpers
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── hooks/
│   │   └── common.ts
│   └── constants/
│       ├── networks.ts
│       ├── routes.ts
│       └── index.ts
├── config/                       # Configuration
│   ├── env.ts
│   ├── rpc.ts
│   └── index.ts
├── contexts/                     # Global contexts
│   ├── providers.tsx            # Combined provider
│   └── [contexts].tsx
├── hooks/                        # Shared hooks
│   └── [hooks].ts
├── types/                        # Global types
│   ├── api.ts
│   ├── blockchain.ts
│   └── index.ts
└── styles/
    └── globals.css
```

## Migration Steps

1. Create new directory structure
2. Move feature components to features/
3. Extract services from components
4. Consolidate types
5. Centralize configuration
6. Reorganize API routes
7. Update all imports
8. Test and verify

