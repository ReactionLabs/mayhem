## Convex Integration Prompt

Hi Convex team 👋 — we’re building **Mayhem**, a Pump.fun-focused launchpad + trading desk for Solana. We’d love your help figuring out how Convex can power the data layer and wallet key management for our users.

### Current Stack + Data Flows

1. **Frontend**: Next.js (Pages Router), Tailwind, Shadcn UI, Radix, TypeScript  
2. **Auth / Identity**: Clerk (email + social + wallet pairing)  
3. **Wallets**: Jupiter Unified Wallet Adapter for in-browser signing; users can also generate PumpPortal bot wallets with API keys/private keys  
4. **Data Sources**:  
   - Pump.fun WebSockets (`wss://pumpportal.fun/api/data`) for live token streams  
   - Jupiter and DexScreener REST APIs for token stats  
5. **Persistence** (today):  
   - LocalStorage for multi-wallet selections, generated wallets (API key, private key, labels)  
   - CSV file for token launch analytics  
   - Supabase (planned) for user/wallet/token/trade tables but not yet fully implemented  

### What We’ve Built So Far

- **Studio / Token Launchpad**: Complete Pump.fun launch flow with custom tokenomics, IPFS upload proxy, and CSV logging.  
- **Trading Dashboard**: Live feed, chart, order panel, and *new* multi-wallet selector that lets users toggle multiple bot wallets for simultaneous trading/consolidation.  
- **Header Enhancements**: Real SOL balance with SOL badge, Clerk session controls, wallet dropdown.  
- **Chrome Extension**: Automation bridge for chart analysis/backlinks (separate repo folder).  

### Why We’re Talking to Convex

We need a real backend that can:

1. **Store multiple wallets + API keys per user**  
   - Attributes: label, type (`connected` vs `generated` vs `imported`), API key, encrypted private key, balance cache, active flag, group ID.  
   - Operations: CRUD wallets, toggle active, refresh balances, bulk activate, consolidate (source → receiver).  
2. **Persist wallet groups**  
   - Each group has source+receiver lists, status, last consolidation time, automation rules (future).  
3. **Transaction + activity logging**  
   - We currently append CSVs for launches; want structured storage for trades, launches, analytics.  
4. **Realtime sync**  
   - When user toggles wallets or groups we’d like instant UI updates across tabs/devices.  
5. **Access control**  
   - Everything needs to be scoped per Clerk user ID. Ideally we can trust Clerk’s JWT, map to Convex identity, and store encrypted secrets server-side.  

### Questions for Convex

1. **Wallet / Key Storage**  
   - Can Convex store multiple API keys & encrypted private keys per Clerk user?  
   - Recommended pattern for encryption-at-rest? (Our plan: encrypt in browser w/ user password or server-managed key, but open to Convex KMS patterns.)  
   - Any guidance on secret retrieval for client-side signing (e.g., batched trading)?  
2. **Data Modeling**  
   - Proposed tables: `users`, `wallets`, `walletGroups`, `trades`, `launches`, `analytics`.  
   - Do you have best practices for modeling hierarchical wallet groups + toggles?  
3. **Realtime + Actions**  
   - We’d like watchers so the dashboard auto-updates when wallets are toggled elsewhere.  
   - Need reliable mutation functions for “activate selected wallets”, “consolidate group”, etc.  
4. **Clerk Integration**  
   - Is it better to keep wallet lists inside Clerk metadata (limited) or migrate all wallet data to Convex and just store Clerk IDs there?  
   - Can Convex validate Clerk sessions directly (e.g., using Clerk JWT as auth)?  

### What We’d Like From You

1. **Confirm Convex is a good fit** for the multi-wallet storage + real-time management use case.  
2. **Recommend a schema & auth pattern** for:
   - Users (Clerk ID, profile info)  
   - Wallets (multiple per user, with encrypted secrets)  
   - Wallet groups (source/receiver sets, toggles)  
   - Activity logs (launches, trades, consolidation actions)  
3. **Outline migration steps** from LocalStorage/CSV → Convex (data import strategy).  
4. **Share best practices** for encrypting/storing PumpPortal API keys & Solana private keys in Convex.  
5. **Optional**: Show how to wire Convex queries/mutations into our Next.js components (e.g., `useConvexQuery` for wallet lists, `useMutation` for toggles).  

If there’s a more secure/easier way to keep everything inside Clerk (e.g., storing multiple wallet keys in Clerk’s private metadata), please let us know—otherwise we’re ready to lean into Convex for the data layer.

Thanks!  
— Team Mayhem 🚀

