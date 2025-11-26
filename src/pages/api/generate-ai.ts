import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, prompt, quality = 'standard', size = '512x512' } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: type and prompt' });
    }

    let result;

    switch (type) {
      case 'title':
        result = await generateTitle(prompt);
        break;
      case 'description':
        result = await generateDescription(prompt);
        break;
      case 'image':
        result = await generateImage(prompt, quality, size);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Must be title, description, or image' });
    }

    return res.status(200).json({
      success: true,
      type,
      result,
    });
  } catch (error) {
    console.error('AI Generation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate content'
    });
  }
}

async function generateTitle(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a creative copywriter specializing in compelling titles. Create engaging, memorable titles that capture attention and spark curiosity.'
      },
      {
        role: 'user',
        content: `Create a compelling, catchy title for this concept: ${prompt}. Make it engaging and memorable. Keep it under 10 words.`
      }
    ],
    max_tokens: 50,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Creative Title';
}

async function generateDescription(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a skilled content writer who creates engaging, detailed descriptions that inform and persuade readers.'
      },
      {
        role: 'user',
        content: `Write a compelling description (2-3 paragraphs) for this concept: ${prompt}. Make it informative, engaging, and persuasive. Focus on benefits and unique value.`
      }
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Engaging description of the concept.';
}

async function generateImage(prompt: string, quality: string, size: string): Promise<string> {
  const response = await openai.images.generate({
    model: quality === 'hd' ? 'dall-e-3' : 'dall-e-2',
    prompt: `Create a high-quality, visually stunning image for: ${prompt}. Make it professional, modern, and engaging.`,
    size: size as any,
    quality: quality === 'hd' ? 'hd' : 'standard',
    n: 1,
  });

  return response.data[0]?.url || '';
}
