import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from 'lucide-react';
import { FeedItem } from '@/types/mania';

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  score: number; // -1 to 1 scale
}

interface SentimentAnalysisProps {
  feeds: FeedItem[];
  className?: string;
}

const analyzeSentiment = (feeds: FeedItem[]): SentimentData => {
  const sentiments = feeds.reduce(
    (acc, feed) => {
      switch (feed.sentiment) {
        case 'positive':
          acc.positive++;
          break;
        case 'negative':
          acc.negative++;
          break;
        default:
          acc.neutral++;
      }
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const total = sentiments.positive + sentiments.negative + sentiments.neutral;
  const score = total > 0 ? (sentiments.positive - sentiments.negative) / total : 0;

  return {
    ...sentiments,
    total,
    score
  };
};

const getSentimentColor = (score: number) => {
  if (score > 0.3) return 'text-green-500';
  if (score < -0.3) return 'text-red-500';
  return 'text-yellow-500';
};

const getSentimentIcon = (score: number) => {
  if (score > 0.3) return <TrendingUp className="h-4 w-4" />;
  if (score < -0.3) return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

const getSentimentLabel = (score: number) => {
  if (score > 0.3) return 'Bullish';
  if (score < -0.3) return 'Bearish';
  return 'Neutral';
};

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({
  feeds,
  className = ''
}) => {
  const sentimentData = analyzeSentiment(feeds);

  if (sentimentData.total === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          No sentiment data available
        </CardContent>
      </Card>
    );
  }

  const positivePercent = (sentimentData.positive / sentimentData.total) * 100;
  const negativePercent = (sentimentData.negative / sentimentData.total) * 100;
  const neutralPercent = (sentimentData.neutral / sentimentData.total) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSentimentIcon(sentimentData.score)}
            <span className="font-semibold">Overall Sentiment</span>
          </div>
          <Badge variant="outline" className={getSentimentColor(sentimentData.score)}>
            {getSentimentLabel(sentimentData.score)}
          </Badge>
        </div>

        {/* Sentiment Score Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bearish</span>
            <span className="font-semibold">
              {sentimentData.score.toFixed(2)}
            </span>
            <span>Bullish</span>
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute left-1/2 top-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transform -translate-x-1/2"
              style={{
                width: `${Math.abs(sentimentData.score) * 100}%`,
                left: sentimentData.score >= 0 ? '50%' : `${50 + (sentimentData.score * 50)}%`
              }}
            />
            <div className="absolute left-1/2 top-0 w-0.5 h-full bg-foreground transform -translate-x-1/2" />
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Positive
              </span>
              <span>{sentimentData.positive} ({positivePercent.toFixed(1)}%)</span>
            </div>
            <Progress value={positivePercent} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Minus className="h-3 w-3 text-yellow-500" />
                Neutral
              </span>
              <span>{sentimentData.neutral} ({neutralPercent.toFixed(1)}%)</span>
            </div>
            <Progress value={neutralPercent} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                Negative
              </span>
              <span>{sentimentData.negative} ({negativePercent.toFixed(1)}%)</span>
            </div>
            <Progress value={negativePercent} className="h-2" />
          </div>
        </div>

        {/* Key Insights */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Key Insights
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {sentimentData.score > 0.3 && (
              <li>• Strong positive sentiment detected across social feeds</li>
            )}
            {sentimentData.score < -0.3 && (
              <li>• Bearish sentiment prevalent in recent discussions</li>
            )}
            {sentimentData.positive > sentimentData.negative * 2 && (
              <li>• Significantly more positive mentions than negative</li>
            )}
            {sentimentData.total > 50 && (
              <li>• High volume of social activity indicates strong interest</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
