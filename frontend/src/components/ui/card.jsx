import React from "react";
import { cn } from "../../lib/cn";

const tones = {
  white: "bg-white",
  glass: "bg-white/80 backdrop-blur-xl",
  canvas: "bg-canvas/70",
  dark: "!border-white/10 bg-navy-900 text-white",
  rose: "!border-coral-200 bg-coral-50/80",
  jade: "!border-mint-200 bg-mint-50/70",
  sun: "!border-amber-200 bg-amber-50/70",
  violet: "!border-violet-200 bg-violet-50/70",
  none: "",
};

export function Card({
  as: Tag = "section",
  className,
  hover,
  tone = "white",
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "card",
        tones[tone] ?? tones.white,
        hover && "card-hover",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ icon: Icon, title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="icon-chip">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
        )}
        <div>
          <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export default Card;
