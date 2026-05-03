import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "green" | "cyan" | "pink" | "purple" | "orange";
}

const variantStyles: Record<string, string> = {
  default: "border-white/10 text-slate-400 bg-white/[0.03]",
  green: "border-neon-green/20 text-neon-green bg-neon-green/[0.08]",
  cyan: "border-neon-cyan/20 text-neon-cyan bg-neon-cyan/[0.08]",
  pink: "border-neon-pink/20 text-neon-pink bg-neon-pink/[0.08]",
  purple: "border-neon-purple/20 text-neon-purple bg-neon-purple/[0.08]",
  orange: "border-neon-orange/20 text-neon-orange bg-neon-orange/[0.08]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
