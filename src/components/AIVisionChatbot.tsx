import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Bot,
  Send,
  Image,
  Type,
  FileText,
  DollarSign,
  Sparkles,
  Eye,
  Check,
  X,
  RefreshCw,
  Zap
} from 'lucide-react';

interface GenerationResult {
  id: string;
  type: 'title' | 'description' | 'image';
  content: string;
  cost: number;
  selected: boolean;
  quality?: 'standard' | 'hd';
  size?: '256x256' | '512x512' | '1024x1024';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const COST_ESTIMATES = {
  title: 0.001, // ~$0.001 per title generation
  description: 0.002, // ~$0.002 per description generation
  image_standard: 0.016, // DALL-E 2 standard
  image_hd: 0.020, // DALL-E 2 HD
};

export const AIVisionChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Vision Assistant. Describe your vision, idea, or concept, and I'll help you generate stunning visuals, compelling titles, and engaging descriptions. Let's create something amazing together! ✨",
      timestamp: new Date()
    }
  ]);

  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
  const [budget, setBudget] = useState([1.0]); // Max budget in SOL
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');
  const [imageSize, setImageSize] = useState<'256x256' | '512x512' | '1024x1024'>('512x512');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateContent = async (prompt: string, types: ('title' | 'description' | 'image')[]) => {
    setIsLoading(true);
    const newResults: GenerationResult[] = [];

    try {
      for (const type of types) {
        if (type === 'title') {
          // Generate title using OpenAI
          const titleResponse = await fetch('/api/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'title',
              prompt: `Create a compelling, catchy title for: ${prompt}. Make it engaging and memorable.`,
            }),
          });

          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            newResults.push({
              id: `${type}-${Date.now()}`,
              type: 'title',
              content: titleData.result,
              cost: COST_ESTIMATES.title,
              selected: false,
            });
          }
        }

        if (type === 'description') {
          // Generate description using OpenAI
          const descResponse = await fetch('/api/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'description',
              prompt: `Write a detailed, engaging description for: ${prompt}. Make it compelling and informative.`,
            }),
          });

          if (descResponse.ok) {
            const descData = await descResponse.json();
            newResults.push({
              id: `${type}-${Date.now()}`,
              type: 'description',
              content: descData.result,
              cost: COST_ESTIMATES.description,
              selected: false,
            });
          }
        }

        if (type === 'image') {
          // Generate image using DALL-E
          const imageResponse = await fetch('/api/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'image',
              prompt: prompt,
              quality: imageQuality,
              size: imageSize,
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            newResults.push({
              id: `${type}-${Date.now()}`,
              type: 'image',
              content: imageData.result, // This would be the image URL
              cost: COST_ESTIMATES[imageQuality === 'hd' ? 'image_hd' : 'image_standard'],
              selected: false,
              quality: imageQuality,
              size: imageSize,
            });
          }
        }
      }

      setGenerationResults(prev => [...prev, ...newResults]);

      // Add assistant response
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I've generated some amazing content for your vision! Check out the results below. You can select what you want to purchase.`,
        timestamp: new Date()
      }]);

    } catch (error) {
      toast.error('Failed to generate content. Please try again.');
      console.error('Generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (autoGenerate) {
      await generateContent(currentInput, ['title', 'description', 'image']);
    } else {
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Got it! I've received your vision. What would you like me to generate? I can create titles, descriptions, and images.`,
        timestamp: new Date()
      }]);
    }

    setCurrentInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleSelection = (id: string) => {
    setGenerationResults(prev =>
      prev.map(result =>
        result.id === id ? { ...result, selected: !result.selected } : result
      )
    );
  };

  const getTotalCost = () => {
    return generationResults
      .filter(result => result.selected)
      .reduce((total, result) => total + result.cost, 0);
  };

  const handlePurchase = async () => {
    const selectedItems = generationResults.filter(result => result.selected);
    if (selectedItems.length === 0) {
      toast.error('Please select items to purchase');
      return;
    }

    const totalCost = getTotalCost();
    if (totalCost > budget[0]) {
      toast.error('Total cost exceeds your budget');
      return;
    }

    toast.success(`Purchasing ${selectedItems.length} items for ${totalCost.toFixed(4)} SOL`);
    // Here you would integrate with Solana wallet to make the payment
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'title': return <Type className="w-4 h-4" />;
      case 'description': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          AI Vision Chatbot
        </h1>
        <p className="text-muted-foreground">
          Describe your vision and let AI create stunning visuals, titles, and descriptions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Vision Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating content...</span>
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
                  placeholder="Describe your vision, idea, or concept..."
                  className="flex-1 min-h-[60px] resize-none"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!currentInput.trim() || isLoading}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Results */}
        <div className="space-y-4">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto Generate Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Generate All</label>
                <Switch
                  checked={autoGenerate}
                  onCheckedChange={setAutoGenerate}
                />
              </div>

              {/* Budget Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget (SOL)</label>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Max: {budget[0].toFixed(2)} SOL
                </div>
              </div>

              {/* Image Quality */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image Quality</label>
                <div className="flex gap-2">
                  <Button
                    variant={imageQuality === 'standard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageQuality('standard')}
                  >
                    Standard
                  </Button>
                  <Button
                    variant={imageQuality === 'hd' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageQuality('hd')}
                  >
                    HD
                  </Button>
                </div>
              </div>

              {/* Image Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image Size</label>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { value: '256x256', label: '256×256' },
                    { value: '512x512', label: '512×512' },
                    { value: '1024x1024', label: '1024×1024' },
                  ].map((size) => (
                    <Button
                      key={size.value}
                      variant={imageSize === size.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageSize(size.value as any)}
                    >
                      {size.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Results */}
          {generationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {generationResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(result.type)}
                        <Badge variant="outline" className="capitalize">
                          {result.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {result.cost.toFixed(4)} SOL
                        </span>
                        <Button
                          variant={result.selected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleSelection(result.id)}
                        >
                          {result.selected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm">
                      {result.type === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={result.content}
                            alt="Generated"
                            className="w-full h-32 object-cover rounded"
                          />
                          {result.quality && (
                            <Badge variant="secondary" className="text-xs">
                              {result.quality.toUpperCase()} • {result.size}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{result.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Purchase Summary */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Selected:</span>
                    <span className="font-bold">{getTotalCost().toFixed(4)} SOL</span>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={getTotalCost() === 0 || getTotalCost() > budget[0]}
                    className="w-full"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Purchase Selected Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Generate Buttons */}
          {!autoGenerate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Generate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => generateContent(currentInput || 'Default concept', ['title'])}
                  disabled={!currentInput.trim() && isLoading}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Generate Title
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => generateContent(currentInput || 'Default concept', ['description'])}
                  disabled={!currentInput.trim() && isLoading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Description
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => generateContent(currentInput || 'Default concept', ['image'])}
                  disabled={!currentInput.trim() && isLoading}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Generate Image
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
