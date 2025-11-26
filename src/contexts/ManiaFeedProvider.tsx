import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ManiaSettings, FeedItem, SocialPost } from '@/types/mania';
import { defaultManiaSettings } from '@/config/mania';

interface ManiaFeedContextType {
  settings: ManiaSettings;
  feeds: FeedItem[];
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<ManiaSettings>) => void;
  refreshFeeds: () => Promise<void>;
  toggleFeedSource: (source: keyof ManiaSettings['feedSources'], feedType: string) => void;
  toggleContentFilter: (filterType: 'ctAccounts' | 'ctFilters' | 'tgFilters' | 'newsFilters' | 'truthAccounts' | 'instagramAccounts', key: string) => void;
}

const ManiaFeedContext = createContext<ManiaFeedContextType | undefined>(undefined);

export const useManiaFeed = () => {
  const context = useContext(ManiaFeedContext);
  if (!context) {
    throw new Error('useManiaFeed must be used within a ManiaFeedProvider');
  }
  return context;
};

interface ManiaFeedProviderProps {
  children: ReactNode;
}


export const ManiaFeedProvider: React.FC<ManiaFeedProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ManiaSettings>(defaultManiaSettings);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFeeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mania/feeds');
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.feeds) {
        // Apply local filtering based on settings
        const filteredFeeds = data.feeds.filter((feed: FeedItem) => {
          // Filter based on enabled sources
          if (feed.platform === 'twitter' && !settings.feedSources.aio.ct) return false;
          if (feed.platform === 'telegram' && !settings.feedSources.aio.tg) return false;
          if (feed.platform === 'news' && !settings.feedSources.aio.news) return false;
          if (feed.platform === 'instagram' && !settings.feedSources.aio.instagram) return false;

          // Filter based on content filters
          if (feed.filterType === 'ct' && !settings.contentFilters.ctAccounts[feed.author]) return false;
          if (feed.filterType === 'tg' && !settings.contentFilters.tgFilters.find(f => f.id === feed.author)?.enabled) return false;
          if (feed.filterType === 'news' && !settings.contentFilters.newsFilters.find(f => f.id === feed.author)?.enabled) return false;
          if (feed.filterType === 'instagram' && !settings.contentFilters.instagramAccounts[feed.author]) return false;

          return true;
        });

        setFeeds(filteredFeeds);
      }
    } catch (err) {
      setError('Failed to refresh feeds');
      console.error('Error refreshing feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (newSettings: Partial<ManiaSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleFeedSource = (source: keyof ManiaSettings['feedSources'], feedType: string) => {
    setSettings(prev => ({
      ...prev,
      feedSources: {
        ...prev.feedSources,
        [source]: {
          ...prev.feedSources[source],
          [feedType]: !prev.feedSources[source][feedType as keyof typeof prev.feedSources[typeof source]]
        }
      }
    }));
  };

  const toggleContentFilter = (
    filterType: 'ctAccounts' | 'ctFilters' | 'tgFilters' | 'newsFilters' | 'truthAccounts' | 'instagramAccounts',
    key: string
  ) => {
    setSettings(prev => ({
      ...prev,
      contentFilters: {
        ...prev.contentFilters,
        [filterType]: {
          ...prev.contentFilters[filterType],
          [key]: !prev.contentFilters[filterType][key]
        }
      }
    }));
  };

  useEffect(() => {
    refreshFeeds();
  }, [settings]);

  const value: ManiaFeedContextType = {
    settings,
    feeds,
    loading,
    error,
    updateSettings,
    refreshFeeds,
    toggleFeedSource,
    toggleContentFilter
  };

  return (
    <ManiaFeedContext.Provider value={value}>
      {children}
    </ManiaFeedContext.Provider>
  );
};
