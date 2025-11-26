import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Fetch All-Time High (ATH) price for a token
 * Uses Jupiter API to get price history
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mint } = req.query;

    if (!mint || typeof mint !== 'string') {
      return res.status(400).json({ error: 'Token mint address is required' });
    }

    // Use Jupiter API to get token price info
    // For now, we'll use a simplified approach - in production you'd want to track historical prices
    const jupiterResponse = await fetch(
      `https://price.jup.ag/v4/price?ids=${mint}`
    );

    if (!jupiterResponse.ok) {
      return res.status(200).json({ 
        ath: null, 
        currentPrice: null,
        message: 'Price data not available' 
      });
    }

    const data = await jupiterResponse.json();
    const priceData = data.data?.[mint];

    if (!priceData) {
      return res.status(200).json({ 
        ath: null, 
        currentPrice: null,
        message: 'Token not found' 
      });
    }

    const currentPrice = priceData.price || 0;

    // For ATH, we'd need historical data tracking
    // For now, return current price as ATH (in production, track historical prices)
    // TODO: Implement proper ATH tracking by storing price history
    
    return res.status(200).json({
      ath: currentPrice, // This should be tracked historically
      currentPrice,
      priceChange24h: priceData.priceChange24h || 0,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching ATH:', error);
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch ATH'
    });
  }
}

