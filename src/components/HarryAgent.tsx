import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@jup-ag/wallet-adapter';
import {
  Bot,
  Send,
  Wallet,
  TrendingUp,
  Coins,
  Image,
  MessageSquare,
  Zap,
  RefreshCw,
  Copy,
  Check,
  X,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react';
import { useHarryAgent } from '@/hooks/useHarryAgent';
import { MessageRenderer } from './HarryAgent/MessageRenderer';
import { cn } from '@/lib/utils';

interface HarryMessage {
  id: string;
  role: 'user' | 'harry';
  content: string;
  timestamp: Date;
  type?: 'text' | 'action' | 'result';
  actionData?: any;
}

export const HarryAgent: React.FC = () => {
  const [messages, setMessages] = useState<HarryMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const {
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
    isGeneratingContent
  } = useHarryAgent({ publicKey, signTransaction }, { connection });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsHydrated(true);
    const loadInitialMessage = async () => {
      const currentWallet = await getCurrentWallet();
      const walletInfo = currentWallet ? `\`${currentWallet.publicKey.slice(0, 8)}...\`` : 'None - say "generate wallet" to create one';
      
      setMessages([
        {
          id: '1',
          role: 'harry',
          content: "Hello! I'm Harry, your AI trading agent. 👋\n\nI can help you with:\n\n🎯 **Generate wallets** - Create secure PumpPortal wallets\n🚀 **Create meme coins** - AI-powered token creation\n📈 **Execute trades** - Automated trading with stored wallets\n🎨 **Generate images** - Create memes and logos\n💬 **Create content** - Viral social media posts\n\n**Current Wallet:** " + walletInfo + "\n\nWhat would you like to do today?",
          timestamp: new Date(),
          type: 'text'
        }
      ]);
    };
    loadInitialMessage();
  }, []);

  useEffect(() => {
    if (isHydrated) {
      scrollToBottom();
    }
  }, [messages, isHydrated]);

  const addMessage = (message: Omit<HarryMessage, 'id' | 'timestamp'>) => {
    const newMessage: HarryMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage = currentInput.trim();
    addMessage({ role: 'user', content: userMessage, type: 'text' });
    setCurrentInput('');
    setIsLoading(true);

    // Check if this is a command that needs special handling
    const cmd = userMessage.toLowerCase();
    const isCommand = 
      cmd.includes('wallet') || 
      cmd.includes('create') || 
      cmd.includes('trade') || 
      cmd.includes('buy') || 
      cmd.includes('sell') ||
      cmd.includes('image') ||
      cmd.includes('generate');

    if (isCommand) {
      // Use command processing for specific actions
      try {
        const response = await processHarryCommand(userMessage);
        addMessage({
          role: 'harry',
          content: response.message,
          type: response.type || 'text',
          actionData: response.data
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addMessage({
          role: 'harry',
          content: `Sorry, I encountered an error: ${errorMessage}`,
          type: 'text'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use streaming for general chat
      try {
        // Create assistant message placeholder
        const assistantMessageId = Date.now().toString();
        let assistantContent = '';
        
        addMessage({
          id: assistantMessageId,
          role: 'harry',
          content: '',
          type: 'text',
          timestamp: new Date()
        });

        // Stream the response
        const response = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            agentType: 'harry',
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.content) {
                  assistantContent += data.content;
                  // Update the message in real-time
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                }

                if (data.done) break;
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('OpenAI API key not configured')) {
          addMessage({
            role: 'harry',
            content: `🤖 **AI Features Not Configured**\n\nTo use AI-powered coin generation, you need to set up an OpenAI API key:\n\n**Setup Steps:**\n1. Visit https://platform.openai.com/api-keys\n2. Create a new API key\n3. Add to your \`.env.local\` file:\n\n\`OPENAI_API_KEY=your_api_key_here\`\n\nOnce configured, I'll be able to generate coins, images, and content! 🚀`,
            type: 'text'
          });
        } else {
          addMessage({
            role: 'harry',
            content: `❌ **Error**\n\nSorry, I encountered an error:\n\n\`${errorMessage}\`\n\nPlease try again or check your configuration.`,
            type: 'text'
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const processHarryCommand = async (command: string) => {
    const cmd = command.toLowerCase();

    // Wallet generation
    if (cmd.includes('wallet') || cmd.includes('generate wallet')) {
      const wallet = await generateWallet();
      
      // Format the full wallet response for display
      const walletResponse = {
        walletPublicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        apiKey: wallet.apiKey,
      };
      
      const formattedJson = JSON.stringify(walletResponse, null, 2);
      
      return {
        message: wallet.publicKey.startsWith('DemoWallet')
          ? `🧪 **Demo Wallet Generated!**\n\n⚠️ **This is demo data for testing.** Real wallet generation requires PumpPortal API connectivity.\n\n\`\`\`json\n${formattedJson}\n\`\`\``
          : `✅ **Wallet Generated Successfully!**\n\nYour new wallet has been created and stored securely.\n\n**Wallet Details:**\n- **Public Key:** \`${wallet.publicKey}\`\n- **Private Key:** \`${wallet.privateKey}\`\n- **API Key:** \`${wallet.apiKey}\`\n\n⚠️ **Save these securely!** The private key and API key are shown only once.\n\n\`\`\`json\n${formattedJson}\n\`\`\`\n\n🔗 [View API Documentation](https://pumpportal.fun/other-endpoints/create-wallet)`,
        type: 'action',
        data: { action: 'wallet_generated', wallet }
      };
    }

    // Meme coin creation
    if (cmd.includes('create') && (cmd.includes('coin') || cmd.includes('meme') || cmd.includes('token'))) {
      const autoLaunch = cmd.includes('launch') || cmd.includes('deploy');
      const coinData = await createMemeCoin(command, autoLaunch);
      
      // Check if it's a token creation result (launched) or just coin data
      if ('mintAddress' in coinData) {
        // Token was launched
        return {
          message: `🚀 **Token Launched Successfully!**\n\nYour meme coin is now live on Pump.fun!\n\n**Token Details:**\n- **Name:** ${coinData.name}\n- **Symbol:** ${coinData.symbol}\n- **Mint Address:** \`${coinData.mintAddress}\`\n- **Transaction:** \`${coinData.transactionSignature}\`\n\n✅ Ready to trade!`,
          type: 'action',
          data: { action: 'token_launched', token: coinData }
        };
      } else {
        // Coin created but not launched
        return {
          message: `🎨 **Meme Coin Created!**\n\nI've generated a meme coin concept for you:\n\n**Token Details:**\n- **Name:** ${coinData.name}\n- **Symbol:** ${coinData.symbol}\n- **Description:** ${coinData.description}\n\n**AI Generated Content:**\n${coinData.content}\n\n💡 Say "launch this token" to deploy it on Pump.fun!`,
          type: 'action',
          data: { action: 'coin_created', coin: coinData }
        };
      }
    }

    // Trading - Enhanced with more actions
    if (cmd.includes('trade') || cmd.includes('buy') || cmd.includes('sell') || cmd.includes('execute')) {
      const currentWallet = getCurrentWallet();
      if (!currentWallet) {
        return {
          message: `❌ **No Wallet Available**\n\nPlease generate a wallet first by saying "generate wallet" or "create wallet".`,
          type: 'text'
        };
      }

      // Try to extract token mint from command
      const mintMatch = cmd.match(/([A-Za-z0-9]{32,44})/);
      const tokenMint = mintMatch ? mintMatch[1] : undefined;
      
      if (!tokenMint && !cmd.includes('token')) {
        return {
          message: `📈 **Trade Command**\n\nTo execute a trade, provide a token address:\n- "Buy 0.1 SOL of [token_address]"\n- "Sell 0.05 SOL of [token_address]"\n\nOr visit a token page and say "buy 0.1 SOL" to trade the current token.`,
          type: 'text'
        };
      }

      const tradeResult = await executeTrade(command, tokenMint);
        return {
          message: `📈 **Trade Executed!**\n\n✅ Your trade was successful!\n\n**Trade Details:**\n- **Action:** ${tradeResult.action}\n- **Token:** \`${tradeResult.token}\`\n- **Amount:** ${tradeResult.amount} SOL\n- **Transaction:** \`${tradeResult.txHash}\`\n\n**Next Steps:**\n- Monitor your position in the dashboard\n- Set stop-loss to protect profits\n- Track performance in your portfolio`,
          type: 'action',
          data: { action: 'trade_executed', trade: tradeResult }
        };
    }

    // Advanced trading actions
    if (cmd.includes('stop loss') || cmd.includes('stop-loss') || cmd.includes('set stop')) {
      return {
        message: `🛡️ **Stop Loss Configuration:**\n\nI can help you set up stop-loss orders to protect your positions.\n\n**Options:**\n- **Percentage-based:** "Set stop loss at -10%"\n- **Price-based:** "Set stop at $0.0005"\n- **Trailing stop:** "Set trailing stop at 5%"\n\n**Current Token:** Available in dashboard\n\nSay: "Set stop loss at -15%" to configure.`,
        type: 'action',
        data: { action: 'stop_loss_config' }
      };
    }

    if (cmd.includes('take profit') || cmd.includes('profit target') || cmd.includes('target')) {
      return {
        message: `🎯 **Take Profit Configuration:**\n\nSet profit targets to automatically take gains.\n\n**Options:**\n- **Percentage:** "Take profit at +50%"\n- **Price:** "Sell at $0.001"\n- **Partial:** "Sell 25% at 2x, 25% at 3x"\n\n**Current Token:** Available in dashboard\n\nSay: "Take profit at +100%" to configure.`,
        type: 'action',
        data: { action: 'take_profit_config' }
      };
    }

    if (cmd.includes('position') || cmd.includes('portfolio') || cmd.includes('holdings')) {
      return {
        message: `💼 **Position Management:**\n\nI can help you manage your positions:\n\n**Available Actions:**\n- View all positions\n- Check P&L\n- Rebalance portfolio\n- Close positions\n- Set alerts\n\n**Quick Commands:**\n- "Show my positions"\n- "What's my P&L?"\n- "Close position for [token]"\n\nVisit /portfolio for detailed view.`,
        type: 'action',
        data: { action: 'position_management' }
      };
    }

    // Image generation
    if (cmd.includes('image') || cmd.includes('picture') || cmd.includes('generate image')) {
      const imageUrl = await generateImage(command);
      return {
        message: `🎨 **Image Generated!**\n\n![Generated Image](${imageUrl})`,
        type: 'action',
        data: { action: 'image_generated', imageUrl }
      };
    }

    // Content generation
    if (cmd.includes('content') || cmd.includes('post') || cmd.includes('tweet') || cmd.includes('social')) {
      const content = await generateContent(command);
      return {
        message: `💬 **Content Generated!**\n\n${content}`,
        type: 'action',
        data: { action: 'content_generated', content }
      };
    }

    // Default AI response
    return {
      message: await generateContent(`Respond helpfully to: "${command}". Keep it concise and actionable.`),
      type: 'text'
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getQuickActions = () => [
    { label: 'Generate Wallet', icon: <Wallet className="w-4 h-4" />, command: 'generate a new wallet' },
    { label: 'Create Meme Coin', icon: <Coins className="w-4 h-4" />, command: 'create a funny meme coin about cats' },
    { label: 'Buy 0.1 SOL', icon: <TrendingUp className="w-4 h-4" />, command: 'buy 0.1 SOL worth of the trending token' },
    { label: 'Set Stop Loss', icon: <Target className="w-4 h-4" />, command: 'set stop loss at -10%' },
    { label: 'Take Profit', icon: <BarChart3 className="w-4 h-4" />, command: 'take profit at +50%' },
    { label: 'Generate Image', icon: <Image className="w-4 h-4" />, command: 'generate an image of a rocket ship made of memes' },
    { label: 'Social Content', icon: <MessageSquare className="w-4 h-4" />, command: 'create viral social media content about crypto memes' }
  ];

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Bot className="w-10 h-10 text-purple-500" />
            Harry - AI Trading Agent
          </h1>
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading Harry...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3 mb-6">
        <div className="flex items-center justify-center gap-3">
          <Bot className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Harry - AI Trading Agent</h1>
          <Badge variant="outline" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            Online
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Your intelligent trading companion for wallets, memes, and profits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[650px] flex flex-col shadow-lg">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-purple-500" />
                Chat with Harry
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 gap-4">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] p-4 rounded-lg shadow-sm',
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : message.type === 'action'
                          ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
                          : 'bg-muted border border-border text-foreground'
                      )}
                    >
                      <MessageRenderer content={message.content} type={message.type} />
                      <div className="text-xs opacity-75 mt-2 flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">{message.timestamp.toLocaleTimeString()}</span>
                        {message.actionData?.action && (
                          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300">
                            {message.actionData.action.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(isLoading || isWalletGenerating || isCoinCreating || isTrading || isGeneratingContent) && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                        <div className="text-sm">
                          {isWalletGenerating && "Generating wallet..."}
                          {isCoinCreating && "Creating meme coin..."}
                          {isTrading && "Executing trade..."}
                          {isGeneratingContent && "Generating content..."}
                          {isLoading && !isWalletGenerating && !isCoinCreating && !isTrading && !isGeneratingContent && "Harry is thinking..."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Harry to generate wallets, create coins, make trades..."
                  className="flex-1 min-h-[60px] resize-none"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!currentInput.trim() || isLoading}
                  className="px-4 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs">Wallet Generator</span>
                <Badge variant={isWalletGenerating ? "default" : "secondary"} className="text-xs">
                  {isWalletGenerating ? "Active" : "Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Coin Creator</span>
                <Badge variant={isCoinCreating ? "default" : "secondary"} className="text-xs">
                  {isCoinCreating ? "Active" : "Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Trader</span>
                <Badge variant={isTrading ? "default" : "secondary"} className="text-xs">
                  {isTrading ? "Active" : "Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Content Creator</span>
                <Badge variant={isGeneratingContent ? "default" : "secondary"} className="text-xs">
                  {isGeneratingContent ? "Active" : "Ready"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              {getQuickActions().map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  onClick={() => setCurrentInput(action.command)}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">{action.icon}</span>
                    <span className="text-xs font-medium">{action.label}</span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span>Wallet Generation</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span>Meme Coin Creation</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Auto Trading</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Image className="w-4 h-4 text-purple-500" />
                  <span>AI Image Generation</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <MessageSquare className="w-4 h-4 text-pink-500" />
                  <span>Viral Content Creation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
