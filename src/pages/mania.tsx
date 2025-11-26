import React, { useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { useManiaFeed } from '@/contexts/ManiaFeedProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Settings,
  Twitter,
  MessageCircle,
  Newspaper,
  Instagram,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { FeedItem } from '@/types/mania';
import { SentimentAnalysis } from '@/components/SentimentAnalysis';

const SentimentIcon = ({ sentiment }: { sentiment?: 'positive' | 'negative' | 'neutral' }) => {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'negative':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'twitter':
      return <Twitter className="h-4 w-4" />;
    case 'telegram':
      return <MessageCircle className="h-4 w-4" />;
    case 'news':
      return <Newspaper className="h-4 w-4" />;
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    default:
      return <MessageCircle className="h-4 w-4" />;
  }
};

const FeedItemCard = ({ item }: { item: FeedItem }) => (
  <Card className="mb-4 hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={item.platform} />
          <span className="font-semibold text-sm">@{item.author}</span>
          <SentimentIcon sentiment={item.sentiment} />
        </div>
        <Badge variant="outline" className="text-xs">
          {item.filterType?.toUpperCase()}
        </Badge>
      </div>

      <p className="text-sm mb-3 leading-relaxed">{item.content}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {item.engagement.likes?.toLocaleString()}
          </div>
          {item.engagement.retweets && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {item.engagement.retweets.toLocaleString()}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {item.engagement.views?.toLocaleString()}
          </div>
        </div>
        <span>{item.timestamp.toLocaleTimeString()}</span>
      </div>

      {item.relatedTokens && item.relatedTokens.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.relatedTokens.map(token => (
            <Badge key={token} variant="secondary" className="text-xs">
              {token}
            </Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const FilterSection = ({
  title,
  filters,
  onToggle
}: {
  title: string;
  filters: Record<string, boolean>;
  onToggle: (key: string) => void;
}) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-sm">{title}</h3>
    <ScrollArea className="h-48">
      {Object.entries(filters).map(([key, enabled]) => (
        <div key={key} className="flex items-center justify-between py-1">
          <span className="text-sm truncate">{key}</span>
          <Switch checked={enabled} onCheckedChange={() => onToggle(key)} />
        </div>
      ))}
    </ScrollArea>
  </div>
);

export default function ManiaPage() {
  const {
    feeds,
    loading,
    error,
    refreshFeeds,
    toggleFeedSource,
    toggleContentFilter,
    settings
  } = useManiaFeed();

  const [showSettings, setShowSettings] = useState(false);

  const handleRefresh = async () => {
    await refreshFeeds();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Mania - Social Media Intelligence | Mayhem</title>
        <meta name="description" content="Monitor social media feeds, track sentiment, and discover trading opportunities with Mania" />
      </Head>

      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mania Social Intelligence</h1>
            <p className="text-muted-foreground">
              Monitor social media feeds and discover trading opportunities
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sentiment Analysis Sidebar */}
          <div className="lg:col-span-1">
            <SentimentAnalysis feeds={feeds} />
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="twitter">Twitter</TabsTrigger>
                <TabsTrigger value="telegram">Telegram</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
              </TabsList>

              {error && (
                <Card className="mt-4">
                  <CardContent className="p-4 text-center text-red-500">
                    {error}
                  </CardContent>
                </Card>
              )}

              <TabsContent value="all" className="mt-4">
                {feeds.map(item => (
                  <FeedItemCard key={item.id} item={item} />
                ))}
              </TabsContent>

              <TabsContent value="twitter" className="mt-4">
                {feeds.filter(item => item.platform === 'twitter').map(item => (
                  <FeedItemCard key={item.id} item={item} />
                ))}
              </TabsContent>

              <TabsContent value="telegram" className="mt-4">
                {feeds.filter(item => item.platform === 'telegram').map(item => (
                  <FeedItemCard key={item.id} item={item} />
                ))}
              </TabsContent>

              <TabsContent value="news" className="mt-4">
                {feeds.filter(item => item.platform === 'news').map(item => (
                  <FeedItemCard key={item.id} item={item} />
                ))}
              </TabsContent>

              <TabsContent value="instagram" className="mt-4">
                {feeds.filter(item => item.platform === 'instagram').map(item => (
                  <FeedItemCard key={item.id} item={item} />
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Settings Sidebar */}
          {showSettings && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feed Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Feed Sources */}
                  <div>
                    <h3 className="font-semibold mb-3">Feed Sources</h3>
                    <div className="space-y-2">
                      {Object.entries(settings.feedSources.aio).map(([key, enabled]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key}</span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => toggleFeedSource('aio', key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Content Filters */}
                  <div className="space-y-4">
                    <FilterSection
                      title="CT Accounts"
                      filters={settings.contentFilters.ctAccounts}
                      onToggle={(key) => toggleContentFilter('ctAccounts', key)}
                    />

                    <FilterSection
                      title="Instagram Accounts"
                      filters={settings.contentFilters.instagramAccounts}
                      onToggle={(key) => toggleContentFilter('instagramAccounts', key)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
