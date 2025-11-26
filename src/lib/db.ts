import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Please configure your Neon connection string.');
}

export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
  },
});

export async function runQuery<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await db.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

