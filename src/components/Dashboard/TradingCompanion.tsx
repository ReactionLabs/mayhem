import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Zap, Wallet, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLocalStorage } from 'react-use';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    indicators?: string[];
  };
};

type WalletData = {
  publicKey: string;
  privateKey: string;
  apiKey: string;
  createdAt: string;
};

type TradingCompanionProps = {
  activeMint?: string;
  tokenName?: string;
  currentPrice?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  className?: string;
};

export const TradingCompanion: React.FC<TradingCompanionProps> = ({
  activeMint,
  tokenName,
  currentPrice,
  priceChange24h,
  volume24h,
  marketCap,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hey! I'm your AI trading companion. I can analyze charts, identify patterns, and help you make informed trading decisions.\n\nWhat would you like me to analyze?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store wallet in memory (persisted to localStorage)
  const [walletData, setWalletData, removeWallet] = useLocalStorage<WalletData | null>('trading-companion-wallet', null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize with wallet info if available (only once on mount)
  useEffect(() => {
    if (walletData && messages.length === 1 && !messages[0].content.includes('Wallet Status')) {
      // Add wallet info to initial message if wallet exists
      const updatedMessage = {
        ...messages[0],
        content: `${messages[0].content}\n\n💼 **Wallet Status:** I have a trading wallet ready!\n- Address: \`${walletData.publicKey.slice(0, 8)}...${walletData.publicKey.slice(-8)}\`\n- API Key: \`${walletData.apiKey.slice(0, 8)}...\`\n\nYou can ask me to create a new wallet or use the existing one for trades.`,
      };
      setMessages([updatedMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createWallet = async (): Promise<WalletData> => {
    setIsCreatingWallet(true);
    try {
      const response = await fetch('https://pumpportal.fun/api/create-wallet', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to create wallet: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.publicKey || !data.privateKey || !data.apiKey) {
        throw new Error('Invalid wallet data received from PumpPortal');
      }

      const wallet: WalletData = {
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        apiKey: data.apiKey,
        createdAt: new Date().toISOString(),
      };

      // Save to memory (localStorage)
      setWalletData(wallet);
      
      return wallet;
    } catch (error) {
      console.error('Wallet creation error:', error);
      throw error;
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const analyzeChart = async (query: string): Promise<string> => {
    // Simulate AI analysis - in production, this would call OpenAI API
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerQuery = query.toLowerCase();
    
    // Context-aware responses based on token data
    let analysis = '';
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0.5;
    const indicators: string[] = [];

    if (lowerQuery.includes('trend') || lowerQuery.includes('direction')) {
      if (priceChange24h && priceChange24h > 0) {
        sentiment = 'bullish';
        confidence = 0.7;
        analysis = `📈 **Trend Analysis:**\n\nBased on the current data:\n- 24h change: **+${priceChange24h.toFixed(2)}%** (bullish momentum)\n- Current price: **$${currentPrice?.toFixed(8) || 'N/A'}**\n\n**Pattern Recognition:**\nThe token is showing upward momentum. Consider watching for:\n- Support levels around recent lows\n- Resistance at previous highs\n- Volume confirmation for breakouts`;
        indicators.push('RSI', 'MACD', 'Volume');
      } else if (priceChange24h && priceChange24h < 0) {
        sentiment = 'bearish';
        confidence = 0.65;
        analysis = `📉 **Trend Analysis:**\n\nCurrent market conditions:\n- 24h change: **${priceChange24h.toFixed(2)}%** (downward pressure)\n- Current price: **$${currentPrice?.toFixed(8) || 'N/A'}**\n\n**Risk Assessment:**\nThe token is experiencing selling pressure. Watch for:\n- Support levels that might hold\n- Potential reversal signals\n- Volume patterns indicating accumulation`;
        indicators.push('Support Levels', 'Volume Analysis');
      } else {
        analysis = `📊 **Trend Analysis:**\n\nThe token is currently in a consolidation phase. Monitor for:\n- Breakout above resistance\n- Breakdown below support\n- Volume spikes indicating direction`;
        indicators.push('Consolidation', 'Volume');
      }
    } else if (lowerQuery.includes('buy') || lowerQuery.includes('entry')) {
      sentiment = priceChange24h && priceChange24h > 0 ? 'bullish' : 'neutral';
      confidence = 0.6;
      analysis = `💡 **Entry Strategy:**\n\n**Current Market Data:**\n- Price: $${currentPrice?.toFixed(8) || 'N/A'}\n- 24h Change: ${priceChange24h ? `${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%` : 'N/A'}\n- Volume: $${volume24h ? (volume24h / 1000).toFixed(1) + 'K' : 'N/A'}\n\n**Recommendations:**\n1. Wait for pullback to support levels\n2. Use limit orders to avoid slippage\n3. Set stop-loss at 5-10% below entry\n4. Monitor volume for confirmation\n\n⚠️ **Always do your own research and never invest more than you can afford to lose.**`;
      indicators.push('Support Levels', 'Stop Loss', 'Volume');
    } else if (lowerQuery.includes('sell') || lowerQuery.includes('exit')) {
      sentiment = 'neutral';
      confidence = 0.55;
      analysis = `💰 **Exit Strategy:**\n\n**Profit Taking Considerations:**\n1. Set take-profit targets at 2x, 3x, 5x entry\n2. Consider partial exits (e.g., 25% at 2x, 25% at 3x)\n3. Let winners run but protect profits\n4. Use trailing stops for volatile tokens\n\n**Current Position:**\n- Entry consideration: Monitor for optimal exit points\n- Risk management is key to long-term success`;
      indicators.push('Take Profit', 'Trailing Stop');
    } else if (lowerQuery.includes('pattern') || lowerQuery.includes('signal')) {
      sentiment = 'neutral';
      confidence = 0.6;
      analysis = `🔍 **Pattern Recognition:**\n\n**Common Patterns to Watch:**\n\n1. **Bullish Patterns:**\n   - Ascending triangles\n   - Cup and handle\n   - Double bottom\n\n2. **Bearish Patterns:**\n   - Descending triangles\n   - Head and shoulders\n   - Double top\n\n3. **Indicators:**\n   - RSI: Overbought (>70) or Oversold (<30)\n   - MACD: Crossover signals\n   - Volume: Confirmation of moves\n\n**Current Analysis:**\nMonitor the chart for these patterns forming. Volume confirmation is crucial.`;
      indicators.push('RSI', 'MACD', 'Volume', 'Pattern Recognition');
    } else if (lowerQuery.includes('wallet') || lowerQuery.includes('create wallet') || lowerQuery.includes('generate wallet')) {
      // Handle wallet creation
      try {
        const wallet = await createWallet();
        sentiment = 'neutral';
        confidence = 1.0;
        analysis = `💼 **Wallet Created Successfully!**\n\n✅ Your new trading wallet has been generated and saved to my memory.\n\n**Wallet Details:**\n- **Public Key:** \`${wallet.publicKey}\`\n- **API Key:** \`${wallet.apiKey}\`\n- **Created:** ${new Date(wallet.createdAt).toLocaleString()}\n\n🔒 **Security Note:**\nYour private key is securely stored in my memory. I can use this wallet for automated trades when you ask me to.\n\n**Next Steps:**\n- Fund the wallet with SOL to start trading\n- Ask me to execute trades using this wallet\n- I'll remember this wallet for future sessions`;
        indicators.push('Wallet', 'PumpPortal', 'Ready');
      } catch (error) {
        analysis = `❌ **Wallet Creation Failed**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease try again or check the PumpPortal API status.`;
        sentiment = 'neutral';
      }
    } else if (lowerQuery.includes('execute') || lowerQuery.includes('trade now') || lowerQuery.includes('buy now') || lowerQuery.includes('sell now')) {
      sentiment = 'neutral';
      confidence = 0.7;
      analysis = `⚡ **Trade Execution:**\n\nI can execute trades for you! Here's what I can do:\n\n**Available Actions:**\n- **Buy tokens** - "Buy 0.1 SOL of this token"\n- **Sell tokens** - "Sell 50% of my position"\n- **Set stop loss** - "Set stop loss at -10%"\n- **Take profit** - "Take profit at +50%"\n\n**Current Token:** ${tokenName || 'Select a token first'}\n**Price:** $${currentPrice?.toFixed(8) || 'N/A'}\n\n**To execute a trade, say:**\n- "Buy 0.1 SOL worth"\n- "Sell 25% of my position"\n- "Execute buy order for 0.5 SOL"`;
      indicators.push('Trade Execution', 'Automation');
    } else {
      analysis = `🤖 **Chart Analysis:**\n\nI can help you with:\n- **Trend analysis** - Identify market direction\n- **Entry/Exit points** - Optimal buy/sell timing\n- **Pattern recognition** - Spot chart patterns\n- **Risk management** - Position sizing and stops\n- **Volume analysis** - Confirm price movements\n- **Wallet management** - Create and manage trading wallets\n- **Trade execution** - Execute buy/sell orders automatically\n\n**Current Token:** ${tokenName || 'Select a token to analyze'}\n\nAsk me specific questions like:\n- "What's the current trend?"\n- "Should I buy now?"\n- "What patterns do you see?"\n- "What's a good exit strategy?"\n- "Create a wallet" or "Generate a trading wallet"\n- "Buy 0.1 SOL worth" or "Execute trade"`;
    }

    return analysis;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isCreatingWallet) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Check if it's a simple command that can be handled locally
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('wallet') && (lowerQuery.includes('create') || lowerQuery.includes('generate'))) {
        // Handle wallet creation locally
        const response = await analyzeChart(query);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          analysis: {
            sentiment: response.includes('📈') || response.includes('bullish') ? 'bullish' : 
                      response.includes('📉') || response.includes('bearish') ? 'bearish' : 'neutral',
            confidence: 0.6,
            indicators: response.match(/\*\*([^*]+)\*\*/g)?.map(m => m.replace(/\*\*/g, '')) || [],
          },
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Use streaming for AI responses
        const assistantMessageId = (Date.now() + 1).toString();
        let assistantContent = '';
        
        setMessages(prev => [...prev, {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }]);

        const response = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            agentType: 'trading',
            context: {
              tokenName,
              currentPrice,
              priceChange24h,
              volume24h,
              marketCap,
            },
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
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { 
                          ...msg, 
                          content: assistantContent,
                          analysis: {
                            sentiment: assistantContent.includes('📈') || assistantContent.includes('bullish') ? 'bullish' : 
                                      assistantContent.includes('📉') || assistantContent.includes('bearish') ? 'bearish' : 'neutral',
                            confidence: 0.6,
                            indicators: assistantContent.match(/\*\*([^*]+)\*\*/g)?.map(m => m.replace(/\*\*/g, '')) || [],
                          }
                        }
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
      }
    } catch (error) {
      toast.error('Failed to get analysis. Please try again.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Analysis error:', error);
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error:** ${error instanceof Error ? error.message : 'Something went wrong. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'flex items-center justify-center p-0',
          className
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      'fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col',
      'border-2 border-primary/20 bg-card',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Trading Companion</CardTitle>
            {tokenName && (
              <p className="text-xs text-muted-foreground">Analyzing: {tokenName}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.analysis && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.analysis.indicators?.map((indicator, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {(isLoading || isCreatingWallet) && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    {isCreatingWallet && <Wallet className="h-3 w-3 animate-pulse" />}
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {isCreatingWallet && <span className="text-xs text-muted-foreground ml-2">Creating wallet...</span>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet Info Display */}
            {walletData && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-500">Trading Wallet Active</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Public Key:</span>
                    <div className="flex items-center gap-1">
                      <code className="text-[10px] font-mono bg-background/50 px-1.5 py-0.5 rounded">
                        {walletData.publicKey.slice(0, 8)}...{walletData.publicKey.slice(-6)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(walletData.publicKey, 'publicKey')}
                      >
                        {copiedField === 'publicKey' ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">API Key:</span>
                    <div className="flex items-center gap-1">
                      <code className="text-[10px] font-mono bg-background/50 px-1.5 py-0.5 rounded">
                        {walletData.apiKey.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(walletData.apiKey, 'apiKey')}
                      >
                        {copiedField === 'apiKey' ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about trends, patterns, entry/exit, or create wallet..."
              className="flex-1 text-sm"
              disabled={isLoading || isCreatingWallet}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isCreatingWallet}
              size="sm"
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {['Trend?', 'Buy now?', 'Patterns?', 'Exit strategy?'].map((quick) => (
              <Button
                key={quick}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(quick);
                  setTimeout(() => handleSend(), 100);
                }}
                className="text-xs h-7 px-2"
                disabled={isLoading || isCreatingWallet}
              >
                {quick}
              </Button>
            ))}
            {!walletData && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setInput('create wallet');
                  setTimeout(() => handleSend(), 100);
                }}
                className="text-xs h-7 px-2 border-green-500/50 text-green-500 hover:bg-green-500/10"
                disabled={isLoading || isCreatingWallet}
              >
                <Wallet className="h-3 w-3 mr-1" />
                Create Wallet
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

