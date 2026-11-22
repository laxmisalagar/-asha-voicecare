import React from "react";
import {
  Baby,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Mic,
  RefreshCw,
  Syringe,
} from "lucide-react";
import { Card } from "../components/ui/card";
import Badge from "../components/ui/badge";
import { Button } from "../components/ui/button";
import Skeleton from "../components/ui/skeleton";
import EmptyState from "../components/empty-state";
import PageHeader from "../components/page-header";
import { api } from "../lib/api";
import { cn } from "../lib/cn";

const TYPE_META = {
  pregnancy: {
    label: "Pregnancy",
    icon: HeartPulse,
    chip: "border-violet-200 bg-violet-50 text-violet-600",
    dot: "bg-violet-500",
    tile: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  newborn: {
    label: "Newborn",
    icon: Baby,
    chip: "border-mint-200 bg-mint-50 text-mint-700",
    dot: "bg-mint-500",
    tile: "bg-mint-50 text-mint-700 ring-mint-100",
  },
  immunisation: {
    label: "Immunisation",
    icon: Syringe,
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    tile: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  general: {
    label: "General",
    icon: CalendarClock,
    chip: "border-line bg-canvas text-ink-700",
    dot: "bg-navy-500",
    tile: "bg-navy-900/[0.04] text-ink-700 ring-line",
  },
};

export default function FollowUps({ onNavigate }) {
  const [tasks, setTasks] = React.useState([]);
  const [state, setState] = React.useState("loading");
  const [error, setError] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setState("loading");
    setError("");
    try {
      const result = await api.followUps();
      setTasks(result.followUps || []);
      setState("ready");
    } catch (err) {
      setError(err.message);
      setState("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const counts = React.useMemo(() => {
    const base = {
      total: tasks.length,
      newborn: 0,
      pregnancy: 0,
      immunisation: 0,
    };
    tasks.forEach((task) => {
      if (base[task.visitType] !== undefined) base[task.visitType] += 1;
    });
    return base;
  }, [tasks]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Continuity of care"
        title="Follow-up queue"
        description="Generated when a visit is confirmed. Next visits and pending vaccinations, in one place."
        actions={
          <>
            <Badge tone="amber" dot>
              {tasks.length} open
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </>
        }
      />

      {state === "error" && (
        <Card
          tone="rose"
          className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-coral-700">
              Could not load follow-ups
            </p>
            <p className="mt-1 text-sm text-coral-600">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => load(true)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Open tasks",
            value: counts.total,
            icon: CalendarClock,
            tone: "bg-navy-900 text-white",
            accent: "text-navy-900",
          },
          {
            label: "Newborn",
            value: counts.newborn,
            icon: Baby,
            tone: "bg-mint-50 text-mint-700 ring-1 ring-mint-100",
            accent: "text-mint-700",
          },
          {
            label: "Pregnancy",
            value: counts.pregnancy,
            icon: HeartPulse,
            tone: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
            accent: "text-violet-600",
          },
          {
            label: "Immunisation",
            value: counts.immunisation,
            icon: Syringe,
            tone: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
            accent: "text-amber-600",
          },
        ].map((tile, index) => {
          const Icon = tile.icon;
          return (
            <Card
              key={tile.label}
              className={cn("animate-fade-up p-4", `stagger-${index + 1}`)}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    tile.tone
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {tile.label}
                </span>
              </div>
              <p
                className={cn(
                  "mt-2.5 font-display text-[26px] font-semibold leading-none tracking-[-0.03em]",
                  tile.accent
                )}
              >
                {state === "loading" ? "–" : tile.value}
              </p>
            </Card>
          );
        })}
      </div>

      {state === "loading" ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-32" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No follow-ups yet"
          description="Confirm a visit record and a follow-up task is generated automatically from the visit type."
          action={
            <Button onClick={() => onNavigate && onNavigate("/voice")}>
              <Mic className="h-4 w-4" />
              Start voice visit
            </Button>
          }
        />
      ) : (
        <ol className="relative space-y-3 pl-7 sm:pl-8">
          <span
            aria-hidden="true"
            className="timeline-line absolute bottom-6 left-[5px] top-6 w-px"
          />

          {tasks.map((task, index) => {
            const meta = TYPE_META[task.visitType] || TYPE_META.general;
            const Icon = meta.icon;
            const referred = task.referralStatus !== "none";

            return (
              <li
                key={`${task.beneficiaryId}-${index}`}
                className={cn(
                  "relative animate-fade-up",
                  `stagger-${Math.min(index, 4)}`
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -left-7 top-6 h-3 w-3 rounded-full ring-4 ring-canvas sm:-left-8",
                    meta.dot
                  )}
                />

                <Card hover className="overflow-hidden">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1",
                        meta.tile
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[15px] font-semibold tracking-[-0.01em]">
                          {task.beneficiaryId}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                            meta.chip
                          )}
                        >
                          {meta.label}
                        </span>
                        {referred && <Badge tone="coral" dot>Referred</Badge>}
                      </div>

                      {task.previousVisit && (
                        <p className="mt-0.5 text-[11px] text-muted">
                          Generated from visit on {task.previousVisit}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-amber-700">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Next: {task.nextVisitDate || "not scheduled"}
                        </span>

                        {(task.pendingVaccinations || []).map((vaccine) => (
                          <span
                            key={vaccine}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-700"
                          >
                            <Syringe className="h-3 w-3 text-amber-500" />
                            {vaccine}
                          </span>
                        ))}
                      </div>

                      {(task.pendingActions || []).length > 0 && (
                        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                          {task.pendingActions.map((action) => (
                            <li
                              key={action}
                              className="flex items-start gap-1.5 text-[11.5px] text-muted"
                            >
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <Badge
                      tone={referred ? "coral" : "mint"}
                      className="shrink-0 self-start"
                    >
                      {referred ? "Referred" : "Routine"}
                    </Badge>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {state === "ready" && tasks.length > 0 && (
        <p className="text-center text-[11px] text-muted">
          Follow-ups are generated from visit type and stay in memory for this
          demo.
        </p>
      )}
    </div>
  );
}
