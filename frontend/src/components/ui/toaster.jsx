import React from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { TOAST_EVENT } from "../../lib/toast";
import { cn } from "../../lib/cn";

const TONES = {
  mint: {
    icon: CheckCircle2,
    tile: "bg-mint-50 text-mint-700 ring-mint-200",
    bar: "bg-mint-500",
  },
  violet: {
    icon: Sparkles,
    tile: "bg-violet-50 text-violet-600 ring-violet-200",
    bar: "bg-violet-500",
  },
  coral: {
    icon: AlertTriangle,
    tile: "bg-coral-50 text-coral-600 ring-coral-200",
    bar: "bg-coral-500",
  },
  amber: {
    icon: CalendarClock,
    tile: "bg-amber-50 text-amber-600 ring-amber-200",
    bar: "bg-amber-500",
  },
};

export default function Toaster() {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    const onToast = (event) => {
      const detail = event.detail || {};
      if (!detail.message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setItems((prev) => [...prev.slice(-2), { ...detail, id }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, detail.duration || 3800);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0"
    >
      {items.map((item) => {
        const tone = TONES[item.tone] || TONES.mint;
        const Icon = tone.icon;
        return (
          <div
            key={item.id}
            role="status"
            className="toast-shell pointer-events-auto relative animate-toast-in overflow-hidden"
          >
            <span
              aria-hidden="true"
              className={cn("absolute inset-y-0 left-0 w-1", tone.bar)}
            />
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1",
                tone.tile
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-ink-900">
                {item.message}
              </p>
              {item.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() =>
                setItems((prev) => prev.filter((entry) => entry.id !== item.id))
              }
              className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
