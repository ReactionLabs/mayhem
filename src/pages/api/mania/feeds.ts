import { NextApiRequest, NextApiResponse } from 'next';
import { FeedItem } from '@/types/mania';

// Mock API endpoint for Mania feeds
// In production, this would connect to real social media APIs
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data - replace with real API integrations
    const mockFeeds: FeedItem[] = [
      {
        id: '1',
        platform: 'twitter',
        author: 'pumpdotfun',
        content: '🚀 Massive token launch incoming! Early access available for premium members. #crypto #solana',
        timestamp: new Date(Date.now() - 300000),
        engagement: { likes: 1250, retweets: 340, replies: 89, views: 15000 },
        filterType: 'ct',
        source: 'pumpdotfun',
        sentiment: 'positive',
        relatedTokens: ['ABC123']
      },
      {
        id: '2',
        platform: 'telegram',
        author: 'shockedjstrading',
        content: 'BREAKING: DEX volume spike detected. Multiple large trades just executed. Something big is happening.',
        timestamp: new Date(Date.now() - 600000),
        engagement: { likes: 890, views: 5200 },
        filterType: 'tg',
        source: 'shockedjstrading',
        sentiment: 'neutral'
      },
      {
        id: '3',
        platform: 'news',
        author: 'Cointelegraph',
        content: 'Solana ecosystem shows explosive growth with $3.2B TVL. New DeFi protocols driving adoption.',
        timestamp: new Date(Date.now() - 1800000),
        engagement: { likes: 2100, views: 25000 },
        filterType: 'news',
        source: 'Cointelegraph',
        sentiment: 'positive'
      },
      {
        id: '4',
        platform: 'twitter',
        author: 'VitalikButerin',
        content: 'Excited about the developments in Layer 2 scaling solutions. The future looks bright for Ethereum.',
        timestamp: new Date(Date.now() - 3600000),
        engagement: { likes: 15400, retweets: 3200, replies: 1200, views: 89000 },
        filterType: 'ct',
        source: 'vitalikbuterin',
        sentiment: 'positive',
        relatedTokens: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']
      },
      {
        id: '5',
        platform: 'instagram',
        author: 'solana',
        content: '🌟 Join the revolution! Building the fastest blockchain for the future. #Solana #Web3 #DeFi',
        timestamp: new Date(Date.now() - 7200000),
        engagement: { likes: 45000, views: 125000 },
        filterType: 'instagram',
        source: 'solana',
        sentiment: 'positive'
      },
      {
        id: '6',
        platform: 'twitter',
        author: 'cz_binance',
        content: 'Market analysis: BTC showing strong support at current levels. Institutional adoption continues to grow.',
        timestamp: new Date(Date.now() - 10800000),
        engagement: { likes: 8900, retweets: 2100, replies: 450, views: 67000 },
        filterType: 'ct',
        source: 'cz_binance',
        sentiment: 'positive',
        relatedTokens: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']
      }
    ];

    // Apply basic filtering based on query params
    const { platform, sentiment, limit = '50' } = req.query;

    let filteredFeeds = mockFeeds;

    if (platform && typeof platform === 'string') {
      filteredFeeds = filteredFeeds.filter(feed => feed.platform === platform);
    }

    if (sentiment && typeof sentiment === 'string') {
      filteredFeeds = filteredFeeds.filter(feed => feed.sentiment === sentiment);
    }

    // Limit results
    const limitNum = parseInt(limit as string, 10);
    filteredFeeds = filteredFeeds.slice(0, limitNum);

    // Sort by timestamp (newest first)
    filteredFeeds.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.status(200).json({
      success: true,
      feeds: filteredFeeds,
      total: filteredFeeds.length
    });

  } catch (error) {
    console.error('Error fetching Mania feeds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feeds'
    });
  }
}
