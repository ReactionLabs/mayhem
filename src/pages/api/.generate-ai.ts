import { NextApiRequest, NextApiResponse } from 'next';
import OPENAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in environment variables' });
  }

  // Initialize OpenAI client with Google's endpoint for Gemini
  const openai = new OPENAI.OpenAI({
    apiKey: apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  try {
    const { prompt, type } = req.body;

    if (!prompt) {  
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (type === 'image') {
      // Generate an SVG logo
      const svgPrompt = `Generate a clean, modern, and creative SVG code for a cryptocurrency token logo based on this concept: "${prompt}". 
      Output ONLY the raw SVG code, starting with <svg and ending with </svg>. Do not include markdown backticks or explanations. 
      Ensure the SVG is scalable, uses vibrant colors suitable for a meme coin or tech project, and is roughly square aspect ratio (viewBox="0 0 512 512").`;

      const completion = await openai.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: [
          { role: "system", content: "You are a professional graphic designer specializing in SVG logos." },
          { role: "user", content: svgPrompt },
        ],
      });

      let text = completion.choices[0].message.content || '';
      
      // Cleanup if model includes backticks
      text = text.replace(/```svg/g, '').replace(/```/g, '').trim();
      
      return res.status(200).json({ result: text, type: 'svg' });
    } else {
      // Generate Text (Description/Marketing)
      const textPrompt = `You are a creative crypto marketing expert. Write a catchy, exciting, and professional description for a new token project based on this concept: "${prompt}". 
      Keep it under 280 characters (Twitter style) but punchy. Also suggest a ticker symbol if one fits.`;

      const completion = await openai.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: [
          { role: "system", content: "You are a creative marketing expert." },
          { role: "user", content: textPrompt },
        ],
      });

      const text = completion.choices[0].message.content || '';

      return res.status(200).json({ result: text, type: 'text' });
    }

  } catch (error) {
    console.error('AI Generation Error:', error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
}
