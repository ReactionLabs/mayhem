# Mayhem Codebase File Tree

```
mayhem/
├── config.json                          # App configuration
├── next.config.ts                        # Next.js configuration
├── next-env.d.ts                        # Next.js TypeScript definitions
├── package.json                          # Dependencies and scripts
├── pnpm-lock.yaml                        # Package lock file
├── postcss.config.js                     # PostCSS configuration
├── tailwind.config.js                    # Tailwind CSS configuration
├── tsconfig.json                         # TypeScript configuration
├── vercel.json                           # Vercel deployment configuration
│
├── data/
│   └── token-analytics.csv              # Token analytics data
│
├── docs/                                 # Documentation
│   ├── AGENTS.md
│   ├── AI_SETUP.md
│   ├── CLERK_SETUP.md
│   ├── CLERK_WEB3_INTEGRATION.md
│   ├── CONVEX_PROMPT.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOY_READINESS_CHECKLIST.md
│   ├── DEPLOYMENT_READY.md
│   ├── ENV_SETUP.md
│   ├── EXTENSION_PAIRING.md
│   ├── EXTENSION_SUMMARY.md
│   ├── HARDCODED_TOKENS_AUDIT.md
│   ├── ISSUES_CHECKLIST.md
│   ├── LAUNCH_STATUS.md
│   ├── OPTIMIZATION_QUICK_START.md
│   ├── OPTIMIZATION_ROADMAP.md
│   ├── PERFECTION_LOG.md
│   ├── PRODUCTION_READINESS.md
│   ├── QUICK_START.md
│   ├── README_CSV_TRACKING.md
│   ├── RESTRUCTURE_PLAN.md
│   ├── RESTRUCTURE_SUMMARY.md
│   ├── STRUCTURE_GUIDE.md
│   ├── VERCEL_DEPLOYMENT_CHECKLIST.md
│   └── VERCEL_DEPLOYMENT.md
│
├── extension/                            # Chrome Extension
│   ├── AUTOMATION_GUIDE.md
│   ├── automation-commands.js
│   ├── automation.js
│   ├── background.js
│   ├── CHROME_EXTENSION_GUIDE.md
│   ├── COMMANDS.md
│   ├── COMPLETE.md
│   ├── content.css
│   ├── content.js
│   ├── create-icons.js
│   ├── FINAL_STATUS.md
│   ├── generate-icons.html
│   ├── INSTALL.md
│   ├── manifest.json
│   ├── options.html
│   ├── options.js
│   ├── PAIRING_STATUS.md
│   ├── popup.css
│   ├── popup.html
│   ├── popup.js
│   ├── QUICK_START.md
│   ├── README_AUTOMATION.md
│   ├── README.md
│   └── icons/
│       └── icon.svg
│
├── meteora-invent/                      # Meteora scaffold templates
│   ├── node_modules/
│   └── scaffolds/
│       └── fun-launch/
│
├── scripts/                              # Utility scripts
│   ├── AGENTS.md
│   ├── allocate-supply.ts
│   ├── analyze-tokens.py
│   ├── create-mint.ts
│   ├── set-metadata.ts
│   └── utils.ts
│
├── sql/                                  # Database schemas
│   └── 001_init.sql
│
├── supabase/                             # Supabase configuration
│   ├── schema.sql
│   └── seed.sql
│
├── public/                               # Static assets
│   ├── coins/
│   │   └── unknown.svg
│   ├── favicon.ico
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.png
│   ├── next.svg
│   ├── solana-sol-logo.png
│   ├── vercel.svg
│   └── window.svg
│
├── workflows/                            # CI/CD workflows
│   └── ci.yml
│
└── src/                                  # Source code
    ├── middleware.ts                     # Next.js middleware
    │
    ├── components/                       # React components
    │   ├── AdvancedTradingView/
    │   │   └── charting_library.d.ts
    │   ├── AIVisionChatbot.tsx
    │   ├── CommunityWalletInfo.tsx
    │   ├── Dashboard/
    │   │   ├── DashboardLayout.tsx
    │   │   ├── PositionsTable.tsx
    │   │   ├── TradePanel.tsx
    │   │   ├── TradingCompanion.tsx
    │   │   └── WatchlistSidebar.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── Explore/
    │   │   ├── client.ts
    │   │   ├── ExploreColumn.tsx
    │   │   ├── ExploreGrid.tsx
    │   │   ├── ExploreMsgHandler.tsx
    │   │   ├── index.tsx
    │   │   ├── MobileExploreTabs.tsx
    │   │   ├── PausedIndicator.tsx
    │   │   ├── pool-utils.ts
    │   │   ├── queries.ts
    │   │   └── types.ts
    │   ├── HarryAgent.tsx                # Main AI agent component
    │   ├── Header.tsx
    │   ├── LaunchpadIndicator/
    │   │   ├── info.tsx
    │   │   └── LaunchpadIndicator.tsx
    │   ├── Layout/
    │   │   └── Sidebar.tsx
    │   ├── Liquidity/
    │   │   ├── CreatePoolForm.tsx
    │   │   └── ProvideLiquidityForm.tsx
    │   ├── PumpTrade/
    │   │   ├── PumpTrade.tsx
    │   │   └── WalletManager.tsx
    │   ├── SentimentAnalysis.tsx
    │   ├── Spinner/
    │   │   └── Spinner.tsx
    │   ├── Swap/
    │   │   ├── QuickSwap.tsx
    │   │   └── TopTokensSwap.tsx
    │   ├── Table/
    │   │   └── index.tsx
    │   ├── Terminal/
    │   │   └── index.tsx
    │   ├── ThemeToggle.tsx
    │   ├── Token/
    │   │   └── TokenPageMsgHandler.tsx
    │   ├── TokenAge/
    │   │   └── index.tsx
    │   ├── TokenCard/
    │   │   ├── TokenCard.tsx
    │   │   ├── TokenCardList.tsx
    │   │   └── TokenCardMetric.tsx
    │   ├── TokenChart/
    │   │   ├── chartstate.ts
    │   │   ├── config.ts
    │   │   ├── constants.ts
    │   │   ├── datafeed.ts
    │   │   ├── formatter.tsx
    │   │   ├── intervals.ts
    │   │   ├── RefreshMarks.tsx
    │   │   └── TokenChart.tsx
    │   ├── TokenHeader/
    │   │   ├── BondingCurve.tsx
    │   │   ├── index.module.css
    │   │   ├── TokenChecklist.tsx
    │   │   ├── TokenDescription.tsx
    │   │   ├── TokenDetail.tsx
    │   │   ├── TokenHeader.tsx
    │   │   ├── TokenMetric/
    │   │   ├── TokenMetrics.tsx
    │   │   └── TokenStats.tsx
    │   ├── TokenIcon/
    │   │   ├── Context.tsx
    │   │   ├── index.tsx
    │   │   └── TokenIcon.tsx
    │   ├── TokenSocials/
    │   │   └── index.tsx
    │   ├── TokenTable/
    │   │   ├── BubbleMapsTab/
    │   │   ├── config.ts
    │   │   ├── HoldersTab/
    │   │   ├── index.tsx
    │   │   ├── Tabs/
    │   │   ├── TraderAddress.tsx
    │   │   ├── TraderIndicators/
    │   │   └── TxnsTab/
    │   ├── TruncatedAddress/
    │   │   └── TruncatedAddress.tsx
    │   ├── ui/                            # ShadCN UI components
    │   │   └── [26 component files]
    │   └── WalletManager/
    │       └── MultiWalletSelector.tsx
    │
    ├── config/                           # Configuration files
    │   ├── env.ts                         # Environment variables
    │   ├── index.ts
    │   ├── mania.ts
    │   └── rpc.ts
    │
    ├── constants/                         # App constants
    │   └── index.ts
    │
    ├── contexts/                          # React contexts
    │   ├── DataStreamProvider.tsx
    │   ├── ExploreProvider.tsx
    │   ├── ManiaFeedProvider.tsx
    │   ├── PumpFeedProvider.tsx
    │   ├── PumpStreamProvider.tsx
    │   ├── TokenChart/
    │   ├── TokenChartProvider.tsx
    │   ├── TradeOverlayContext.tsx
    │   ├── types.ts
    │   └── WalletManagerContext.tsx
    │
    ├── hooks/                             # Custom React hooks
    │   ├── queries.tsx
    │   ├── useExploreGemsTokenList.ts
    │   ├── useHarryAgent.ts               # Harry agent hook
    │   ├── useMobile.ts
    │   ├── useNonceAuth.ts
    │   ├── useSendTransaction.ts
    │   ├── useStreamingChat.ts            # AI chat streaming hook
    │   └── useUserWallet.ts
    │
    ├── icons/                             # Icon components
    │   ├── [22 icon files]
    │   └── types.ts
    │
    ├── lib/                               # Utility libraries
    │   ├── api/                           # API utilities
    │   │   ├── middleware.ts              # API middleware helpers
    │   │   ├── rate-limit.ts              # Rate limiting
    │   │   ├── response.ts                # Response helpers
    │   │   └── validation.ts              # Zod validation schemas
    │   ├── blockchain/                    # Blockchain utilities
    │   ├── constants/                     # Library constants
    │   ├── csv-tracker.ts                 # CSV tracking
    │   ├── db/                            # Database utilities
    │   ├── db.ts                          # Database client
    │   ├── debounce.ts                    # Debounce utility
    │   ├── device.ts                      # Device detection
    │   ├── encryption.ts                  # Encryption utilities
    │   ├── environment/                   # Environment helpers
    │   ├── extension-bridge.ts            # Extension bridge
    │   ├── format/                        # Formatting utilities
    │   ├── jotai.ts                       # Jotai state management
    │   ├── log-sanitizer.ts               # Log sanitization
    │   ├── nonce-auth.ts                  # Nonce authentication
    │   ├── pump-fun.ts                    # Pump.fun utilities
    │   ├── supabase.ts                    # Supabase client
    │   ├── token-data.ts                  # Token data utilities
    │   ├── utils.ts                       # General utilities
    │   └── wallet-storage.ts              # Wallet storage
    │
    ├── pages/                             # Next.js pages
    │   ├── _app.tsx                       # App wrapper
    │   ├── _document.tsx                  # Document wrapper
    │   ├── api/                           # API routes
    │   │   ├── agent-chat.ts              # AI agent chat (SSE streaming)
    │   │   ├── chat-stream.ts             # General chat streaming (SSE)
    │   │   ├── extension-command.ts       # Extension commands
    │   │   ├── generate-ai.ts             # AI content generation
    │   │   ├── ideas.ts                   # Token ideas
    │   │   ├── liquidity/
    │   │   │   └── pools.ts
    │   │   ├── mania/
    │   │   │   └── feeds.ts
    │   │   ├── my-tokens.ts               # User tokens
    │   │   ├── request-dex-payment.ts     # DEX payment requests
    │   │   ├── save-token-csv.ts          # CSV saving
    │   │   ├── search-token.ts            # Token search
    │   │   ├── send-transaction.ts        # Transaction sending
    │   │   ├── token-ath.ts               # Token ATH tracking
    │   │   ├── token-backlinks.ts         # Token backlinks
    │   │   ├── top-tokens.ts              # Top tokens
    │   │   ├── trade-pump.ts              # Pump.fun trading
    │   │   ├── upload.ts                  # File upload
    │   │   ├── user/
    │   │   │   └── wallet.ts              # User wallet management
    │   │   ├── v1/
    │   │   │   └── trades/
    │   │   │       └── index.example.ts
    │   │   ├── verify-nonce.ts            # Nonce verification
    │   │   ├── wallets/
    │   │   │   ├── [id].ts                # Wallet by ID
    │   │   │   └── index.ts                # Wallets list
    │   │   └── webhooks/
    │   │       └── clerk.ts               # Clerk webhook
    │   ├── ai-vision.tsx                  # AI Vision page
    │   ├── community.tsx                 # Community page
    │   ├── create-pool.tsx                # Pool creation
    │   ├── dashboard.tsx                  # Dashboard
    │   ├── explore.tsx                    # Explore page
    │   ├── harry.tsx                      # Harry agent page
    │   ├── index.tsx                      # Home page
    │   ├── liquidity.tsx                  # Liquidity page
    │   ├── login.tsx                      # Login page
    │   ├── mania.tsx                      # Mania feed page
    │   ├── my-tokens.tsx                  # My tokens page
    │   ├── portfolio.tsx                  # Portfolio page
    │   ├── sign-in/                       # Sign in page
    │   ├── sign-up/                       # Sign up page
    │   └── token/                         # Token detail page
    │
    ├── services/                          # Service layer
    │   ├── api/                           # API services
    │   ├── blockchain/                    # Blockchain services
    │   └── index.ts
    │
    ├── styles/                            # Global styles
    │   └── globals.css
    │
    └── types/                             # TypeScript types
        ├── fancytypes.ts
        ├── jupiter.d.ts
        ├── mania.ts
        └── shims.d.ts
```

