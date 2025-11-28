import React from 'react';
import { Badge } from '@/components/ui/badge';

export const PositionsTable = () => {
  const positions = [
    { id: 1, token: 'BONK', amount: 5000000, entry: 0.000011, current: 0.0000123, pnl: 12.5, value: 61.5 },
    { id: 2, token: 'WIF', amount: 100, entry: 2.60, current: 2.45, pnl: -5.2, value: 245.0 },
  ];

  return (
    <div className="flex flex-col border-t border-border bg-card" style={{ height: '200px', minHeight: '200px', maxHeight: '200px' }}>
      <div className="flex items-center justify-between p-2 px-4 border-b border-border bg-secondary/10">
        <h3 className="text-xs font-bold uppercase tracking-wider">Open Positions</h3>
        <Badge variant="outline" className="text-[10px] h-5">Total Value: $306.50</Badge>
      </div>
      
      <div className="flex-1 overflow-auto">
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
              <tr key={pos.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="p-2 pl-4 font-bold">{pos.token}</td>
                <td className="p-2 font-mono">{pos.amount.toLocaleString()}</td>
                <td className="p-2 font-mono text-muted-foreground">{pos.entry}</td>
                <td className="p-2 font-mono">{pos.current}</td>
                <td className={`p-2 font-mono font-bold ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pos.pnl > 0 ? '+' : ''}{pos.pnl}%
                </td>
                <td className="p-2 pr-4 font-mono text-right">${pos.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

