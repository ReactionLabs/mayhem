import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useRealTimePnL } from '@/hooks/useRealTimePnL';
import { formatReadableNumber } from '@/lib/format/number';

export const PositionsTable = () => {
  const { positions, totalValue, isLoading } = useRealTimePnL();

  return (
    <div className="flex flex-col border-t border-border bg-card" style={{ height: '200px', minHeight: '200px', maxHeight: '200px' }}>
      <div className="flex items-center justify-between p-2 px-4 border-b border-border bg-secondary/10">
        <h3 className="text-xs font-bold uppercase tracking-wider">Open Positions</h3>
        <Badge variant="outline" className="text-[10px] h-5">
          Total Value: ${formatReadableNumber(totalValue, { decimals: 2 })}
        </Badge>
      </div>
      
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted-foreground">Loading positions...</span>
          </div>
        ) : positions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted-foreground">No open positions</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/20 sticky top-0">
              <tr>
                <th className="p-2 pl-4 font-medium text-muted-foreground">Token</th>
                <th className="p-2 font-medium text-muted-foreground">Amount</th>
                <th className="p-2 font-medium text-muted-foreground">Entry</th>
                <th className="p-2 font-medium text-muted-foreground">Current</th>
                <th className="p-2 font-medium text-muted-foreground">PnL %</th>
                <th className="p-2 font-medium text-muted-foreground text-right pr-4">Value ($)</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.mint} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="p-2 pl-4 font-bold">{pos.symbol}</td>
                  <td className="p-2 font-mono">{formatReadableNumber(pos.balance, { decimals: 2 })}</td>
                  <td className="p-2 font-mono text-muted-foreground">
                    ${formatReadableNumber(pos.entryPrice, { decimals: 6 })}
                  </td>
                  <td className="p-2 font-mono">
                    ${formatReadableNumber(pos.currentPrice, { decimals: 6 })}
                  </td>
                  <td className={`p-2 font-mono font-bold ${pos.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pos.pnlPercent > 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                  </td>
                  <td className="p-2 pr-4 font-mono text-right">
                    ${formatReadableNumber(pos.value, { decimals: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

