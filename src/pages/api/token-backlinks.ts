import { NextApiRequest, NextApiResponse } from 'next';

// In production, this would fetch from a database
// For now, return empty array or mock data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ca } = req.query;

  if (!ca || typeof ca !== 'string') {
    return res.status(400).json({ error: 'Contract address (ca) is required' });
  }

  try {
    // TODO: Fetch from database in production
    // For now, return empty array
    // In production, you'd query a database for backlinks:
    // const backlinks = await db.backlinks.findMany({ where: { tokenCA: ca } });
    
    const backlinks: Array<{
      url: string;
      title: string;
      domain: string;
      timestamp: number;
    }> = [];

    return res.status(200).json({ backlinks });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching backlinks:', error);
    }
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch backlinks' 
    });
  }
}

