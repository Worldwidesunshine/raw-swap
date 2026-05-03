import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-600 transition-all duration-200",
        "focus:outline-none focus:border-neon-green/40 focus:ring-1 focus:ring-neon-green/20 focus:bg-white/[0.05]",
        "hover:border-white/[0.12]",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
