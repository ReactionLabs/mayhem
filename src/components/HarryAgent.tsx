import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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

  const {
    generateWallet,
    createMemeCoin,
    executeTrade,
    generateImage,
    generateContent,
    isWalletGenerating,
    isCoinCreating,
    isTrading,
    isGeneratingContent
  } = useHarryAgent();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsHydrated(true);
    setMessages([
      {
        id: '1',
        role: 'harry',
        content: "Hello! I'm Harry, your AI trading agent. I can help you:\n\n🎯 **Generate wallets** from PumpPortal\n🚀 **Create meme coins** with AI-generated content\n📈 **Execute trades** automatically\n🎨 **Generate images & memes** for promotion\n💬 **Create viral content** to post about your tokens\n\nWhat would you like me to help you with today?",
        timestamp: new Date(),
        type: 'text'
      }
    ]);
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
    if (!currentInput.trim()) return;

    const userMessage = currentInput.trim();
    addMessage({ role: 'user', content: userMessage, type: 'text' });
    setCurrentInput('');
    setIsLoading(true);

    try {
      // Parse user intent and execute appropriate action
      const response = await processHarryCommand(userMessage);
      addMessage({
        role: 'harry',
        content: response.message,
        type: response.type || 'text',
        actionData: response.data
      });
    } catch (error) {
      addMessage({
        role: 'harry',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'text'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processHarryCommand = async (command: string) => {
    const cmd = command.toLowerCase();

    // Wallet generation
    if (cmd.includes('wallet') || cmd.includes('generate wallet')) {
      const wallet = await generateWallet();
      return {
        message: `✅ **Wallet Generated Successfully!**\n\n**Public Key:** \`${wallet.publicKey}\`\n**Private Key:** \`${wallet.privateKey}\`\n**API Key:** \`${wallet.apiKey}\`\n\n⚠️ **Save these securely!** The private key and API key are shown only once.`,
        type: 'action',
        data: { action: 'wallet_generated', wallet }
      };
    }

    // Meme coin creation
    if (cmd.includes('create') && (cmd.includes('coin') || cmd.includes('meme') || cmd.includes('token'))) {
      const coinData = await createMemeCoin(command);
      return {
        message: `🚀 **Meme Coin Created!**\n\n**Name:** ${coinData.name}\n**Symbol:** ${coinData.symbol}\n**Description:** ${coinData.description}\n**Contract:** \`${coinData.contractAddress}\`\n\n**AI Generated Content:**\n${coinData.content}`,
        type: 'action',
        data: { action: 'coin_created', coin: coinData }
      };
    }

    // Trading
    if (cmd.includes('trade') || cmd.includes('buy') || cmd.includes('sell')) {
      const tradeResult = await executeTrade(command);
      return {
        message: `📈 **Trade Executed!**\n\n**Action:** ${tradeResult.action}\n**Token:** ${tradeResult.token}\n**Amount:** ${tradeResult.amount} SOL\n**Status:** ✅ Success\n**Tx Hash:** \`${tradeResult.txHash}\``,
        type: 'action',
        data: { action: 'trade_executed', trade: tradeResult }
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
    { label: 'Execute Trade', icon: <TrendingUp className="w-4 h-4" />, command: 'buy 0.1 SOL worth of the trending token' },
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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Bot className="w-10 h-10 text-purple-500" />
          Harry - AI Trading Agent
          <Badge variant="outline" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            Online
          </Badge>
        </h1>
        <p className="text-muted-foreground">
          Your intelligent trading companion for wallets, memes, and profits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-purple-500" />
                Chat with Harry
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : message.type === 'action'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-2 flex items-center gap-2">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.actionData?.action && (
                          <Badge variant="outline" className="text-xs">
                            {message.actionData.action.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(isLoading || isWalletGenerating || isCoinCreating || isTrading || isGeneratingContent) && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Harry's Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getQuickActions().map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  onClick={() => setCurrentInput(action.command)}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <span className="text-xs">{action.label}</span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Harry's Powers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-green-500" />
                  <span>Wallet Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span>Meme Coin Creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  <span>Auto Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="w-3 h-3 text-purple-500" />
                  <span>AI Image Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-pink-500" />
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
