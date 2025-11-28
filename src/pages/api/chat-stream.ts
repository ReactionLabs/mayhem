import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { env } from '@/config/env';

// Initialize OpenAI client lazily
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
        console.log('[Chat Stream] Using Vercel AI Gateway');
      } else if (env.openaiApiKey) {
        console.log('[Chat Stream] Using direct OpenAI API');
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
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  try {
    // Check if OpenAI API key is available
    if (!env.openaiApiKey && !env.aiGatewayApiKey) {
      res.write(`data: ${JSON.stringify({ error: 'OpenAI API key not configured', done: true })}\n\n`);
      res.end();
      return;
    }

    const { messages, model = 'gpt-4', temperature = 0.7, max_tokens = 1000 } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Messages array is required', done: true })}\n\n`);
      res.end();
      return;
    }

    const client = getOpenAIClient();

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

