/**
 * Shared OpenAI Client Utility
 * Centralized OpenAI client initialization to reduce code duplication
 */

import OpenAI from 'openai';
import { env } from '@/config/env';

let openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
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
        console.log('[OpenAI] Using Vercel AI Gateway');
      } else if (env.openaiApiKey) {
        console.log('[OpenAI] Using direct OpenAI API');
      }
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
      ...(baseURL && { baseURL: baseURL }),
    });
  }
  return openai;
}

export function hasOpenAIConfig(): boolean {
  return !!(env.openaiApiKey || env.aiGatewayApiKey);
}

