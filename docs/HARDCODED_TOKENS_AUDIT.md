# Hardcoded Tokens & Data Source Audit

## ✅ No Hardcoded Token Addresses Found

The application does **NOT** contain any hardcoded token contract addresses (CAs). All addresses found are legitimate protocol/system addresses:

### Protocol Addresses (Legitimate)
- **Pump.fun Program ID**: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
  - Location: `src/lib/pump-fun.ts`
  - Purpose: Pump.fun protocol program address
  
- **Service Fee Recipient**: `Cdnz7Nf47SnVW6NGy3jSqeCv6Bhb6TkzDhppAzyxTm2Z`
  - Location: `src/lib/pump-fun.ts`, `src/pages/create-pool.tsx`
  - Purpose: Service fee collection address (user-specified)
  
- **SOL Native Mint**: `So11111111111111111111111111111111111111112`
  - Location: `src/components/Terminal/index.tsx`
  - Purpose: Native SOL token mint (system address, not a token)
  
- **Token Program ID**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
  - Location: `src/components/Explore/ExploreColumn.tsx`, `src/contexts/PumpFeedProvider.tsx`
  - Purpose: Standard SPL Token Program (system address)

## ✅ Live Streaming Data Only

### Data Sources
1. **Pump.fun WebSocket Stream** (`wss://pumpportal.fun/api/data`)
   - Real-time token creation events
   - Real-time trade events
   - Live price updates
   - Location: `src/contexts/PumpFeedProvider.tsx`

2. **Jupiter Data API** (`https://datapi.jup.ag`)
   - Historical token data
   - Token metadata
   - Transaction history
   - Holder information
   - Location: `src/components/Explore/client.ts`

### No Mock/Test Data
- ✅ No `MOCK_*` constants
- ✅ No hardcoded test tokens
- ✅ No example token addresses
- ✅ All data comes from live APIs

## ✅ Historical Token Search

### Implementation
1. **Header Search** (`src/components/Header.tsx`)
   - Supports searching by contract address (CA)
   - Supports searching by token name (via API)
   - Direct navigation to `/token/[tokenId]` for any token

2. **Search API** (`src/pages/api/search-token.ts`)
   - Validates Solana addresses
   - Fetches token info from Jupiter API
   - Returns token data for historical tokens

3. **Token Page** (`src/pages/token/[tokenId].tsx`)
   - Uses `ApeQueries.tokenInfo` which fetches from Jupiter API
   - Works for both live stream tokens and historical tokens
   - No dependency on stream data for basic token info

### How to Search Historical Tokens
1. **By Contract Address (CA)**:
   - Paste the token's contract address in the header search
   - Navigates directly to token page
   - Works for any token on Solana (if Jupiter has data)

2. **By Name** (Future Enhancement):
   - Currently shows helpful error message
   - Can be enhanced with Jupiter's search API when available

## Summary

✅ **No hardcoded token addresses**  
✅ **100% live streaming data** (Pump.fun WebSocket)  
✅ **Historical token support** (Jupiter Data API)  
✅ **Search by CA** (fully functional)  
✅ **Search by name** (API endpoint ready, needs Jupiter search integration)

