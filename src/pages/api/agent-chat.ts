import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/api/rate-limit';
import { safeLogError } from '@/lib/log-sanitizer';
import { getOpenAIClient, hasOpenAIConfig } from '@/lib/api/openai-client';
import { z } from 'zod';

// Validation schema
const agentChatSchema = z.object({
  message: z.string().min(1).max(5000, { message: 'Message must be between 1 and 5000 characters' }),
  agentType: z.enum(['harry', 'trading', 'vision']).optional().default('harry'),
  context: z.record(z.unknown()).optional().default({}),
  model: z.string().optional().default('gpt-4'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().min(1).max(4000).optional().default(1000),
});

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
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.aiGeneration);
    
    if (!rateLimitResult.success) {
      res.write(`data: ${JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.', 
        done: true,
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      })}\n\n`);
      res.end();
      return;
    }

    // Check API key configuration
    if (!hasOpenAIConfig()) {
      res.write(`data: ${JSON.stringify({ error: 'OpenAI API key not configured', done: true })}\n\n`);
      res.end();
      return;
    }

    // Validate input
    const validation = agentChatSchema.safeParse(req.body);
    if (!validation.success) {
      res.write(`data: ${JSON.stringify({ 
        error: 'Invalid request data',
        details: validation.error.errors,
        done: true 
      })}\n\n`);
      res.end();
      return;
    }

    const { message, agentType, context, model, temperature, max_tokens } = validation.data;

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
    safeLogError('Agent chat error', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
    res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
    res.end();
  }
}

