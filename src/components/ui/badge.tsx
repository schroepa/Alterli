import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center border px-2 py-0.5 text-xs font-sans tracking-widest uppercase transition-colors',
  {
    variants: {
      variant: {
        default:  'border-primary/40 bg-primary/10 text-primary',
        outline:  'border-border text-muted-foreground',
        muted:    'border-transparent bg-muted text-muted-foreground',
        green:    'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
        blue:     'border-blue-500/40 bg-blue-500/10 text-blue-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
