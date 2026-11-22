import React from "react";
import {
  Baby,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  FileText,
  HeartPulse,
  RefreshCw,
  Search,
  ShieldCheck,
  Syringe,
  UserRound,
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
    tone: "violet",
    chip: "border-violet-200 bg-violet-50 text-violet-600",
    tile: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  newborn: {
    label: "Newborn",
    icon: Baby,
    tone: "mint",
    chip: "border-mint-200 bg-mint-50 text-mint-700",
    tile: "bg-mint-50 text-mint-700 ring-mint-100",
  },
  immunisation: {
    label: "Immunisation",
    icon: Syringe,
    tone: "amber",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    tile: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  general: {
    label: "General",
    icon: FileText,
    tone: "neutral",
    chip: "border-line bg-canvas text-ink-700",
    tile: "bg-navy-900/[0.04] text-ink-700 ring-line",
  },
};

const DETAIL_FIELDS = [
  ["visitDate", "Visit date"],
  ["visitType", "Visit type"],
  ["newbornWeight", "Newborn weight"],
  ["weightUnit", "Weight unit"],
  ["vaccinationStatus", "Vaccination status"],
  ["vaccineName", "Vaccine"],
  ["nextDueDate", "Next due"],
  ["pregnancyStatus", "Pregnancy status"],
  ["gestationalAge", "Gestational age"],
  ["observations", "Observations"],
  ["followUpActions", "Follow-up actions"],
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pregnancy", label: "Pregnancy" },
  { key: "newborn", label: "Newborn" },
  { key: "immunisation", label: "Immunisation" },
];

function valueOrUnknown(value, key) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted/60">Unknown (not stated)</span>;
  }
  const text = String(value);
  if (key === "visitType" && TYPE_META[text]) return TYPE_META[text].label;
  if (key === "vaccinationStatus") {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  if (
    text.length <= 3 ||
    /^\d{4}-\d{2}-\d{2}$/.test(text) ||
    /^\d+(\.\d+)?$/.test(text)
  ) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function VisitRecords({ onNavigate }) {
  const [records, setRecords] = React.useState([]);
  const [state, setState] = React.useState("loading");
  const [error, setError] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setState("loading");
    setError("");
    try {
      const result = await api.records();
      setRecords(result.records || []);
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

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (filter !== "all" && record.visitType !== filter) return false;
      if (!needle) return true;
      return [
        record.beneficiaryId,
        record.transcript,
        record.visitType,
        record.observations,
        record.vaccineName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [records, filter, query]);

  const counts = React.useMemo(() => {
    const base = {
      all: records.length,
      pregnancy: 0,
      newborn: 0,
      immunisation: 0,
    };
    records.forEach((record) => {
      if (base[record.visitType] !== undefined) base[record.visitType] += 1;
    });
    return base;
  }, [records]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Register"
        title="Health records"
        description="Confirmed records only. Every entry below was read back and saved by the ASHA worker."
        actions={
          <>
            <Badge tone="mint" dot>
              {records.length} confirmed
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
              Could not load records
            </p>
            <p className="mt-1 text-sm text-coral-600">
              {error}. Check that the backend is running on port 8000.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => load(true)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, transcript, vaccine…"
              aria-label="Search records"
              className="input-base pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={cn(
                  "chip shrink-0",
                  filter === item.key && "chip-active"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold",
                    filter === item.key
                      ? "bg-white/20 text-white"
                      : "bg-navy-900/[0.06] text-muted"
                  )}
                >
                  {counts[item.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {state === "loading" ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-24" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={records.length === 0 ? "No visit records yet" : "No matches"}
          description={
            records.length === 0
              ? "Start a voice visit, review the extracted fields, and confirm to create the first record."
              : "Try a different search term or filter."
          }
          action={
            records.length === 0 ? (
              <Button onClick={() => onNavigate && onNavigate("/voice")}>
                Start voice visit
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((record, index) => {
            const meta = TYPE_META[record.visitType] || TYPE_META.general;
            const Icon = meta.icon;
            const open = selected === record.beneficiaryId;

            return (
              <li
                key={record.beneficiaryId}
                className={cn(
                  "animate-fade-up",
                  `stagger-${Math.min(index, 4)}`
                )}
              >
                <Card
                  hover
                  className={cn(
                    "overflow-hidden transition-colors",
                    open && "ring-2 ring-mint-500/25"
                  )}
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
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
                          {record.beneficiaryId}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                            meta.chip
                          )}
                        >
                          {meta.label}
                        </span>
                        <Badge tone="mint" dot>
                          {record.confirmationStatus}
                        </Badge>
                      </div>

                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {record.visitDate}
                        </span>
                        {record.newbornWeight ? (
                          <span className="font-medium text-ink-700">
                            {record.newbornWeight} {record.weightUnit || "kg"}
                          </span>
                        ) : (
                          <span>Weight not stated</span>
                        )}
                        {record.vaccineName && (
                          <span className="inline-flex items-center gap-1">
                            <Syringe className="h-3.5 w-3.5" />
                            {record.vaccineName}
                          </span>
                        )}
                        {record.nextDueDate && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Next {record.nextDueDate}
                          </span>
                        )}
                      </p>

                      {record.transcript && (
                        <p className="mt-1.5 line-clamp-1 text-[11.5px] italic text-muted/80">
                          “{record.transcript}”
                        </p>
                      )}
                    </div>

                    <Button
                      variant={open ? "dark" : "secondary"}
                      size="sm"
                      onClick={() =>
                        setSelected(open ? null : record.beneficiaryId)
                      }
                      aria-expanded={open}
                      className="shrink-0 self-start sm:self-center"
                    >
                      {open ? "Hide" : "Details"}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-300",
                          open && "rotate-180"
                        )}
                      />
                    </Button>
                  </div>

                  {open && (
                    <div className="animate-fade-up border-t border-line/80 bg-canvas/50 p-4 sm:p-5">
                      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-mint-50 text-mint-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-[12.5px] italic leading-relaxed text-ink-700">
                          “{record.transcript || "No transcript stored."}”
                        </p>
                      </div>

                      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {DETAIL_FIELDS.map(([key, label]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-line bg-white px-3.5 py-2.5"
                          >
                            <dt className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                              {label}
                            </dt>
                            <dd className="mt-0.5 text-[12.5px] font-medium text-ink-900">
                              {valueOrUnknown(record[key], key)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {state === "ready" && records.length > 0 && (
        <p className="text-center text-[11px] text-muted">
          Showing {visible.length} of {records.length} confirmed records ·
          stored in memory for this demo
        </p>
      )}
    </div>
  );
}
