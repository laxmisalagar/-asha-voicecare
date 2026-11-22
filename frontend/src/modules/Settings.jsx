import React from "react";
import {
  BellRing,
  CheckCircle2,
  Database,
  Gauge,
  Globe2,
  Languages,
  Play,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardHeader } from "../components/ui/card";
import Badge from "../components/ui/badge";
import { Button } from "../components/ui/button";
import PageHeader from "../components/page-header";
import { api, API_BASE } from "../lib/api";
import { cn } from "../lib/cn";
import { toast } from "../lib/toast";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", speech: "en-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speech: "te-IN" },
];

const DEFAULTS = {
  language: "en",
  voiceSpeed: 1,
  voiceVolume: 1,
  notifications: true,
};

const STORAGE_KEY = "asha-voicecare-settings";

const SAMPLES = {
  en: "Visit recorded. Weight 2.8 kilograms. Follow up after one month.",
  kn: "ಭೇಟಿ ದಾಖಲಾಗಿದೆ. ತೂಕ ಎರಡು ಪಾಯಿಂಟ್ ಎಂಟು ಕಿಲೋಗ್ರಾಂ.",
  hi: "यात्रा दर्ज हो गई। वजन दो पॉइंट आठ किलोग्राम।",
  ta: "வருகை பதிவு செய்யப்பட்டது. எடை இரண்டு புள்ளி எட்டு கிலோ.",
  te: "సందర్శన నమోదు అయింది. బరువు రెండు పాయింట్ ఎనిమిది కిలోలు.",
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-300 ease-spring",
        checked
          ? "border-mint-500/30 bg-mint-500 shadow-glow"
          : "border-line bg-navy-900/10 hover:bg-navy-900/15"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform duration-300 ease-spring",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function Slider({ id, label, valueLabel, min, max, step, value, onChange, low, high }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </label>
        <span className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-800">
          {valueLabel}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="mt-3"
      />
      <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-[0.1em] text-muted/70">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = React.useState(loadSettings);
  const [backend, setBackend] = React.useState("checking");
  const [checkedAt, setCheckedAt] = React.useState(null);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const checkBackend = React.useCallback(() => {
    setBackend("checking");
    api
      .health()
      .then(() => {
        setBackend("online");
        setCheckedAt(new Date());
      })
      .catch(() => {
        setBackend("offline");
        setCheckedAt(new Date());
      });
  }, []);

  React.useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const update = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const selectedLanguage =
    LANGUAGES.find((item) => item.code === settings.language) || LANGUAGES[0];

  const playSample = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      SAMPLES[settings.language] || SAMPLES.en
    );
    utterance.lang = selectedLanguage.speech;
    utterance.rate = settings.voiceSpeed;
    utterance.volume = settings.voiceVolume;
    window.speechSynthesis.speak(utterance);
  };

  const resetDefaults = () => {
    setSettings(DEFAULTS);
    toast("Preferences reset to defaults", {
      tone: "violet",
      description: "Language, voice and reminders restored.",
    });
  };

  const backendTone =
    backend === "online" ? "mint" : backend === "offline" ? "coral" : "neutral";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Tune language and read-back voice. Stored in this browser only — this demo has no accounts."
        actions={
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
        }
      />

      {/* Current preference summary */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-3">
        {[
          {
            label: "Default language",
            value: selectedLanguage.native,
            hint: selectedLanguage.speech,
            icon: Globe2,
            tile: "bg-violet-50 text-violet-600 ring-violet-100",
          },
          {
            label: "Read-back voice",
            value: `${settings.voiceSpeed.toFixed(1)}× · ${Math.round(
              settings.voiceVolume * 100
            )}%`,
            hint: "Speed · volume",
            icon: Volume2,
            tile: "bg-mint-50 text-mint-700 ring-mint-100",
          },
          {
            label: "Visit reminders",
            value: settings.notifications ? "On" : "Off",
            hint: "Highlight due follow-ups",
            icon: BellRing,
            tile: "bg-amber-50 text-amber-600 ring-amber-100",
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className={cn("animate-fade-up p-4", `stagger-${index + 1}`)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1",
                    item.tile
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-[13.5px] font-semibold text-ink-900">
                    {item.value}
                  </p>
                  <p className="truncate text-[10.5px] text-muted">{item.hint}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={Languages}
              title="Default language"
              subtitle="Used for new voice visits and spoken read-back."
              action={<Badge tone="violet">{selectedLanguage.native}</Badge>}
            />

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LANGUAGES.map((language) => {
                const active = settings.language === language.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => update("language", language.code)}
                    aria-pressed={active}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ease-spring hover:-translate-y-0.5",
                      active
                        ? "border-mint-300 bg-mint-50/70 shadow-soft ring-1 ring-mint-200"
                        : "border-line bg-white hover:border-navy-900/15 hover:shadow-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-[14px] font-semibold leading-tight",
                        active ? "text-mint-800" : "text-ink-900"
                      )}
                    >
                      {language.native}
                    </span>
                    <span className="mt-0.5 block text-[10.5px] text-muted">
                      {language.name} · {language.speech}
                    </span>
                    <span
                      className={cn(
                        "absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full transition-all duration-300",
                        active
                          ? "bg-mint-500 text-navy-950"
                          : "border border-line bg-white text-transparent"
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.6} />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
              Speech recognition runs through your browser and is labelled demo
              mode in the voice workflow.
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={Volume2}
              title="Read-back voice"
              subtitle="Applies to spoken read-back in the voice workflow."
              action={
                <Button variant="secondary" size="sm" onClick={playSample}>
                  <Play className="h-3.5 w-3.5" />
                  Test voice
                </Button>
              }
            />

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Slider
                id="voice-speed"
                label="Speed"
                valueLabel={`${settings.voiceSpeed.toFixed(1)}×`}
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(event) =>
                  update("voiceSpeed", Number(event.target.value))
                }
                low="Slow"
                high="Fast"
              />
              <Slider
                id="voice-volume"
                label="Volume"
                valueLabel={`${Math.round(settings.voiceVolume * 100)}%`}
                min="0"
                max="1"
                step="0.1"
                value={settings.voiceVolume}
                onChange={(event) =>
                  update("voiceVolume", Number(event.target.value))
                }
                low="Mute"
                high="Max"
              />
            </div>

            <div className="mt-5 rounded-xl border border-line bg-canvas/60 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                <Gauge className="h-3 w-3" />
                Sample read-back
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">
                “{SAMPLES[settings.language] || SAMPLES.en}”
              </p>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="icon-chip">
                  <BellRing className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold leading-tight tracking-[-0.01em]">
                    Visit reminders
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    Highlight follow-ups that are due. No messages are sent in
                    this demo.
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {settings.notifications ? "Due visits highlighted" : "Reminders hidden"}
                  </span>
                </div>
              </div>
              <Switch
                checked={settings.notifications}
                onChange={(value) => update("notifications", value)}
                label="Visit reminders"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={ServerCog}
              title="Backend connection"
              subtitle="Health check against the FastAPI service."
              action={
                <Badge tone={backendTone} dot>
                  {backend === "online"
                    ? "Reachable"
                    : backend === "offline"
                      ? "Offline"
                      : "Checking"}
                </Badge>
              }
            />

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5">
                <span className="text-[11px] font-medium text-muted">
                  Endpoint
                </span>
                <code className="truncate text-[11.5px] font-semibold text-ink-800">
                  {API_BASE}
                </code>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5">
                <span className="text-[11px] font-medium text-muted">
                  Last checked
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-ink-800">
                  {checkedAt
                    ? checkedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "mt-3 flex items-start gap-2 rounded-xl border p-3 text-[11.5px] leading-relaxed",
                backend === "online"
                  ? "border-mint-200 bg-mint-50 text-mint-700"
                  : backend === "offline"
                    ? "border-coral-200 bg-coral-50 text-coral-600"
                    : "border-line bg-canvas/70 text-muted"
              )}
              aria-live="polite"
            >
              {backend === "offline" ? (
                <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>
                {backend === "online"
                  ? "Records, follow-ups and extraction are live."
                  : backend === "offline"
                    ? 'Start the API with "python main.py" in the backend folder, then retry.'
                    : "Contacting the API…"}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={checkBackend}
              loading={backend === "checking"}
            >
              <ServerCog className="h-3.5 w-3.5" />
              Check again
            </Button>
          </Card>

          <div className="panel-navy p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-mint-500/15 blur-3xl"
            />
            <h2 className="relative flex items-center gap-2 text-[15px] font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-mint-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Safety boundaries
            </h2>
            <ul className="relative mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-white/55">
              {[
                "No diagnosis and no prescriptions are generated.",
                "Unknown values are never filled in by inference.",
                "Danger-sign alerts are rule-based and cannot be dismissed.",
                "Speech recognition runs through the browser, labelled demo mode.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="relative mt-4 flex items-center gap-1.5 border-t border-white/[0.07] pt-3 text-[10px] text-white/30">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Screening aid only — human confirmation is required before saving.
            </p>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="icon-chip">
                <Database className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                  Demo storage
                </h2>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  Records and follow-ups live in backend memory and reset when
                  the API restarts. Preferences here are stored in this
                  browser's local storage.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">In-memory store</Badge>
                  <Badge tone="neutral">localStorage preferences</Badge>
                  <Badge tone="neutral">Synthetic data</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
