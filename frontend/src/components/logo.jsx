import React from "react";
import { cn } from "../lib/cn";

export default function Logo({ className, compact = false }) {
  return (
    <div
      className={cn(
        "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-mint-400 via-mint-500 to-cyan-500 text-navy-950 shadow-[0_8px_20px_-8px_rgba(22,214,176,0.7)]",
        compact && "h-9 w-9 rounded-[10px]",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M3.5 12h1.7M8 8.4v7.2M12 5.2v13.6M16 9v6M20.5 12h-1.6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ring-white/90" />
    </div>
  );
}
