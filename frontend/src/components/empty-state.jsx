import React from "react";
import { cn } from "../lib/cn";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-900/12 bg-canvas/60 px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <span className="relative mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-white text-ink-600 shadow-soft">
          <Icon className="h-6 w-6" strokeWidth={1.6} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-mint-400 ring-2 ring-white" />
        </span>
      )}
      <h3 className="text-base font-semibold tracking-[-0.01em]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
