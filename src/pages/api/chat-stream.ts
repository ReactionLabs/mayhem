import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/api/rate-limit';
import { safeLogError } from '@/lib/log-sanitizer';
import { getOpenAIClient, hasOpenAIConfig } from '@/lib/api/openai-client';
import { z } from 'zod';

// Validation schema
const chatStreamSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1),
  })).min(1).max(50, { message: 'Maximum 50 messages allowed' }),
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
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

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

    // Check if OpenAI API key is available
    if (!hasOpenAIConfig()) {
      res.write(`data: ${JSON.stringify({ error: 'OpenAI API key not configured', done: true })}\n\n`);
      res.end();
      return;
    }

    // Validate input
    const validation = chatStreamSchema.safeParse(req.body);
    if (!validation.success) {
      res.write(`data: ${JSON.stringify({ 
        error: 'Invalid request data',
        details: validation.error.errors,
        done: true 
      })}\n\n`);
      res.end();
      return;
    }

    const { messages, model, temperature, max_tokens } = validation.data;

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
    safeLogError('Chat stream error', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
    res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
    res.end();
  }
}

