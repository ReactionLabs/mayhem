import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';

const skeletonVariants = cva('h-12 w-full rounded-lg bg-muted', {
  variants: {
    variant: {
      shimmer:
        'animate-shine-reverse !bg-[linear-gradient(90deg,hsl(var(--muted)),hsl(var(--accent))_40%,hsl(var(--accent))_60%,hsl(var(--muted)))] bg-200-auto',
      pulse: 'animate-pulse',
    },
    color: {
      default: 'bg-muted',
      muted: 'bg-accent',
    },
  },
  defaultVariants: {
    variant: 'shimmer',
    color: 'default',
  },
});

type SkeletonProps = React.ComponentPropsWithoutRef<'div'> & VariantProps<typeof skeletonVariants>;

export const Skeleton: React.FC<SkeletonProps> = ({ variant, color, className, ...props }) => {
  return <div className={cn(skeletonVariants({ variant, color }), className)} {...props} />;
};
