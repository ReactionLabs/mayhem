import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { env } from '@/config/env';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = env.aiGatewayApiKey || env.openaiApiKey;
    const baseURL = env.aiGatewayUrl;
    
    if (!apiKey) {
      const possibleKeys = [
        'VERCEL_AI_GATEWAY_API_KEY',
        'AI_GATEWAY_API_KEY',
        'AIGATEWAYAPI',
        'OPENAI_API_KEY'
      ].join(', ');
      throw new Error(`OpenAI API key not configured. Please set one of: ${possibleKeys}`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      if (env.aiGatewayApiKey && env.aiGatewayUrl) {
        console.log('[Agent Chat] Using Vercel AI Gateway');
      } else if (env.openaiApiKey) {
        console.log('[Agent Chat] Using direct OpenAI API');
      }
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
      ...(baseURL && { baseURL: baseURL }),
    });
  }
  return openai;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set up SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    if (!env.openaiApiKey && !env.aiGatewayApiKey) {
      res.write(`data: ${JSON.stringify({ error: 'OpenAI API key not configured', done: true })}\n\n`);
      res.end();
      return;
    }

    const { 
      message, 
      agentType = 'harry', // 'harry', 'trading', 'vision'
      context = {},
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 1000 
    } = req.body;

    if (!message) {
      res.write(`data: ${JSON.stringify({ error: 'Message is required', done: true })}\n\n`);
      res.end();
      return;
    }

    const client = getOpenAIClient();

    // Build system prompt based on agent type
    let systemPrompt = '';
    switch (agentType) {
      case 'harry':
        systemPrompt = `You are Harry, an AI trading agent on Mayhem. You help users with:
- Creating wallets and managing trading accounts
- Generating meme coins and token concepts
- Executing trades and managing positions
- Creating images and social media content
- Providing trading analysis and insights

Be helpful, concise, and action-oriented. Use markdown formatting for responses.`;
        break;
      case 'trading':
        systemPrompt = `You are a professional trading assistant. You help with:
- Chart analysis and trend identification
- Entry/exit point recommendations
- Risk management and position sizing
- Pattern recognition
- Market sentiment analysis

Current context: ${JSON.stringify(context)}
Be analytical and data-driven. Use markdown formatting.`;
        break;
      case 'vision':
        systemPrompt = `You are an AI Vision Assistant. You help users:
- Generate creative titles and descriptions
- Create visual concepts and ideas
- Develop marketing content
- Brainstorm token concepts

Be creative, engaging, and inspiring. Use markdown formatting.`;
        break;
      default:
        systemPrompt = 'You are a helpful AI assistant. Use markdown formatting.';
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message },
    ];

    // Create streaming completion
    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
    res.end();
  }
}

