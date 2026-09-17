import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-600 text-white shadow hover:bg-blue-700',
        secondary: 'border-gray-800 bg-gray-900 text-gray-300',
        destructive: 'border-transparent bg-red-600 text-white shadow hover:bg-red-700',
        outline: 'text-gray-300 border-gray-800',
        emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono',
        blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
