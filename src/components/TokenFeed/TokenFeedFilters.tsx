/**
 * Token Feed Filters Component
 * Allows users to filter real-time token feed by various criteria
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/slider';
import { X, Filter, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { TokenFilter } from '@/lib/services/pumpportal-websocket';

interface TokenFeedFiltersProps {
  filters: TokenFilter;
  onFiltersChange: (filters: TokenFilter) => void;
  onReset: () => void;
}

export const TokenFeedFilters: React.FC<TokenFeedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof TokenFilter>(key: K, value: TokenFilter[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    filters.minMarketCap !== undefined ||
    filters.maxMarketCap !== undefined ||
    filters.minInitialBuy !== undefined ||
    filters.pool !== undefined ||
    filters.minBondingCurve !== undefined ||
    filters.maxBondingCurve !== undefined ||
    filters.searchTerm !== undefined;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Token name, symbol, or address..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value || undefined)}
            />
          </div>

          {/* Pool Type */}
          <div>
            <Label>Pool Type</Label>
            <Select
              value={filters.pool || 'all'}
              onValueChange={(value) => updateFilter('pool', value === 'all' ? undefined : value as 'pump' | 'bonk')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pools</SelectItem>
                <SelectItem value="pump">Pump.fun</SelectItem>
                <SelectItem value="bonk">Bonk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Market Cap Range */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              Market Cap (SOL)
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minMarketCap || ''}
                  onChange={(e) => updateFilter('minMarketCap', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxMarketCap || ''}
                  onChange={(e) => updateFilter('maxMarketCap', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Initial Buy Amount */}
          <div>
            <Label>Minimum Initial Buy (SOL)</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={filters.minInitialBuy || ''}
              onChange={(e) => updateFilter('minInitialBuy', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Bonding Curve Progress */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              Bonding Curve Progress (%)
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min %"
                  min="0"
                  max="100"
                  value={filters.minBondingCurve || ''}
                  onChange={(e) => updateFilter('minBondingCurve', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max %"
                  min="0"
                  max="100"
                  value={filters.maxBondingCurve || ''}
                  onChange={(e) => updateFilter('maxBondingCurve', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

