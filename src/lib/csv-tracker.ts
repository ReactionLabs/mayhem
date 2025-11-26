/**
 * CSV Tracker for New Token Analytics
 * Tracks: name, ticker, contract address, initial buy-in amount, creator wallet
 */

export type TokenRecord = {
  timestamp: string;
  name: string;
  ticker: string;
  contractAddress: string;
  initialBuyInSOL: number;
  initialBuyInUSD: number;
  initialMarketCapSOL: number;
  initialMarketCapUSD: number;
  metadataUri?: string;
  creatorWallet?: string; // Wallet address that created the token
};

const CSV_HEADER = 'Timestamp,Name,Ticker,Contract Address,Initial Buy In (SOL),Initial Buy In (USD),Initial Market Cap (SOL),Initial Market Cap (USD),Metadata URI,Creator Wallet\n';

/**
 * Convert token record to CSV row
 */
export function tokenRecordToCSVRow(record: TokenRecord): string {
  const escapeCSV = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    escapeCSV(record.timestamp),
    escapeCSV(record.name),
    escapeCSV(record.ticker),
    escapeCSV(record.contractAddress),
    escapeCSV(record.initialBuyInSOL.toFixed(6)),
    escapeCSV(record.initialBuyInUSD.toFixed(2)),
    escapeCSV(record.initialMarketCapSOL.toFixed(6)),
    escapeCSV(record.initialMarketCapUSD.toFixed(2)),
    escapeCSV(record.metadataUri || ''),
    escapeCSV(record.creatorWallet || ''),
  ].join(',') + '\n';
}

/**
 * Save token record to CSV via API
 */
export async function saveTokenToCSV(record: TokenRecord): Promise<void> {
  try {
    await fetch('/api/save-token-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to save token to CSV:', error);
    }
    // Don't throw - we don't want to break the app if CSV saving fails
  }
}
