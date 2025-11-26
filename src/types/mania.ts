export interface FeedSource {
  ca: boolean;
  streamflow: boolean;
  truth: boolean;
  tg: boolean;
  ct: boolean;
  launch: boolean;
  dex: boolean;
  news: boolean;
  instagram: boolean;
}

export interface FeedSources {
  aio: FeedSource;
  vision: FeedSource;
}

export interface ContentFilter {
  id: string;
  name: string;
  enabled: boolean;
  image: string;
  twitter: string;
}

export interface TgFilter {
  id: string;
  name: string;
  enabled: boolean;
  image: string;
  twitter: string;
}

export interface NewsFilter {
  id: string;
  name: string;
  enabled: boolean;
  image: string;
  twitter: string;
}

export interface TruthAccount {
  [account: string]: boolean;
}

export interface InstagramAccount {
  [account: string]: boolean;
}

export interface ContentFilters {
  ctAccounts: { [account: string]: boolean };
  ctFilters: ContentFilter[];
  tgFilters: TgFilter[];
  newsFilters: NewsFilter[];
  truthAccounts: TruthAccount;
  instagramAccounts: InstagramAccount;
}

export interface ManiaSettings {
  version: string;
  exportedAt: string;
  feedSources: FeedSources;
  contentFilters: ContentFilters;
}

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'telegram' | 'instagram' | 'news' | 'truth';
  author: string;
  content: string;
  timestamp: Date;
  engagement: {
    likes: number;
    retweets?: number;
    replies?: number;
    views?: number;
  };
  media?: string[];
  links?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  relatedTokens?: string[];
}

export interface FeedItem extends SocialPost {
  filterType?: 'ct' | 'tg' | 'news' | 'truth' | 'instagram';
  source: string;
}
