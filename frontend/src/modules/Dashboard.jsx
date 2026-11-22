import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Baby,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Mic,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Syringe,
  Users,
} from "lucide-react";
import { Card } from "../components/ui/card";
import Badge from "../components/ui/badge";
import { Button } from "../components/ui/button";
import Skeleton from "../components/ui/skeleton";
import EmptyState from "../components/empty-state";
import { useScrollY } from "../hooks/useScrollY";
import { api } from "../lib/api";
import { cn } from "../lib/cn";

const VISIT_META = {
  pregnancy: {
    label: "Pregnancy",
    tone: "violet",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    tile: "bg-violet-50 text-violet-600 ring-violet-100",
    icon: HeartPulse,
  },
  newborn: {
    label: "Newborn",
    tone: "mint",
    dot: "bg-mint-500",
    bar: "bg-mint-500",
    tile: "bg-mint-50 text-mint-700 ring-mint-100",
    icon: Baby,
  },
  immunisation: {
    label: "Immunisation",
    tone: "amber",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    tile: "bg-amber-50 text-amber-600 ring-amber-100",
    icon: Syringe,
  },
  general: {
    label: "General",
    tone: "neutral",
    dot: "bg-navy-500",
    bar: "bg-navy-400",
    tile: "bg-navy-900/[0.04] text-ink-700 ring-line",
    icon: FileText,
  },
};

const STAT_TONES = {
  mint: {
    tile: "bg-mint-50 text-mint-700 ring-mint-100",
    accent: "bg-mint-500",
  },
  violet: {
    tile: "bg-violet-50 text-violet-600 ring-violet-100",
    accent: "bg-violet-500",
  },
  amber: {
    tile: "bg-amber-50 text-amber-600 ring-amber-100",
    accent: "bg-amber-500",
  },
  coral: {
    tile: "bg-coral-50 text-coral-600 ring-coral-100",
    accent: "bg-coral-500",
  },
};

function StatCard({ icon: Icon, label, value, hint, tone, loading, delay }) {
  const styles = STAT_TONES[tone] || STAT_TONES.mint;
  return (
    <Card
      hover
      className={cn("animate-fade-up p-5", delay)}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl ring-1",
            styles.tile
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        <ArrowUpRight className="h-4 w-4 text-navy-900/15" />
      </div>
      <p className="mt-4 font-display text-[32px] font-semibold leading-none tracking-[-0.04em] text-ink-900">
        {loading ? (
          <span className="skeleton inline-block h-8 w-16 align-middle" />
        ) : (
          value
        )}
      </p>
      <p className="mt-2 text-[13px] font-semibold text-ink-800">{label}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{hint}</p>
      <span
        aria-hidden="true"
        className={cn("mt-3 block h-1 w-9 rounded-full", styles.accent)}
      />
    </Card>
  );
}

