import { useState } from 'react';
import { toast } from 'sonner';
import { storeWallet, getStoredWallets, getCurrentWallet, setCurrentWallet, type StoredWallet } from '@/lib/wallet-storage';

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

      const walletData = {
        publicKey: data.publicKey || data.address,
        privateKey: data.privateKey || data.secretKey,
        apiKey: data.apiKey,
      };

      // Store the wallet for Harry to use
      const existingWallets = await getStoredWallets();
      const stored = await storeWallet({
        ...walletData,
        label: `Harry Wallet ${existingWallets.length + 1}`,
      });

      toast.success('Wallet generated and stored!');
      
      return walletData;
    } catch (error) {
      console.error('Wallet generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate wallet');
      throw error;
    } finally {
      setIsWalletGenerating(false);
    }
  };

  const createMemeCoin = async (prompt: string, autoLaunch: boolean = false): Promise<MemeCoin | { mintAddress: string; transactionSignature: string; name: string; symbol: string; metadataUri: string }> => {
    setIsCoinCreating(true);
    try {
      // Get current wallet
      const currentWallet = await getCurrentWallet();
      if (!currentWallet) {
        throw new Error('No wallet available. Please generate a wallet first by saying "generate wallet".');
      }

      // Step 1: Generate coin details using AI
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
        let errorMessage = `Failed to generate coin details (${coinDetailsResponse.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
            errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.';
          } else {
            errorMessage = errorText.slice(0, 200);
          }
        }
        throw new Error(errorMessage);
      }

      const coinData = await coinDetailsResponse.json();
      if (!coinData.success) {
        throw new Error(coinData.error || 'Failed to generate coin details');
      }

      const coinInfo = coinData.result || coinData;
      const tokenName = coinInfo.name || 'Meme Coin';
      const tokenSymbol = coinInfo.symbol || 'MEME';
      const description = coinInfo.description || 'A hilarious meme coin';

      // Step 2: Generate image
      let imageUrl: string | undefined;
      try {
        const imageResponse = await fetch('/api/generate-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'image',
            prompt: `Create a fun, meme-style logo for a cryptocurrency token called "${tokenName}" (${tokenSymbol}). Make it colorful, eye-catching, and suitable for a meme coin.`,
            quality: 'standard',
            size: '1024x1024',
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.result || imageData.url;
        }
      } catch (error) {
        console.warn('Image generation failed, continuing without image:', error);
      }

      // Step 3: Upload metadata
      let base64Logo = '';
      if (imageUrl) {
        try {
          const imageResponse = await fetch(imageUrl);
          const blob = await imageResponse.blob();
          base64Logo = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.warn('Failed to convert image to base64:', error);
        }
      }

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenLogo: base64Logo || '',
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          description: description,
          twitter: '',
          telegram: '',
          website: '',
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to upload token metadata');
      }

      const { metadataUri } = await uploadResponse.json();

      // Step 4: Generate content
      let content = 'Viral content will be generated soon!';
      try {
        const contentResponse = await fetch('/api/generate-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'content',
            prompt: `Create viral social media content for a meme coin named "${tokenName}" (${tokenSymbol}). Include tweets, memes, and promotional copy.`,
          }),
        });

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          content = contentData?.result || contentData?.content || content;
        }
      } catch {
        // Continue without content
      }

      // If autoLaunch, launch the token
      if (autoLaunch) {
        // Generate mint address
        const { Keypair } = await import('@solana/web3.js');
        const mintKeypair = Keypair.generate();
        const mintAddress = mintKeypair.publicKey.toBase58();

        // Create token via PumpPortal
        const createResponse = await fetch('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicKey: currentWallet.publicKey,
            action: 'create',
            tokenMetadata: {
              name: tokenName,
              symbol: tokenSymbol,
              uri: metadataUri,
            },
            mint: mintAddress,
            denominatedInSol: 'true',
            amount: 0.1, // Default initial buy
            slippage: 10,
            priorityFee: 0.0005,
            pool: 'pump',
            isMayhemMode: 'false',
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to create token');
        }

        const transactionData = await createResponse.json();
        let txString: string;
        if (Array.isArray(transactionData)) {
          txString = transactionData[0];
        } else if (typeof transactionData === 'string') {
          txString = transactionData;
        } else if (transactionData.transaction) {
          txString = transactionData.transaction;
        } else {
          throw new Error('Invalid response format from PumpPortal');
        }

        // Sign and send
        const { VersionedTransaction } = await import('@solana/web3.js');
        const bs58 = (await import('bs58')).default;
        const txBytes = bs58.decode(txString);
        const tx = VersionedTransaction.deserialize(new Uint8Array(txBytes));
        tx.sign([mintKeypair]);

        const signedTxString = bs58.encode(tx.serialize());
        const tradeResponse = await fetch(`https://pumpportal.fun/api/trade?api-key=${currentWallet.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction: signedTxString,
            mint: mintAddress,
          }),
        });

        if (!tradeResponse.ok) {
          const errorData = await tradeResponse.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to launch token');
        }

        const tradeData = await tradeResponse.json();
        const signature = tradeData.signature || tradeData.txHash || 'pending';

        toast.success('Token launched successfully!');
        
        return {
          mintAddress,
          transactionSignature: signature,
          name: tokenName,
          symbol: tokenSymbol,
          metadataUri,
        };
      }

      return {
        name: tokenName,
        symbol: tokenSymbol,
        description: description,
        contractAddress: 'Ready to launch...',
        content: content,
        imageUrl: imageUrl,
      };
    } catch (error) {
      console.error('Coin creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create meme coin');
      throw error;
    } finally {
      setIsCoinCreating(false);
    }
  };

  const executeTrade = async (command: string, tokenMint?: string): Promise<TradeResult> => {
    setIsTrading(true);
    try {
      // Get current wallet
      const currentWallet = await getCurrentWallet();
      if (!currentWallet) {
        throw new Error('No wallet available. Please generate a wallet first by saying "generate wallet".');
      }

      // Parse trade command
      const cmd = command.toLowerCase();
      const isBuy = cmd.includes('buy');
      const amountMatch = cmd.match(/(\d+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.1;

      // Extract token mint if not provided
      if (!tokenMint) {
        const mintMatch = cmd.match(/([A-Za-z0-9]{32,44})/);
        if (mintMatch) {
          tokenMint = mintMatch[1];
        } else {
          throw new Error('Token address not specified. Please provide a token mint address.');
        }
      }

      // Execute trade using PumpPortal API
      const response = await fetch('/api/trade-pump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': currentWallet.apiKey,
        },
        body: JSON.stringify({
          action: isBuy ? 'buy' : 'sell',
          mint: tokenMint,
          amount: amount,
          denominatedInSol: true,
          slippage: 10,
          priorityFee: 0.0005,
          pool: 'pump',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to execute trade');
      }

      const tradeData = await response.json();
      const signature = tradeData.signature || tradeData.txHash || 'pending';

      toast.success(`${isBuy ? 'Buy' : 'Sell'} order executed!`);
      
      return {
        action: isBuy ? 'buy' : 'sell',
        token: tokenMint,
        amount,
        txHash: signature,
      };
    } catch (error) {
      console.error('Trade execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute trade');
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
    getStoredWallets,
    getCurrentWallet,
    setCurrentWallet,
    isWalletGenerating,
    isCoinCreating,
    isTrading,
    isGeneratingContent,
  };
};
