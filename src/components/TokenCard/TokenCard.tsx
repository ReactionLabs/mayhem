import React, { memo } from 'react';

import { Pool, TokenListTimeframe } from '../Explore/types';

import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/Skeleton';
import { TrenchesPoolTokenIcon } from '../TokenIcon/TokenIcon';
import { Copyable } from '../ui/Copyable';
import CopyIconSVG from '@/icons/CopyIconSVG';
import { TokenAge } from '../TokenAge';
import { TokenSocials } from '../TokenSocials';
import { TokenCardMcapMetric, TokenCardVolumeMetric } from './TokenCardMetric';
// import Link from 'next/link'; // Removed for Dashboard SPA behavior

type TokenCardProps = {
  pool: Pool;
  timeframe: TokenListTimeframe;
  rowRef: (element: HTMLElement | null, poolId: string) => void;
};

export const TokenCard: React.FC<TokenCardProps> = memo(({ pool, timeframe, rowRef }) => {
  const stats = pool.baseAsset[`stats${timeframe}`];
  const price = pool.baseAsset.usdPrice;
  const priceChange = stats?.priceChange;
  const liquidity = pool.baseAsset.liquidity;

  // We assume the parent container handles the click via onClick prop on the list item
  // So we remove the absolute positioned Link that was hijacking clicks.

  return (
    <div
      ref={(el) => rowRef(el, pool.id)}
      data-pool-id={pool.id}
      className="relative flex cursor-pointer items-center gap-3 border-b border-border/50 bg-card/50 px-4 py-3 text-xs transition-all duration-200 has-hover:hover:bg-card has-hover:hover:border-border has-hover:hover:shadow-sm"
    >
      {/* Token Icon */}
      <div className="shrink-0">
        <TrenchesPoolTokenIcon width={48} height={48} pool={pool} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden min-w-0">
        {/* Top Row: Symbol, Name, Social Indicators */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="whitespace-nowrap text-sm font-bold text-foreground truncate"
                title={pool.baseAsset.symbol}
              >
                {pool.baseAsset.symbol}
              </div>
              
              <div className="flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <Copyable
                  name="Address"
                  copyText={pool.baseAsset.id}
                  className="z-[1] flex min-w-0 items-center gap-1 text-[0.7rem] leading-none text-muted-foreground duration-200 hover:text-foreground data-[copied=true]:text-primary"
                >
                  {(copied) => (
                    <>
                      <div className="truncate max-w-[120px]" title={pool.baseAsset.name}>
                        {pool.baseAsset.name}
                      </div>
                      {copied ? (
                        <div className="iconify h-3 w-3 shrink-0 text-primary ph--check-bold" />
                      ) : (
                        <CopyIconSVG className="h-3 w-3 shrink-0 opacity-60" width={12} height={12} />
                      )}
                    </>
                  )}
                </Copyable>
              </div>
            </div>
          </div>

          {/* Social Media Indicators */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <TokenSocials className="z-[1]" token={pool.baseAsset} />
          </div>
        </div>

        {/* Bottom Row: Age, Price, Volume, Mcap */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
            <TokenAge className="text-[0.7rem] text-muted-foreground" date={pool.createdAt} />
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/60 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">
              <span className="text-neutral-500">
                {pool.dex || 'pump.fun'}
              </span>
              <span className="h-3 w-px bg-neutral-700" />
              <span className="text-neutral-400">
                {pool.baseAsset.launchpad ?? 'Launchpad'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem]">
            {typeof price === 'number' && price > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-neutral-500">Price</span>
                <span className="font-semibold">
                  $
                  {price < 0.01
                    ? price.toExponential(2)
                    : price.toFixed(6)}
                </span>
              </div>
            )}

            {typeof priceChange === 'number' && (
              <div className="flex items-center gap-1">
                <span className="text-neutral-500">24h</span>
                <span
                  className={cn(
                    'font-semibold',
                    priceChange > 0
                      ? 'text-emerald-400'
                      : priceChange < 0
                        ? 'text-red-400'
                        : 'text-neutral-400'
                  )}
                >
                  {priceChange > 0 ? '+' : ''}
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            )}

            {typeof liquidity === 'number' && liquidity > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-neutral-500">Liq.</span>
                <span className="font-semibold">
                  ${(liquidity / 1_000_000).toFixed(2)}M
                </span>
              </div>
            )}

            <TokenCardVolumeMetric buyVolume={stats?.buyVolume} sellVolume={stats?.sellVolume} />
            <TokenCardMcapMetric mcap={pool.baseAsset.mcap} />
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.pool.id === nextProps.pool.id &&
    prevProps.pool.baseAsset.mcap === nextProps.pool.baseAsset.mcap &&
    prevProps.pool.baseAsset[`stats${prevProps.timeframe}`]?.buyVolume === 
      nextProps.pool.baseAsset[`stats${nextProps.timeframe}`]?.buyVolume &&
    prevProps.timeframe === nextProps.timeframe
  );
});

type TokenCardSkeletonProps = React.ComponentPropsWithoutRef<'div'>;

export const TokenCardSkeleton: React.FC<TokenCardSkeletonProps> = ({ className, ...props }) => (
  <div className={cn('border-b border-border/50 bg-card/50 px-4 py-3', className)} {...props}>
    <div className="flex items-center gap-3">
      {/* Icon */}
      <div className="shrink-0">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-4 w-16" /> {/* Symbol */}
            <Skeleton className="h-3 w-24" /> {/* Name */}
          </div>
          <Skeleton className="h-3.5 w-12" /> {/* Social icons */}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-16" /> {/* Age */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12" /> {/* Volume */}
            <Skeleton className="h-4 w-12" /> {/* MCap */}
          </div>
        </div>
      </div>
    </div>
  </div>
);