function VisitMix({ mix, total, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3" />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-6" />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-canvas/60 p-4 text-[12px] leading-relaxed text-muted">
        No confirmed visits yet. The mix appears here after your first save.
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-canvas"
        role="img"
        aria-label={mix
          .map((item) => `${item.label} ${item.pct}%`)
          .join(", ")}
      >
        {mix.map((item) => (
          <span
            key={item.key}
            className={cn("h-full", item.bar)}
            style={{ width: `${item.pct}%` }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {mix.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex items-center gap-2.5">
              <span className={cn("h-2 w-2 rounded-full", item.dot)} />
              <Icon className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />
              <span className="text-[12px] font-medium text-ink-700">
                {item.label}
              </span>
              <span className="ml-auto text-[12px] font-semibold text-ink-900">
                {item.value}
              </span>
              <span className="w-9 text-right text-[11px] text-muted">
                {item.pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = React.useState(null);
  const [records, setRecords] = React.useState([]);
  const [followUps, setFollowUps] = React.useState([]);
  const [state, setState] = React.useState("loading");
  const [error, setError] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const scrollY = useScrollY();

  const load = React.useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setState("loading");
    setError("");
    try {
      const [statsResult, recordsResult, followResult] = await Promise.all([
        api.stats(),
        api.records(),
        api.followUps().catch(() => ({ followUps: [] })),
      ]);
      setStats(statsResult);
      setRecords(recordsResult.records || []);
      setFollowUps(followResult.followUps || []);
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

  const go = (path) => onNavigate && onNavigate(path);
  const loading = state === "loading";
  const urgent = stats?.urgentReferrals ?? 0;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const visitMix = React.useMemo(() => {
    const counts = {
      pregnancy: 0,
      newborn: 0,
      immunisation: 0,
      general: 0,
    };
    records.forEach((record) => {
      if (counts[record.visitType] !== undefined) counts[record.visitType] += 1;
      else counts.general += 1;
    });
    const total = records.length;
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        key,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
        ...VISIT_META[key],
      }));
  }, [records]);

  return (
    <div className="space-y-5">
      {/* Command-centre hero */}
      <section className="panel-navy px-5 py-7 sm:px-9 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-mint-500/20 blur-3xl"
          style={{ transform: `translate3d(0, ${scrollY * 0.05}px, 0)` }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
          style={{ transform: `translate3d(0, ${scrollY * -0.03}px, 0)` }}
        />
        <div
          aria-hidden="true"
          className="studio-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_75%_15%,black,transparent_68%)]"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.92fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="onDark" dot>
                {today}
              </Badge>
              <Badge tone="onDark">
                <ShieldCheck className="h-3 w-3 text-mint-300" />
                Safety rules on
              </Badge>
            </div>

            <h1 className="mt-5 font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.04em] sm:text-[42px]">
              Speak the visit.
              <br />
              <span className="text-gradient">
                We handle the paperwork.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/60 sm:text-sm">
              Record maternal and newborn visits by voice in five languages.
              Danger signs are checked by rules, the record is read back to you,
              and nothing is saved until you confirm.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => go("/voice")}
                className="w-full sm:w-auto"
              >
                <Mic className="h-5 w-5" />
                Start voice visit
              </Button>
              <Button
                size="lg"
                variant="glass"
                onClick={() => go("/records")}
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4" />
                View records
              </Button>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/45">
              {[
                "5 Indian languages",
                "Rule-based danger signs",
                "Read-back before save",
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-mint-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative"
            style={{ transform: `translate3d(0, ${scrollY * -0.015}px, 0)` }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-float backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  Live snapshot
                </p>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-mint-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint-400" />
                  </span>
                  Synced
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  {
                    label: "Confirmed records",
                    value: stats?.confirmedRecords ?? 0,
                    icon: ClipboardCheck,
                  },
                  {
                    label: "Open follow-ups",
                    value: stats?.followUps ?? 0,
                    icon: CalendarClock,
                  },
                  {
                    label: "Urgent referrals",
                    value: urgent,
                    icon: Siren,
                  },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-[12px] text-white/60">
                        <Icon className="h-3.5 w-3.5 text-white/35" />
                        {row.label}
                      </span>
                      <span className="font-display text-base font-semibold">
                        {loading ? "–" : row.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-white/[0.07] pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Visit mix
                  </p>
                  <p className="text-[10px] text-white/30">
                    {records.length} record{records.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                  {records.length === 0 ? (
                    <span className="h-full w-full bg-white/10" />
                  ) : (
                    visitMix.map((item) => (
                      <span
                        key={item.key}
                        className={cn("h-full", item.bar)}
                        style={{ width: `${item.pct}%` }}
                      />
                    ))
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {visitMix.map((item) => (
                    <span
                      key={item.key}
                      className="flex items-center gap-1 text-[10px] text-white/45"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", item.dot)} />
                      {item.label} {item.value}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-white/30">
                In-memory demo store. Data resets when the backend restarts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {state === "error" && (
        <Card tone="rose" className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-semibold text-coral-700">
                <ShieldAlert className="h-4 w-4" />
                Backend not reachable
              </p>
              <p className="mt-1 text-sm text-coral-600">
                Start it with <code className="font-semibold">python main.py</code>{" "}
                in the backend folder, then retry. ({error})
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => load(true)}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={Users}
          label="Beneficiaries"
          value={stats?.totalBeneficiaries ?? 0}
          hint="Distinct IDs in the register"
          tone="mint"
          loading={loading}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Confirmed records"
          value={stats?.confirmedRecords ?? 0}
          hint="Saved after read-back"
          tone="violet"
          loading={loading}
          delay="stagger-1"
        />
        <StatCard
          icon={CalendarClock}
          label="Open follow-ups"
          value={stats?.followUps ?? 0}
          hint="Generated on confirmation"
          tone="amber"
          loading={loading}
          delay="stagger-2"
        />
        <StatCard
          icon={Siren}
          label="Urgent referrals"
          value={urgent}
          hint="Flagged by danger-sign rules"
          tone="coral"
          loading={loading}
          delay="stagger-3"
        />
      </div>

      {urgent > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-coral-200 bg-gradient-to-r from-coral-50 via-white to-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral-500 text-white shadow-glow-coral">
                <Siren className="h-5 w-5" />
                <span className="absolute inset-0 animate-pulse-ring rounded-xl border-2 border-coral-400" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-coral-700">
                  {urgent} record{urgent > 1 ? "s" : ""} flagged for PHC referral
                </p>
                <p className="mt-0.5 text-[12.5px] text-coral-600">
                  Rule-based danger signs. Alerts are never hidden or softened.
                </p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => go("/records")}>
              Review records
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        {/* Recent records */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="icon-chip">
                <FileText className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">
                  Recent confirmed records
                </h2>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  Only records you explicitly confirmed are stored.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => go("/records")}
              >
                All records
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 space-y-2.5">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-14" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={Mic}
              title="No confirmed records yet"
              description="Run a voice visit, review the extracted fields, then confirm to create the first record."
              action={
                <Button onClick={() => go("/voice")}>
                  <Mic className="h-4 w-4" />
                  Start voice visit
                </Button>
              }
            />
          ) : (
            <div className="mt-4">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <th className="pb-3 pr-4 font-semibold">Beneficiary</th>
                      <th className="pb-3 pr-4 font-semibold">Visit</th>
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 pr-4 font-semibold">Weight</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 8).map((record) => {
                      const meta =
                        VISIT_META[record.visitType] || VISIT_META.general;
                      return (
                        <tr
                          key={record.beneficiaryId}
                          className="group border-t border-line/70 text-[13px] transition-colors hover:bg-canvas/70"
                        >
                          <td className="py-3.5 pr-4">
                            <span className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "grid h-8 w-8 place-items-center rounded-lg ring-1",
                                  meta.tile
                                )}
                              >
                                <meta.icon className="h-4 w-4" strokeWidth={1.8} />
                              </span>
                              <span className="font-semibold text-ink-900">
                                {record.beneficiaryId}
                              </span>
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </td>
                          <td className="py-3.5 pr-4 text-muted">
                            {record.visitDate}
                          </td>
                          <td className="py-3.5 pr-4">
                            {record.newbornWeight ? (
                              <span className="font-medium">
                                {record.newbornWeight}{" "}
                                {record.weightUnit || ""}
                              </span>
                            ) : (
                              <span className="text-muted/60">Unknown</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <Badge tone="mint" dot>
                              {record.confirmationStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-2 md:hidden">
                {records.slice(0, 6).map((record) => {
                  const meta =
                    VISIT_META[record.visitType] || VISIT_META.general;
                  return (
                    <li
                      key={record.beneficiaryId}
                      className="flex items-center gap-3 rounded-xl border border-line/80 bg-white p-3"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1",
                          meta.tile
                        )}
                      >
                        <meta.icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold">
                          {record.beneficiaryId}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {record.visitDate} ·{" "}
                          {record.newbornWeight
                            ? `${record.newbornWeight} ${record.weightUnit || ""}`
                            : "Weight unknown"}
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>

        {/* Right rail */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <Sparkles className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold leading-tight">
                    Visit mix
                  </h2>
                  <p className="text-[11px] text-muted">
                    Confirmed visits by type
                  </p>
                </div>
              </div>
              <Badge tone="violet">Live</Badge>
            </div>
            <div className="mt-4">
              <VisitMix mix={visitMix} total={records.length} loading={loading} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <CalendarClock className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold leading-tight">
                    Follow-up load
                  </h2>
                  <p className="text-[11px] text-muted">
                    Generated on confirmation
                  </p>
                </div>
              </div>
              <Badge tone="amber">{followUps.length} open</Badge>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2">
                {[0, 1].map((row) => (
                  <Skeleton key={row} className="h-12" />
                ))}
              </div>
            ) : followUps.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line bg-canvas/60 p-3.5 text-[12px] leading-relaxed text-muted">
                No follow-ups yet. Confirm a visit and the next step is scheduled
                automatically.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {followUps.slice(0, 3).map((task, index) => {
                  const meta =
                    VISIT_META[task.visitType] || VISIT_META.general;
                  return (
                    <li
                      key={`${task.beneficiaryId}-${index}`}
                      className="rounded-xl border border-line/80 bg-canvas/50 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold">
                          {task.beneficiaryId}
                        </p>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {task.nextVisitDate || "Not scheduled"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                          {meta.label}
                        </span>
                        {(task.pendingVaccinations || [])
                          .slice(0, 2)
                          .map((vaccine) => (
                            <span
                              key={vaccine}
                              className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-700"
                            >
                              {vaccine}
                            </span>
                          ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-between"
              onClick={() => go("/followups")}
            >
              Open follow-up queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>

          <div className="rounded-2xl border border-white/10 bg-navy-900 p-5 text-white shadow-float">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <Sparkles className="h-4 w-4 text-violet-300" />
              Human-in-the-loop
            </h2>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/55">
              {[
                "You confirm every record before it is stored.",
                "Unknown fields stay unknown — nothing is invented.",
                "Alerts are rule-based and never suppressed.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="relative grid gap-3 sm:grid-cols-3">
        <span
          aria-hidden="true"
          className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-mint-300 via-cyan-300 to-violet-300 sm:block"
        />
        {[
          {
            step: "01",
            title: "Speak",
            body: "Dictate in Kannada, Hindi, Tamil, Telugu or English.",
            icon: Mic,
            tone: "mint",
          },
          {
            step: "02",
            title: "Review",
            body: "Edit the extracted fields. Blanks stay unknown.",
            icon: ClipboardCheck,
            tone: "violet",
          },
          {
            step: "03",
            title: "Confirm",
            body: "Read-back, then save. Follow-ups generate automatically.",
            icon: CheckCircle2,
            tone: "amber",
          },
        ].map((item) => {
          const Icon = item.icon;
          const styles = STAT_TONES[item.tone];
          return (
            <div
              key={item.step}
              className="relative flex items-start gap-3 rounded-2xl border border-line/80 bg-white p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
            >
              <span
                className={cn(
                  "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1",
                  styles.tile
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                  {item.title}
                  <span className="text-[10px] font-bold text-muted/60">
                    {item.step}
                  </span>
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Follow-up queue",
            body: "Next visits and pending vaccines.",
            path: "/followups",
            icon: CalendarClock,
          },
          {
            title: "Voice assistant",
            body: "Record the next visit hands-free.",
            path: "/voice",
            icon: Mic,
          },
          {
            title: "Settings & status",
            body: "Language, read-back voice, API health.",
            path: "/settings",
            icon: ShieldCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => go(item.path)}
              className="group flex items-center gap-3 rounded-2xl border border-line/80 bg-white p-4 text-left shadow-soft transition-all duration-500 ease-spring hover:-translate-y-1 hover:border-mint-200 hover:shadow-lift"
            >
              <span className="icon-chip transition-colors group-hover:border-mint-200 group-hover:bg-mint-50 group-hover:text-mint-700">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted">
                  {item.body}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-navy-900/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-mint-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
