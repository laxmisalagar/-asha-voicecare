import React from "react";
import { cn } from "../../lib/cn";

const tones = {
  neutral: "border-line bg-navy-900/[0.04] text-ink-700",
  jade: "border-mint-200 bg-mint-50 text-mint-700",
  mint: "border-mint-200 bg-mint-50 text-mint-700",
  rose: "border-coral-200 bg-coral-50 text-coral-600",
  coral: "border-coral-200 bg-coral-50 text-coral-600",
  sun: "border-amber-200 bg-amber-50 text-amber-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  iris: "border-violet-200 bg-violet-50 text-violet-600",
  violet: "border-violet-200 bg-violet-50 text-violet-600",
  navy: "border-transparent bg-navy-900 text-white",
  dark: "border-transparent bg-navy-900 text-white",
  success: "border-success-100 bg-success-50 text-success-700",
  onDark: "border-white/15 bg-white/10 text-white/90 backdrop-blur-md",
};

export default function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone] || tones.neutral,
        className
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      )}
      {children}
    </span>
  );
}
