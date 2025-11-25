import { memo, useCallback } from 'react';
import { Pool } from '../Explore/types';
import { cn } from '@/lib/utils';
import { HoverPopover } from '../ui/HoverPopover';
import { ExternalLink } from '../ui/ExternalLink';
import { Twitter, Globe, MessageCircle, Link2 } from 'lucide-react';

type PartialBaseAsset = Pick<
  Pool['baseAsset'],
  'id' | 'website' | 'twitter' | 'telegram' | 'launchpad' | 'symbol'
>;

type TokenSocialsProps = React.ComponentPropsWithoutRef<'span'> & {
  token: PartialBaseAsset;
};

export const TokenSocials: React.FC<TokenSocialsProps> = memo(({ token, className, ...props }) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  }, []);

  const hasSocials = token.twitter || token.telegram || token.website;
  
  if (!hasSocials) {
    return null;
  }

  return (
    <span
      className={cn(
        'flex items-center gap-1.5',
        className
      )}
      {...props}
    >
      {token.twitter && (
        <HoverPopover content="Twitter/X" sideOffset={4}>
          <ExternalLink
            className="group/icon transition-colors"
            onClick={handleClick}
            href={token.twitter}
          >
            <Twitter
              className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover/icon:text-blue-400"
              aria-label="Twitter/X"
            />
          </ExternalLink>
        </HoverPopover>
      )}
      {token.telegram && (
        <HoverPopover content="Telegram" sideOffset={4}>
          <ExternalLink
            className="group/icon transition-colors"
            onClick={handleClick}
            href={token.telegram}
          >
            <MessageCircle
              className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover/icon:text-blue-500"
              aria-label="Telegram"
            />
          </ExternalLink>
        </HoverPopover>
      )}
      {token.website && (
        <HoverPopover content="Website" sideOffset={4}>
          <ExternalLink
            className="group/icon transition-colors"
            onClick={handleClick}
            href={token.website}
          >
            <Globe
              className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover/icon:text-primary"
              aria-label="Website"
            />
          </ExternalLink>
        </HoverPopover>
      )}
    </span>
  );
});

TokenSocials.displayName = 'TokenSocials';
