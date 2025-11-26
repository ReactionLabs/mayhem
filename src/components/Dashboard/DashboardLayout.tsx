import React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Layout/Sidebar';
import { WatchlistSidebar } from './WatchlistSidebar';
import { TradePanel } from './TradePanel';
import Header from '@/components/Header';
// ExtensionBridge removed - focusing on core functionality

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  activeMint?: string;
  onSelectToken?: (mint: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className, activeMint, onSelectToken }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* Top Navigation */}
      <Header />

      {/* Main Dashboard Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Navigation & Watchlist */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
           {/* We reuse the nav sidebar logic but maybe compact it or combine it */}
           {/* For now, let's assume the main Sidebar is for global nav, and we add a watchlist below it */}
           <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Watchlist</h3>
              <WatchlistSidebar onSelectToken={onSelectToken} />
           </div>
        </aside>

        {/* Center Content: Chart & Data */}
        <main className={cn("flex-1 flex flex-col min-w-0 overflow-y-auto relative", className)}>
          {children}
        </main>

        {/* Right Sidebar: Execution Panel */}
        <aside className="hidden xl:flex flex-col w-[320px] border-l border-border bg-card shadow-xl z-20">
          <TradePanel activeMint={activeMint} />
        </aside>
      </div>
    </div>
  );
};
