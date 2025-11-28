/**
 * Real-time PnL Summary Component
 * Compact display for portfolio overview
 */

import { useRealTimePnL } from '@/hooks/useRealTimePnL';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { formatReadableNumber } from '@/lib/format/number';

export const RealTimePnLSummary = () => {
  const { totalPnL, totalPnLPercent, totalValue, isLoading } = useRealTimePnL();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const isPositive = totalPnL >= 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="w-5 h-5 text-green-500" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-500" />
        )}
        <span className="text-2xl font-bold">
          {formatReadableNumber(totalValue, { prefix: '$', decimals: 2 })}
        </span>
      </div>
      <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}
        {formatReadableNumber(totalPnL, { prefix: '$', decimals: 2 })} ({isPositive ? '+' : ''}
        {totalPnLPercent.toFixed(2)}%)
      </div>
    </div>
  );
};

