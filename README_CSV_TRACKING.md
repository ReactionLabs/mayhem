# Token Analytics CSV Tracking

## Overview

The application automatically tracks every new token created on Pump.fun and saves the data to a CSV file for analysis.

## CSV Location

**File**: `data/token-analytics.csv`

The CSV file is automatically created in the `data/` directory at the project root.

## CSV Format

The CSV contains the following columns:

1. **Timestamp** - ISO 8601 timestamp when the token was created
2. **Name** - Token name
3. **Ticker** - Token symbol/ticker
4. **Contract Address** - Token mint address (CA)
5. **Initial Buy In (SOL)** - Amount of SOL used in the initial buy
6. **Initial Buy In (USD)** - Initial buy amount in USD (SOL * $200)
7. **Initial Market Cap (SOL)** - Market cap at creation in SOL
8. **Initial Market Cap (USD)** - Market cap at creation in USD
9. **Metadata URI** - IPFS/metadata URI for the token

## Example CSV Row

```csv
2024-01-15T10:30:45.123Z,MyToken,MTK,ABC123...xyz,0.5,100.00,1000.0,200000.00,https://pump.fun/ipfs/...
```

## How It Works

1. **Automatic Tracking**: When a new token is detected via the Pump.fun WebSocket stream, the data is automatically captured
2. **Server-Side Storage**: The CSV is saved server-side via the `/api/save-token-csv` endpoint
3. **Non-Blocking**: CSV saving happens asynchronously and won't block the UI if it fails
4. **Continuous Logging**: Every new token is appended to the CSV file

## Data Collection

The tracking is integrated into `src/contexts/PumpFeedProvider.tsx` and triggers automatically when:
- A new token creation event is received from Pump.fun
- The event contains all required fields (name, symbol, mint address)

## Analysis

The CSV file can be:
- Opened in Excel, Google Sheets, or any spreadsheet application
- Analyzed with Python (pandas), R, or other data analysis tools
- Used to identify patterns in token launches
- Track initial buy-in amounts and market cap trends

## File Management

- The CSV file is created automatically on first token detection
- New tokens are appended to the file (not overwritten)
- The file persists across server restarts
- Location: `data/token-analytics.csv` in the project root

## Notes

- SOL to USD conversion uses $200 per SOL (can be updated in the code)
- Timestamps are in UTC (ISO 8601 format)
- If CSV saving fails, it won't break the application (errors are logged only in development)

