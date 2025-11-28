/**
 * Real-time PnL Display Component
 * Shows user's total profit/loss in real-time
 */

import { useRealTimePnL } from '@/hooks/useRealTimePnL';
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { formatReadableNumber } from '@/lib/format/number';
import Link from 'next/link';

export const PnLDisplay = () => {
  const { totalPnL, totalPnLPercent, totalValue, isLoading, positions } = useRealTimePnL();

  const isPositive = totalPnL >= 0;
  const hasPositions = positions.length > 0;

  if (!hasPositions && !isLoading) {
    return null; // Don't show if no positions
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 border-border hover:bg-secondary/60 transition-all ${
            isPositive ? 'hover:border-green-500/50' : 'hover:border-red-500/50'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Loading...</span>
            </>
          ) : (
            <>
              {isPositive ? (
                <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
              )}
              <div className="flex flex-col items-start">
                <span className={`text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}
                  {formatReadableNumber(totalPnL, { decimals: 2, prefix: '$' })}
                </span>
                <span className={`text-[10px] ${isPositive ? 'text-green-500/70' : 'text-red-500/70'}`}>
                  {isPositive ? '+' : ''}
                  {totalPnLPercent.toFixed(2)}%
                </span>
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Portfolio P&L</span>
          <span className="text-xs font-normal text-muted-foreground">
            {positions.length} {positions.length === 1 ? 'position' : 'positions'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-semibold">${formatReadableNumber(totalValue, { decimals: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total P&L</span>
              <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}${formatReadableNumber(totalPnL, { decimals: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">P&L %</span>
              <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Positions List */}
          {positions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Positions
                </div>
                {positions.slice(0, 5).map((pos) => {
                  const posIsPositive = pos.pnl >= 0;
                  return (
                    <div
                      key={pos.mint}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{pos.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {formatReadableNumber(pos.balance, { decimals: 2 })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Entry: ${formatReadableNumber(pos.entryPrice, { decimals: 6 })}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className={`text-sm font-bold ${posIsPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {posIsPositive ? '+' : ''}
                          {pos.pnlPercent.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${formatReadableNumber(pos.value, { decimals: 2 })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {positions.length > 5 && (
                  <div className="text-xs text-center text-muted-foreground pt-2">
                    +{positions.length - 5} more positions
                  </div>
                )}
              </div>
            </>
          )}

          <DropdownMenuSeparator />
          <Button asChild variant="outline" className="w-full">
            <Link href="/portfolio">
              <DollarSign className="w-4 h-4 mr-2" />
              View Full Portfolio
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

