import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white shadow hover:bg-blue-700',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        outline: 'border border-gray-800 bg-gray-900/60 text-gray-200 shadow-sm hover:bg-gray-800 hover:text-white',
        secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white',
        ghost: 'text-gray-400 hover:bg-gray-800 hover:text-white',
        link: 'text-blue-400 underline-offset-4 hover:underline',
        emerald: 'bg-emerald-600 text-white shadow hover:bg-emerald-700',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs font-semibold',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-sm font-semibold',
        xl: 'h-12 rounded-xl px-8 text-base font-bold',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
