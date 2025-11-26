import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tokenRecordToCSVRow, TokenRecord } from '@/lib/csv-tracker';

const CSV_DIR = join(process.cwd(), 'data');
const CSV_FILE = join(CSV_DIR, 'token-analytics.csv');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(CSV_DIR)) {
    await mkdir(CSV_DIR, { recursive: true });
  }
}

// Initialize CSV file with headers if it doesn't exist
async function ensureCSVFile() {
  await ensureDataDir();
  
  if (!existsSync(CSV_FILE)) {
    const header = 'Timestamp,Name,Ticker,Contract Address,Initial Buy In (SOL),Initial Buy In (USD),Initial Market Cap (SOL),Initial Market Cap (USD),Metadata URI,Creator Wallet\n';
    await writeFile(CSV_FILE, header, 'utf-8');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const record: TokenRecord = req.body;

    // Validate required fields
    if (!record.name || !record.ticker || !record.contractAddress) {
      return res.status(400).json({ error: 'Missing required fields: name, ticker, contractAddress' });
    }

    // Ensure CSV file exists
    await ensureCSVFile();

    // Read existing CSV content
    const existingContent = await readFile(CSV_FILE, 'utf-8');

    // Append new row
    const newRow = tokenRecordToCSVRow(record);
    const updatedContent = existingContent + newRow;

    // Write back to file
    await writeFile(CSV_FILE, updatedContent, 'utf-8');

    return res.status(200).json({ 
      success: true, 
      message: 'Token record saved to CSV',
      file: 'data/token-analytics.csv'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving token to CSV:', error);
    }
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to save token record' 
    });
  }
}

