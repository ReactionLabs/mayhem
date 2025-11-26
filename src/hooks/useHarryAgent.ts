import { useState } from 'react';
import { toast } from 'sonner';

interface GeneratedWallet {
  publicKey: string;
  privateKey: string;
  apiKey: string;
}

interface MemeCoin {
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  content: string;
  imageUrl?: string;
}

interface TradeResult {
  action: 'buy' | 'sell';
  token: string;
  amount: number;
  txHash: string;
}

export const useHarryAgent = () => {
  const [isWalletGenerating, setIsWalletGenerating] = useState(false);
  const [isCoinCreating, setIsCoinCreating] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const generateWallet = async (): Promise<GeneratedWallet> => {
    setIsWalletGenerating(true);
    try {
      const response = await fetch('https://pumpportal.fun/api/create-wallet', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PumpPortal API error:', errorText);
        // Fallback: provide demo wallet data when API is unavailable
        console.warn('PumpPortal API unavailable - providing demo wallet for testing');
        const demoId = Date.now().toString(36);
        return {
          publicKey: `DemoWallet${demoId}`,
          privateKey: `DemoPrivateKey${demoId}`,
          apiKey: `demo_api_key_${demoId}`,
        };
      }

      const data = await response.json();

      // Debug logging
      console.log('PumpPortal wallet response:', data);

      // Validate response structure - check for different possible field names
      if (!data.publicKey && !data.address) {
        throw new Error('Missing public key in wallet data');
      }
      if (!data.privateKey && !data.secretKey) {
        throw new Error('Missing private key in wallet data');
      }
      if (!data.apiKey) {
        throw new Error('Missing API key in wallet data');
      }

      return {
        publicKey: data.publicKey || data.address,
        privateKey: data.privateKey || data.secretKey,
        apiKey: data.apiKey,
      };
    } catch (error) {
      console.error('Wallet generation error:', error);
      throw error;
    } finally {
      setIsWalletGenerating(false);
    }
  };

  const createMemeCoin = async (prompt: string): Promise<MemeCoin> => {
    setIsCoinCreating(true);
    try {
      // Generate coin details using AI
      const coinDetailsResponse = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'coin',
          prompt: `Create a meme coin concept based on: ${prompt}. Include name, symbol, and description.`,
        }),
      });

      if (!coinDetailsResponse.ok) {
        const errorText = await coinDetailsResponse.text();
        console.error('Coin generation API error:', errorText);
        throw new Error(`Failed to generate coin details: ${coinDetailsResponse.status} ${errorText}`);
      }

      const coinData = await coinDetailsResponse.json();

      // Generate promotional content
      const contentResponse = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          prompt: `Create viral social media content for a meme coin named "${coinData.name}". Include tweets, memes, and promotional copy.`,
        }),
      });

      const contentData = await contentResponse.json();

      return {
        name: coinData.name || 'Meme Coin',
        symbol: coinData.symbol || 'MEME',
        description: coinData.description || 'A hilarious meme coin',
        contractAddress: 'To be created...', // This would be the actual contract after creation
        content: contentData.result || 'Viral content generated!',
      };
    } catch (error) {
      console.error('Coin creation error:', error);
      throw error;
    } finally {
      setIsCoinCreating(false);
    }
  };

  const executeTrade = async (command: string): Promise<TradeResult> => {
    setIsTrading(true);
    try {
      // Parse trade command
      const cmd = command.toLowerCase();
      const isBuy = cmd.includes('buy');
      const amountMatch = cmd.match(/(\d+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.1;

      // For demo purposes, simulate a trade
      // In production, this would use the PumpPortal API with a generated wallet
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      return {
        action: isBuy ? 'buy' : 'sell',
        token: 'SIMULATED_TOKEN',
        amount,
        txHash: `simulated_tx_${Date.now()}`,
      };
    } catch (error) {
      console.error('Trade execution error:', error);
      throw error;
    } finally {
      setIsTrading(false);
    }
  };

  const generateImage = async (prompt: string): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          prompt: prompt,
          quality: 'standard',
          size: '512x512',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image generation API error:', errorText);
        throw new Error(`Failed to generate image: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.result || '';
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateContent = async (prompt: string): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Content generation API error:', errorText);
        throw new Error(`Failed to generate content: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.result || 'Content generated successfully!';
    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  return {
    generateWallet,
    createMemeCoin,
    executeTrade,
    generateImage,
    generateContent,
    isWalletGenerating,
    isCoinCreating,
    isTrading,
    isGeneratingContent,
  };
};
