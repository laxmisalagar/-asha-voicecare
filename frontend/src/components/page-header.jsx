import React from "react";
import { cn } from "../lib/cn";

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="animate-fade-up">
        {eyebrow && (
          <p className="eyebrow mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-mint-500" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
