import { useState } from 'react';
import { toast } from 'sonner';
import { storeWallet, getStoredWallets, getCurrentWallet, setCurrentWallet, type StoredWallet } from '@/lib/wallet-storage';
import type { WalletContextState, ConnectionContextState } from '@jup-ag/wallet-adapter';

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

export const useHarryAgent = (
  wallet?: Pick<WalletContextState, 'publicKey' | 'signTransaction'>,
  connectionContext?: { connection?: ConnectionContextState['connection'] }
) => {
  const connection = connectionContext?.connection;
  const [isWalletGenerating, setIsWalletGenerating] = useState(false);
  const [isCoinCreating, setIsCoinCreating] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const generateWallet = async (): Promise<GeneratedWallet> => {
    setIsWalletGenerating(true);
    try {
      // Use GET method like the Clerk webhook (which works reliably)
      const response = await fetch('https://pumpportal.fun/api/create-wallet', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PumpPortal API error:', response.status, errorText);
        throw new Error(`Failed to create wallet: ${response.status} ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();

      // Debug logging
      console.log('PumpPortal wallet response:', data);

      // PumpPortal API returns: { walletPublicKey, privateKey, apiKey } (note: walletPublicKey, not publicKey)
      // Handle both field name variations
      const publicKey = data.publicKey || data.walletPublicKey || data.address;
      const privateKey = data.privateKey || data.secretKey;
      const apiKey = data.apiKey || data.apiKey;

      if (!publicKey || !privateKey || !apiKey) {
        console.error('Invalid wallet response structure:', data);
        throw new Error(`Invalid wallet data received from PumpPortal. Expected publicKey/walletPublicKey, privateKey, and apiKey. Got: ${JSON.stringify(Object.keys(data))}`);
      }

      const walletData = {
        publicKey,
        privateKey,
        apiKey,
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
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate wallet. Please try again.';
      toast.error(errorMessage);
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
        let setupRequired = false;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
          setupRequired = errorJson.setupRequired || false;
        } catch {
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
            errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY or AIGATEWAYAPI to your .env file. Get your API key from: https://platform.openai.com/api-keys';
            setupRequired = true;
          } else {
            errorMessage = errorText.slice(0, 200);
          }
        }
        
        // If setup is required, provide helpful error message
        if (setupRequired) {
          throw new Error(
            `OpenAI API key not configured.\n\n` +
            `**Setup Required:**\n` +
            `To use AI-powered coin generation, add one of these to your .env file:\n` +
            `- \`OPENAI_API_KEY\` (direct OpenAI API)\n` +
            `- \`AIGATEWAYAPI\` (Vercel AI Gateway)\n\n` +
            `Get your API key: https://platform.openai.com/api-keys\n\n` +
            `💡 You can also create tokens manually without AI generation.`
          );
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

        // Check if user has connected wallet (required for signing and paying fees)
        if (!wallet?.publicKey || !wallet?.signTransaction || !connection) {
          throw new Error('Please connect your wallet (Phantom) to sign the transaction and pay fees. The wallet is required to sign the creation transaction and make the initial purchase.');
        }

        // Create token via PumpPortal - use connected wallet's public key
        const createResponse = await fetch('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicKey: wallet.publicKey.toBase58(), // Use connected wallet, not stored wallet
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

        // Get transaction from PumpPortal (returns ArrayBuffer)
        const txData = await createResponse.arrayBuffer();
        const { VersionedTransaction } = await import('@solana/web3.js');
        const tx = VersionedTransaction.deserialize(new Uint8Array(txData));

        // Sign with mint keypair first
        tx.sign([mintKeypair]);

        // Prompt user to sign with their connected wallet
        toast.dismiss();
        toast.loading('Please sign the transaction in your wallet...');

        let signedTx: VersionedTransaction;
        try {
          signedTx = await wallet.signTransaction(tx);
        } catch (error) {
          if (error instanceof Error && (error.message.includes('User rejected') || error.message.includes('cancelled'))) {
            throw new Error('Transaction signature was cancelled. Please try again.');
          }
          throw error;
        }

        // Send the fully signed transaction to RPC
        toast.dismiss();
        toast.loading('Sending transaction to network...');

        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');

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
