import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// Make database optional - don't crash if not configured
let db: Pool | null = null;

if (connectionString) {
  try {
    db = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: true,
      },
      // Serverless-friendly configuration
      max: 1, // Limit connections for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    db.on('error', (err) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database connection error:', err);
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to initialize database connection:', error);
    }
    db = null;
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    console.warn('DATABASE_URL not set. Database features will be disabled.');
  }
}

export { db };

/**
 * Run a database query
 * Returns empty array if database is not configured
 */
export async function runQuery<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database not configured. Query skipped:', text);
    }
    return [];
  }

  const client = await db.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database query error:', error);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return db !== null;
}

