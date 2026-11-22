import React from "react";
import { cn } from "../../lib/cn";

const variants = {
  primary:
    "bg-mint-500 text-navy-950 shadow-[0_12px_30px_-12px_rgba(22,214,176,0.75)] hover:bg-mint-400 hover:shadow-[0_18px_40px_-14px_rgba(22,214,176,0.8)] active:scale-[0.985]",
  dark: "bg-navy-900 text-white shadow-float hover:bg-navy-800 active:scale-[0.985]",
  secondary:
    "border border-line bg-white text-ink-800 shadow-soft hover:-translate-y-0.5 hover:border-navy-900/15 hover:shadow-card active:translate-y-0",
  outline:
    "border border-navy-900/15 bg-transparent text-ink-800 hover:border-navy-900/30 hover:bg-navy-900/[0.04]",
  ghost: "text-ink-700 hover:bg-navy-900/[0.06]",
  danger:
    "bg-coral-500 text-white shadow-glow-coral hover:bg-coral-400 active:scale-[0.985]",
  violet:
    "bg-violet-500 text-white shadow-glow-violet hover:bg-violet-400 active:scale-[0.985]",
  glass:
    "border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:border-white/30 hover:bg-white/15",
};

const sizes = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-xl",
  icon: "h-11 w-11 rounded-xl",
};

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition-all duration-300 ease-spring disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
export default Button;
