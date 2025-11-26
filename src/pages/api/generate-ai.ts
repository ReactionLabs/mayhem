import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
    });
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
      case 'coin':
        result = await generateCoin(prompt);
        break;
      case 'content':
        result = await generateSocialContent(prompt);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Must be title, description, image, coin, or content' });
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

async function generateCoin(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a creative meme coin generator. Create unique, funny, and engaging meme coin concepts with clever names, symbols, and descriptions.'
      },
      {
        role: 'user',
        content: `Create a meme coin concept based on this idea: ${prompt}. Return a JSON object with 'name', 'symbol', and 'description' fields. Make the name catchy, symbol 2-5 characters, and description hilarious and engaging.`
      }
    ],
    max_tokens: 200,
    temperature: 0.9,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    return { name: 'MemeCoin', symbol: 'MEME', description: 'A hilarious meme coin!' };
  }

  try {
    return JSON.parse(content);
  } catch {
    // Fallback if JSON parsing fails
    return { name: 'MemeCoin', symbol: 'MEME', description: content };
  }
}

async function generateSocialContent(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a social media marketing expert specializing in crypto and meme coins. Create engaging, viral content that drives attention and community growth.'
      },
      {
        role: 'user',
        content: `Create viral social media content for: ${prompt}. Include multiple tweet ideas, meme concepts, and promotional copy. Make it engaging and shareable.`
      }
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content?.trim() || 'Viral content generated!';
}
