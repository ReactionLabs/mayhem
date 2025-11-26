import { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const CSV_DIR = join(process.cwd(), 'data');
const CSV_FILE = join(CSV_DIR, 'token-analytics.csv');

type TokenRecord = {
  timestamp: string;
  name: string;
  ticker: string;
  contractAddress: string;
  initialBuyInSOL: number;
  initialBuyInUSD: number;
  initialMarketCapSOL: number;
  initialMarketCapUSD: number;
  metadataUri?: string;
  creatorWallet?: string;
};

// Parse CSV line to token record
function parseCSVLine(line: string, headers: string[]): TokenRecord | null {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  if (values.length < headers.length) return null;

  const record: any = {};
  headers.forEach((header, index) => {
    const value = values[index]?.replace(/^"|"$/g, '') || '';
    if (header === 'Timestamp') record.timestamp = value;
    else if (header === 'Name') record.name = value;
    else if (header === 'Ticker') record.ticker = value;
    else if (header === 'Contract Address') record.contractAddress = value;
    else if (header === 'Initial Buy In (SOL)') record.initialBuyInSOL = parseFloat(value) || 0;
    else if (header === 'Initial Buy In (USD)') record.initialBuyInUSD = parseFloat(value) || 0;
    else if (header === 'Initial Market Cap (SOL)') record.initialMarketCapSOL = parseFloat(value) || 0;
    else if (header === 'Initial Market Cap (USD)') record.initialMarketCapUSD = parseFloat(value) || 0;
    else if (header === 'Metadata URI') record.metadataUri = value;
    else if (header === 'Creator Wallet') record.creatorWallet = value;
  });

  return record as TokenRecord;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!existsSync(CSV_FILE)) {
      return res.status(200).json({ tokens: [] });
    }

    const content = await readFile(CSV_FILE, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      return res.status(200).json({ tokens: [] });
    }

    // Parse headers
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    // Parse data lines and filter by creator wallet
    const tokens: TokenRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const record = parseCSVLine(lines[i], headers);
      if (record && record.creatorWallet?.toLowerCase() === wallet.toLowerCase()) {
        tokens.push(record);
      }
    }

    // Sort by timestamp (newest first)
    tokens.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({ tokens });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reading tokens:', error);
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch tokens'
    });
  }
}

