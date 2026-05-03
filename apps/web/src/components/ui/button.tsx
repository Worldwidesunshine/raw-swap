import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold font-mono uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/50 disabled:opacity-40 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-neon-green/20 to-neon-cyan/10 text-neon-green border border-neon-green/30 hover:border-neon-green/60 hover:shadow-neon-green hover:bg-neon-green/25 active:scale-[0.98]",
        fire:
          "bg-gradient-to-r from-neon-orange/20 to-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:border-neon-pink/60 hover:shadow-neon-pink active:scale-[0.98]",
        outline:
          "bg-transparent text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]",
        ghost:
          "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]",
        degen:
          "bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple text-void font-black hover:shadow-neon-green active:scale-[0.97] animate-gradient-x bg-[length:200%_100%]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3 text-xs",
        lg: "h-13 px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
