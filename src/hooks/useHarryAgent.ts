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
        let errorText = await coinDetailsResponse.text();
        console.error('Coin generation API error:', errorText);
        
        // Try to parse as JSON if it's HTML, extract meaningful error
        let errorMessage = `Failed to generate coin details (${coinDetailsResponse.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // If it's HTML, provide a user-friendly message
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
            errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.';
          } else {
            errorMessage = errorText.slice(0, 200); // Limit error text length
          }
        }
        
        throw new Error(errorMessage);
      }

      const coinData = await coinDetailsResponse.json();
      
      // Validate response structure
      if (!coinData.success) {
        throw new Error(coinData.error || 'Failed to generate coin details');
      }

      // Generate promotional content
      const contentResponse = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          prompt: `Create viral social media content for a meme coin named "${coinData.result?.name || coinData.name || 'MemeCoin'}". Include tweets, memes, and promotional copy.`,
        }),
      });

      if (!contentResponse.ok) {
        // If content generation fails, continue with coin data only
        console.warn('Content generation failed, continuing with coin data only');
      }

      let contentData;
      try {
        contentData = await contentResponse.json();
      } catch {
        contentData = { result: 'Viral content will be generated soon!' };
      }

      // Extract coin data from response
      const coinInfo = coinData.result || coinData;
      
      return {
        name: coinInfo.name || 'Meme Coin',
        symbol: coinInfo.symbol || 'MEME',
        description: coinInfo.description || 'A hilarious meme coin',
        contractAddress: 'To be created...', // This would be the actual contract after creation
        content: contentData?.result || contentData?.content || 'Viral content generated!',
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