## API Routes Summary

### AI Chat & Actions
- `/api/agent-chat.ts` - AI agent chat with SSE streaming (harry, trading, vision agents)
- `/api/chat-stream.ts` - General chat streaming with SSE
- `/api/generate-ai.ts` - AI content generation (titles, descriptions, images, coins, social content)

### Trading & Actions
- `/api/trade-pump.ts` - Pump.fun trading execution
- `/api/send-transaction.ts` - Transaction sending
- `/api/verify-nonce.ts` - Nonce verification for quick trading

### Token Management
- `/api/search-token.ts` - Token search
- `/api/top-tokens.ts` - Top tokens listing
- `/api/token-ath.ts` - Token ATH tracking
- `/api/token-backlinks.ts` - Token backlinks
- `/api/my-tokens.ts` - User tokens
- `/api/save-token-csv.ts` - CSV token tracking

### Wallet Management
- `/api/user/wallet.ts` - User wallet operations
- `/api/wallets/index.ts` - Wallets listing
- `/api/wallets/[id].ts` - Wallet by ID

### Other
- `/api/extension-command.ts` - Extension commands
- `/api/ideas.ts` - Token ideas
- `/api/upload.ts` - File upload
- `/api/request-dex-payment.ts` - DEX payment requests
- `/api/liquidity/pools.ts` - Liquidity pools
- `/api/mania/feeds.ts` - Mania feeds
- `/api/webhooks/clerk.ts` - Clerk webhook handler

