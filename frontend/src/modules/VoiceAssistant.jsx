import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  AudioLines,
  Baby,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Hash,
  Info,
  Languages,
  Mic,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Stethoscope,
  Volume2,
  Wand2,
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

const EXAMPLES = [
  {
    label: "Newborn check",
    text: "Newborn visit. Baby weight 2.8 kg. Vaccination completed. Feeding well. Follow up after one month.",
  },
  {
    label: "Danger sign",
    text: "Pregnant woman 28 weeks. ANC checkup done. She has vaginal bleeding and severe abdominal pain since last night.",
  },
  {
    label: "Immunisation",
    text: "Immunisation visit for 6 week old baby. Polio drops given. Next visit after one month.",
  },
];

const GROUPS = [
  {
    title: "Visit details",
    icon: ClipboardList,
    fields: [
      { key: "visitDate", label: "Visit date", type: "date" },
      {
        key: "visitType",
        label: "Visit type",
        type: "select",
        options: ["pregnancy", "newborn", "immunisation", "general"],
      },
    ],
  },
  {
    title: "Clinical observations",
    icon: Stethoscope,
    fields: [
      { key: "newbornWeight", label: "Newborn weight", type: "number", step: "0.1" },
      {
        key: "weightUnit",
        label: "Weight unit",
        type: "select",
        options: ["kg", "lb"],
      },
      {
        key: "vaccinationStatus",
        label: "Vaccination status",
        type: "select",
        options: ["completed", "pending", "partial"],
      },
      { key: "vaccineName", label: "Vaccine name", type: "text" },
      { key: "pregnancyStatus", label: "Pregnancy status", type: "text" },
      { key: "gestationalAge", label: "Gestational age", type: "text" },
      { key: "observations", label: "Observations", type: "text" },
    ],
  },
  {
    title: "Next steps",
    icon: CalendarIcon,
    fields: [
      { key: "nextDueDate", label: "Next due date", type: "text" },
      { key: "followUpActions", label: "Follow-up actions", type: "text" },
    ],
  },
];

const SIGN_LABELS = {
  bleedingDuringPregnancy: "Bleeding during pregnancy",
  highFeverPregnancy: "High fever in pregnancy",
  highFeverNewborn: "High fever in newborn",
  difficultyBreathingNewborn: "Breathing difficulty (newborn)",
  newbornNotFeeding: "Newborn not feeding",
  lethargyNewborn: "Lethargic newborn",
  bleedingNewborn: "Cord / navel bleeding",
  severeAbdominalPain: "Severe abdominal pain",
  difficultyBreathing: "Difficulty breathing",
  heavyBleeding: "Heavy bleeding",
};

const CHECKS = [
  "Bleeding",
  "High fever",
  "Breathing",
  "Feeding",
  "Lethargy",
  "Cord bleeding",
];

function CalendarIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function isBlank(value) {
  return value === null || value === undefined || value === "";
}

function displayValue(value) {
  if (isBlank(value)) return "Unknown (not stated)";
  if (value === false) return "No";
  if (value === true) return "Yes";
  return String(value);
}

function buildReadBack(record) {
  if (!record) return "";
  const parts = [`Visit type: ${record.visitType || "unknown"}.`];
  GROUPS.forEach((group) => {
    group.fields.forEach((field) => {
      if (field.key === "visitType") return;
      const value = record[field.key];
      parts.push(
        isBlank(value)
          ? `${field.label}: not stated.`
          : `${field.label}: ${displayValue(value)}.`
      );
    });
  });
  return parts.join(" ");
}

function readVoiceSettings() {
  try {
    const raw = localStorage.getItem("asha-voicecare-settings");
    if (!raw) return { rate: 0.95, volume: 1 };
    const parsed = JSON.parse(raw);
    return {
      rate: Number(parsed.voiceSpeed) || 0.95,
      volume: Number.isFinite(parsed.voiceVolume) ? parsed.voiceVolume : 1,
    };
  } catch {
    return { rate: 0.95, volume: 1 };
  }
}

function StepRail({ record, saved }) {
  const steps = [
    { label: "Speak", hint: "Dictate or type" },
    { label: "Review", hint: "Check every field" },
    { label: "Confirm", hint: "Save + follow-up" },
  ];
  const current = saved ? 2 : record ? 1 : 0;

  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((step, index) => {
        const done = index < current || (saved && index === 2);
        const active = index === current && !saved;
        return (
          <li key={step.label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-all duration-500",
                  done
                    ? "bg-mint-500 text-navy-950 shadow-glow"
                    : active
                      ? "bg-navy-900 text-white shadow-soft ring-4 ring-navy-900/5"
                      : "border border-line bg-white text-muted"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-xs font-semibold sm:text-[13px]",
                    active || done ? "text-ink-900" : "text-muted"
                  )}
                >
                  {step.label}
                </span>
                <span className="hidden truncate text-[11px] text-muted sm:block">
                  {step.hint}
                </span>
              </span>
            </div>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "h-[2px] flex-1 rounded-full transition-colors duration-500",
                  index < current ? "bg-mint-300" : "bg-line"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FieldInput({ field, value, onChange }) {
  const inputClass = "input-base mt-1.5";
  const unknown = isBlank(value);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${field.key}`}
          className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted"
        >
          {field.label}
        </label>
        {unknown && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600">
            unknown
          </span>
        )}
      </div>

      {field.type === "select" ? (
        <select
          id={`field-${field.key}`}
          value={value ?? ""}
          onChange={(event) => onChange(field.key, event.target.value)}
          className={cn(inputClass, unknown && "text-muted")}
        >
          <option value="">Unknown (not stated)</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={`field-${field.key}`}
          type={field.type}
          step={field.step}
          value={value ?? ""}
          placeholder="Unknown (not stated)"
          autoComplete="off"
          onChange={(event) => onChange(field.key, event.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

export default function VoiceAssistant({ onNavigate }) {
  const [language, setLanguage] = React.useState(() => {
    try {
      const raw = localStorage.getItem("asha-voicecare-settings");
      const saved = raw ? JSON.parse(raw) : null;
      return LANGUAGES.some((item) => item.code === saved?.language)
        ? saved.language
        : "en";
    } catch {
      return "en";
    }
  });
  const [beneficiaryId, setBeneficiaryId] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [isRecording, setIsRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [record, setRecord] = React.useState(null);
  const [dangerSigns, setDangerSigns] = React.useState(null);
  const [analysis, setAnalysis] = React.useState("idle");
  const [error, setError] = React.useState("");
  const [saveState, setSaveState] = React.useState("idle");
  const [savedInfo, setSavedInfo] = React.useState(null);
  const [readBack, setReadBack] = React.useState("");
  const [sttNotice, setSttNotice] = React.useState("");
  const [speaking, setSpeaking] = React.useState(false);

  const recognitionRef = React.useRef(null);
  const finalTranscriptRef = React.useRef("");
  /* True while the user wants the mic on. Lets onend restart recognition
     after the browser stops it on its own (silence timeout, session limit). */
  const shouldListenRef = React.useRef(false);
  const restartCountRef = React.useRef(0);
  const lastStartRef = React.useRef(0);
  const restartTimerRef = React.useRef(0);
  const reviewRef = React.useRef(null);
  const dangerRef = React.useRef(null);
  const successRef = React.useRef(null);
  const meterRef = React.useRef({ ctx: null, stream: null, analyser: null, raf: 0 });
  const [levels, setLevels] = React.useState([]);

  const speechLang =
    LANGUAGES.find((item) => item.code === language)?.speech || "en-IN";

  /* Live microphone levels. Optional: if the browser or permission blocks it,
     speech recognition and the rest of the workflow keep working. */
  const stopMeter = React.useCallback(() => {
    const meter = meterRef.current;
    if (meter.raf) window.cancelAnimationFrame(meter.raf);
    meter.raf = 0;
    if (meter.stream) {
      meter.stream.getTracks().forEach((track) => track.stop());
    }
    meter.stream = null;
    if (meter.ctx && meter.ctx.state !== "closed") {
      meter.ctx.close().catch(() => {});
    }
    meter.ctx = null;
    meter.analyser = null;
    setLevels([]);
  }, []);

  const startMeter = React.useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      /* If the user already stopped while permission was pending, release it. */
      if (!shouldListenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);

      meterRef.current = { ctx, stream, analyser, raf: 0 };
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!meterRef.current.analyser) return;
        analyser.getByteFrequencyData(data);
        setLevels(Array.from(data, (value) => Math.max(0.1, value / 255)));
        meterRef.current.raf = window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* Level visualisation is decorative; never block the visit. */
    }
  }, []);

  React.useEffect(() => {
    if (!isRecording) return undefined;
    const timer = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isRecording]);

  React.useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      window.clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* already stopped */
        }
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      stopMeter();
    };
  }, [stopMeter]);

  React.useEffect(() => {
    if (saveState !== "saved") return undefined;
    const timer = window.setTimeout(() => {
      if (successRef.current) {
        successRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttNotice(
        "Live speech recognition is not available in this browser. Use Chrome or Edge, or type the notes below — everything else works the same."
      );
      return;
    }

    /* Make sure no previous session is still alive. */
    window.clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* already stopped */
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTranscriptRef.current = transcript ? `${transcript.trim()} ` : "";
    shouldListenRef.current = true;
    restartCountRef.current = 0;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interimText += result[0].transcript;
      }
      if (finalText) {
        finalTranscriptRef.current += finalText;
        setTranscript(finalTranscriptRef.current.trim());
        /* Real speech was heard, so the session is healthy. */
        restartCountRef.current = 0;
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      /* "no-speech" and "aborted" are normal pauses. onend restarts listening. */
      if (event.error === "no-speech" || event.error === "aborted") return;

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        shouldListenRef.current = false;
        setSttNotice(
          "Microphone permission was denied. Allow it in the browser (lock icon in the address bar), or type the notes instead."
        );
        setIsRecording(false);
        stopMeter();
        return;
      }

      if (event.error === "network") {
        shouldListenRef.current = false;
        setSttNotice(
          "Speech recognition needs an internet connection (the browser sends audio to its speech service). Check your connection, or type the notes instead."
        );
        setIsRecording(false);
        stopMeter();
        return;
      }

      if (event.error === "audio-capture") {
        shouldListenRef.current = false;
        setSttNotice(
          "No microphone was found. Connect one, or type the notes instead."
        );
        setIsRecording(false);
        stopMeter();
        return;
      }

      setSttNotice(
        `Speech recognition hiccup (${event.error}). Trying to continue — you can also type the notes.`
      );
    };

    recognition.onend = () => {
      setInterim("");

      /* The user did not press stop, so the browser ended the session
         (silence timeout or session limit). Start listening again. */
      if (shouldListenRef.current) {
        const ranFor = Date.now() - lastStartRef.current;
        restartCountRef.current =
          ranFor < 1500 ? restartCountRef.current + 1 : 0;

        if (restartCountRef.current > 6) {
          shouldListenRef.current = false;
          setIsRecording(false);
          stopMeter();
          setSttNotice(
            "Speech recognition keeps stopping. Check the microphone permission and your internet connection, or type the notes instead."
          );
          return;
        }

        restartTimerRef.current = window.setTimeout(() => {
          if (!shouldListenRef.current) return;
          try {
            lastStartRef.current = Date.now();
            recognition.start();
          } catch {
            /* start() throws if it is already running; safe to ignore */
          }
        }, 300);
        return;
      }

      setIsRecording(false);
      stopMeter();
    };

    recognitionRef.current = recognition;
    setSttNotice(
      "Browser speech recognition (demo mode). It keeps listening until you tap stop. Audio is handled by your browser's speech service, not by this app."
    );
    setElapsed(0);
    lastStartRef.current = Date.now();
    try {
      recognition.start();
    } catch {
      /* already started */
    }
    setIsRecording(true);
    /* Disabled: opening a second microphone stream (getUserMedia) stops
       speech recognition from receiving audio on Android Chrome and some
       Windows setups. The bars use the built-in wave animation instead. */
    // startMeter();
  };

  const stopRecording = () => {
    shouldListenRef.current = false;
    window.clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
    }
    setIsRecording(false);
    setInterim("");
    stopMeter();
  };

  const analyse = async () => {
    const text = transcript.trim();
    if (!text) {
      setError("Add or record a transcript first.");
      setAnalysis("error");
      return;
    }

    /* Stop listening before analysing so the transcript is not changing. */
    if (isRecording) stopRecording();

    setAnalysis("loading");
    setError("");
    setSaveState("idle");
    setSavedInfo(null);
    setReadBack("");

    try {
      const [signs, extracted] = await Promise.all([
        api.dangerSigns(text, language),
        api.extractEntities(text, language, beneficiaryId.trim()),
      ]);
      setDangerSigns(signs);
      setRecord(extracted);
      setReadBack(buildReadBack(extracted));
      setAnalysis("done");

      const detected = signs?.detected_signs || [];
      if (detected.length > 0) {
        toast(
          `${detected.length} danger sign${detected.length > 1 ? "s" : ""} detected`,
          {
            tone: "coral",
            description: "Refer to PHC. Alerts are never hidden.",
          }
        );
      }

      window.setTimeout(() => {
        const target = window.matchMedia("(min-width: 1024px)").matches
          ? reviewRef.current
          : dangerRef.current;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 250);
    } catch (err) {
      setError(
        `${err.message}. Is the backend running at ${API_BASE}? If it is hosted on Render's free tier it may be waking up, so wait about a minute and try again.`
      );
      setAnalysis("error");
    }
  };

  const updateField = (key, rawValue) => {
    setRecord((prev) => {
      if (!prev) return prev;
      let value = rawValue;
      if (key === "newbornWeight") {
        value = rawValue === "" ? null : Number(rawValue);
        if (Number.isNaN(value)) value = null;
      } else if (rawValue === "") {
        value = null;
      }
      const next = { ...prev, [key]: value };
      setReadBack(buildReadBack(next));
      return next;
    });
  };

  const speakReadBack = () => {
    const text = readBack || buildReadBack(record);
    setReadBack(text);
    if (!window.speechSynthesis) {
      setSttNotice(
        "Read-back voice is unavailable in this browser; the text below still works."
      );
      return;
    }
    const { rate, volume } = readVoiceSettings();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const confirmAndSave = async () => {
    if (!record) return;
    setSaveState("saving");
    setError("");
    try {
      const payload = {
        ...record,
        language,
        transcript: transcript.trim(),
        beneficiaryId: beneficiaryId.trim() || record.beneficiaryId,
        confirmationStatus: "confirmed",
      };
      const result = await api.saveRecord(payload);
      setSavedInfo(result);
      setSaveState("saved");
      toast("Record saved to the register", {
        tone: "mint",
        description: `${result.beneficiaryId} · follow-up scheduled automatically.`,
      });
    } catch (err) {
      setError(err.message);
      setSaveState("error");
    }
  };

  const resetAll = () => {
    if (isRecording) stopRecording();
    stopMeter();
    setTranscript("");
    setInterim("");
    setRecord(null);
    setDangerSigns(null);
    setReadBack("");
    setSavedInfo(null);
    setAnalysis("idle");
    setSaveState("idle");
    setError("");
    setSttNotice("");
    setElapsed(0);
  };

  const alerts = dangerSigns?.detected_signs || [];
  const urgentAlert = dangerSigns?.urgent_alert_details;
  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const saved = saveState === "saved";

  const selectedLanguage =
    LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];
  const isProcessing = analysis === "loading";
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(
    elapsed % 60
  ).padStart(2, "0")}`;
  const studioState = isRecording
    ? "Listening"
    : isProcessing
      ? "Structuring record"
      : saved
        ? "Saved to register"
        : speaking
          ? "Reading back"
          : "Ready to listen";

  const bars = Array.from({ length: 32 }, (_, index) => {
    if (isRecording && levels.length > 0) return levels[index % levels.length];
    if (isRecording) return 0.2 + ((index * 37) % 65) / 100;
    return 0.1 + ((index * 13) % 22) / 220;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Voice workflow"
        title="Voice visit"
        description="Speak or type the visit. The record is extracted, screened for danger signs, read back to you, and saved only after you confirm."
        actions={
          <>
            <Badge tone="violet" dot>
              {selectedLanguage.native}
            </Badge>
            <Badge tone="amber" dot>
              Demo mode
            </Badge>
          </>
        }
      />

      <Card className="p-4 sm:p-5">
        <StepRail record={record} saved={saved} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Voice studio */}
        <Card tone="dark" className="relative self-start overflow-hidden">
          <div
            aria-hidden="true"
            className="studio-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_75%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-mint-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
          />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-mint-300">
                  <Mic className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold leading-tight text-white">
                    Voice studio
                  </h2>
                  <p className="mt-0.5 text-[12px] text-white/45">
                    Speak naturally — we structure the visit as you talk.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/55">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isRecording
                      ? "animate-pulse bg-coral-400"
                      : isProcessing
                        ? "animate-pulse bg-violet-400"
                        : "bg-mint-400"
                  )}
                />
                {studioState}
              </span>
            </div>

            {/* Language */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  <Languages className="h-3.5 w-3.5" />
                  Language
                </p>
                <span className="text-[10px] font-medium text-white/30">
                  {selectedLanguage.speech}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LANGUAGES.map((item) => {
                  const active = language === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        /* Changing language mid-recording would keep the old one,
                           so stop first; the user taps the mic again. */
                        if (isRecording) stopRecording();
                        setLanguage(item.code);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-300",
                        active
                          ? "border-mint-400/40 bg-mint-500/15 text-mint-200"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {item.native}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Microphone */}
            <div className="mt-6 flex flex-col items-center">
              <div className="relative grid place-items-center">
                <span
                  aria-hidden="true"
                  className="absolute h-36 w-36 rounded-full bg-mint-500/10 blur-2xl"
                />
                {isRecording && (
                  <>
                    <span className="absolute h-32 w-32 animate-pulse-ring rounded-full border border-coral-400/40" />
                    <span
                      className="absolute h-32 w-32 animate-pulse-ring rounded-full border border-coral-400/25"
                      style={{ animationDelay: "0.8s" }}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  aria-pressed={isRecording}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  className={cn(
                    "group relative grid h-28 w-28 place-items-center rounded-full border text-white transition-all duration-500 ease-spring active:scale-95",
                    isRecording
                      ? "border-coral-300/30 bg-gradient-to-br from-coral-500 to-coral-600 shadow-glow-coral"
                      : "border-white/20 bg-gradient-to-br from-mint-400 via-mint-500 to-cyan-500 text-navy-950 shadow-glow hover:scale-[1.03]"
                  )}
                >
                  <span className="absolute inset-2 rounded-full border border-white/25" />
                  {isRecording ? (
                    <Square className="h-8 w-8 fill-current" />
                  ) : (
                    <Mic className="h-10 w-10" strokeWidth={1.7} />
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isRecording
                      ? "animate-pulse bg-coral-400"
                      : isProcessing
                        ? "animate-pulse bg-violet-400"
                        : "bg-mint-400"
                  )}
                />
                <span className="text-[11px] font-semibold tracking-wide text-white/75">
                  {studioState}
                </span>
                {isRecording && (
                  <span className="font-mono text-[11px] text-white/40">
                    {clock}
                  </span>
                )}
              </div>

              <div
                className="mt-4 flex h-14 items-center justify-center gap-[3px]"
                aria-hidden="true"
              >
                {bars.map((level, index) => (
                  <span
                    key={index}
                    className={cn(
                      "w-[3px] rounded-full bg-gradient-to-t from-mint-500 via-mint-400 to-cyan-300 transition-[height] duration-100 ease-out",
                      isRecording && levels.length === 0 && "animate-wave",
                      !isRecording && "opacity-40"
                    )}
                    style={{
                      height: `${Math.max(5, Math.round(level * 44))}px`,
                      animationDelay: `${(index % 10) * 0.08}s`,
                    }}
                  />
                ))}
              </div>

              <p className="mt-1 text-[11px] text-white/30">
                {isRecording
                  ? "Keeps listening until you tap stop — audio stays with your browser's speech service"
                  : `Tap to speak · ${selectedLanguage.name}`}
              </p>
            </div>

            {/* Live transcript */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-navy-950/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  <AudioLines className="h-3.5 w-3.5 text-mint-400" />
                  Live transcript
                </p>
                <span className="text-[10px] text-white/30">
                  {words} word{words === 1 ? "" : "s"} · editable
                </span>
              </div>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(event) => {
                  setTranscript(event.target.value);
                  /* Keep the recogniser's running text in sync with manual edits. */
                  finalTranscriptRef.current = event.target.value
                    ? `${event.target.value.trim()} `
                    : "";
                }}
                rows={4}
                placeholder="Example: Newborn visit. Baby weight 2.8 kg. Vaccination completed. Follow up after one month."
                className="mt-2 min-h-[96px] w-full resize-y bg-transparent text-[13.5px] leading-relaxed text-white/85 outline-none placeholder:text-white/25"
              />
              {interim && (
                <p
                  className="mt-1 text-[12px] italic text-mint-300/80"
                  aria-live="polite"
                >
                  Listening… {interim}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] pt-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/30">
                  Try
                </span>
                {EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => {
                      setTranscript(example.text);
                      finalTranscriptRef.current = `${example.text} `;
                      setAnalysis("idle");
                      setDangerSigns(null);
                      setRecord(null);
                      setSaveState("idle");
                      setSavedInfo(null);
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/55 transition-colors hover:border-mint-400/40 hover:bg-mint-500/10 hover:text-mint-200"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Beneficiary */}
            <div className="mt-4">
              <label
                htmlFor="beneficiary-id"
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40"
              >
                <Hash className="h-3.5 w-3.5" />
                Beneficiary ID
                <span className="font-medium normal-case tracking-normal text-white/25">
                  (optional)
                </span>
              </label>
              <input
                id="beneficiary-id"
                value={beneficiaryId}
                onChange={(event) => setBeneficiaryId(event.target.value)}
                placeholder="e.g. ASH-1025 — leave blank to auto-generate"
                autoComplete="off"
                className="input-dark mt-1.5"
              />
            </div>

            {sttNotice && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/45">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {sttNotice}
              </p>
            )}

            {analysis === "error" && error && (
              <p className="mt-3 rounded-xl border border-coral-400/30 bg-coral-500/10 p-3 text-[12px] text-coral-200">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={analyse}
                loading={isProcessing}
                className="w-full sm:flex-1"
                size="lg"
              >
                <Wand2 className="h-4 w-4" />
                {isProcessing
                  ? "Extracting & screening…"
                  : "Extract record & check danger signs"}
              </Button>
              <Button
                variant="glass"
                size="lg"
                onClick={resetAll}
                className="sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Right rail */}
        <div className="space-y-5">
          <Card
            ref={dangerRef}
            tone={alerts.length ? "rose" : "white"}
            className="scroll-mt-24 p-5"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white",
                    alerts.length
                      ? "bg-coral-500 shadow-glow-coral"
                      : analysis === "done"
                        ? "bg-mint-500 text-navy-950 shadow-glow"
                        : "bg-navy-900"
                  )}
                >
                  {alerts.length ? (
                    <ShieldAlert className="h-[18px] w-[18px]" />
                  ) : (
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  )}
                  {alerts.length > 0 && (
                    <span className="absolute inset-0 animate-pulse-ring rounded-xl border-2 border-coral-400" />
                  )}
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold leading-tight">
                    {alerts.length
                      ? `Danger sign${alerts.length > 1 ? "s" : ""} detected`
                      : analysis === "done"
                        ? "No danger sign matched"
                        : "Danger-sign check"}
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {alerts.length
                      ? "Refer — do not reassure."
                      : analysis === "done"
                        ? "Keep routine care and document findings."
                        : "Rule-based screening on every transcript."}
                  </p>
                </div>
              </div>
              {alerts.length > 0 && <Badge tone="coral">Urgent</Badge>}
            </div>

            {alerts.length > 0 ? (
              <>
                {urgentAlert && (
                  <p className="mt-3 rounded-xl border border-coral-200 bg-coral-100/60 p-3 text-[12.5px] font-semibold leading-relaxed text-coral-700">
                    {urgentAlert.message}
                  </p>
                )}
                <ul className="mt-3 space-y-2">
                  {alerts.map((alert) => (
                    <li
                      key={alert.sign}
                      className="flex items-start gap-2 rounded-xl border border-coral-100 bg-white/80 p-2.5"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-coral-700">
                          {SIGN_LABELS[alert.sign] || alert.sign}
                          <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-coral-500">
                            {alert.severity}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-coral-600">
                          {alert.message}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {analysis === "done"
                    ? "Checks run — no match"
                    : "Checks run on every transcript"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CHECKS.map((check) => (
                    <span
                      key={check}
                      className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600"
                    >
                      {check}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Screening aid only. Not a diagnosis, and alerts are never hidden.
            </p>
          </Card>

          {record && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                    <Volume2 className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div>
                    <h2 className="text-[14px] font-semibold leading-tight">
                      AI read-back
                    </h2>
                    <p className="text-[11px] text-muted">
                      What will be saved
                    </p>
                  </div>
                </div>
                <Badge tone={speaking ? "violet" : "neutral"} dot>
                  {speaking ? "Speaking" : "Ready"}
                </Badge>
              </div>
              <p className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-line bg-canvas/60 p-3 text-[12.5px] leading-relaxed text-ink-700">
                {readBack || buildReadBack(record)}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={speakReadBack}
              >
                <Volume2 className="h-4 w-4" />
                Play read-back
              </Button>
            </Card>
          )}

          <div className="rounded-2xl border border-white/10 bg-navy-900 p-5 text-white shadow-float">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <Sparkles className="h-4 w-4 text-violet-300" />
              What stays human
            </h2>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/55">
              {[
                "You confirm every record before it is stored.",
                "Unknown fields stay unknown — nothing is invented.",
                "No diagnosis and no prescriptions are generated.",
                "All data here is synthetic and stored in memory.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <ShieldCheck className="h-4 w-4 text-mint-600" />
              Where the data goes
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                {
                  label: "Microphone audio",
                  value: "Browser speech service",
                },
                {
                  label: "Transcript text",
                  value: "Your backend server only",
                },
                {
                  label: "Confirmed records",
                  value: "In-memory demo store",
                },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas/50 px-3 py-2"
                >
                  <span className="text-[11px] font-medium text-muted">
                    {row.label}
                  </span>
                  <span className="text-right text-[10.5px] font-semibold text-ink-800">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Review */}
      {record && (
        <Card ref={reviewRef} className="scroll-mt-24 overflow-hidden">
          {alerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-coral-600/40 bg-coral-500 px-5 py-3 text-white sm:px-6">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="text-[12.5px] font-semibold">
                  {alerts.length} danger sign{alerts.length > 1 ? "s" : ""} ·
                  refer, do not reassure
                </span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                {alerts.map((alert) => (
                  <span
                    key={alert.sign}
                    className="rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                  >
                    {SIGN_LABELS[alert.sign] || alert.sign}
                  </span>
                ))}
              </span>
              {urgentAlert && (
                <span className="ml-auto hidden text-[10.5px] font-medium text-white/80 sm:block">
                  Urgent referral recommended
                </span>
              )}
            </div>
          )}

          <div className="border-b border-line/80 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardHeader
                icon={ClipboardList}
                title="Review before saving"
                subtitle="Edit anything that is wrong. Blank fields remain unknown."
              />
              <Badge tone={saved ? "mint" : "amber"} dot>
                {saved ? "Saved" : "Not saved yet"}
              </Badge>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: "Beneficiary",
                  value: beneficiaryId.trim() || record.beneficiaryId,
                },
                {
                  label: "Language",
                  value: selectedLanguage.name,
                },
                {
                  label: "Source",
                  value: beneficiaryId.trim()
                    ? "Manual ID"
                    : "Auto-generated ID",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5"
                >
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-semibold">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title}>
                  <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-canvas text-ink-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {group.title}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.fields.map((field) => (
                      <FieldInput
                        key={field.key}
                        field={field}
                        value={record[field.key]}
                        onChange={updateField}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-line/80 bg-canvas/50 p-4 sm:p-5">
            {saved && savedInfo ? (
              <div
                className="animate-pop-in rounded-2xl border border-mint-200 bg-gradient-to-br from-mint-50 to-white p-5"
                ref={successRef}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint-500 text-navy-950 shadow-glow">
                    <Check className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-mint-800">
                      Saved {savedInfo.beneficiaryId} as a confirmed record
                    </p>
                    {savedInfo.followUp && (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-mint-700">
                        Follow-up created:{" "}
                        {savedInfo.followUp.visitType} visit · next{" "}
                        {savedInfo.followUp.nextVisitDate} · pending{" "}
                        {(savedInfo.followUp.pendingVaccinations || []).join(
                          ", "
                        ) || "none listed"}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="dark"
                        onClick={() => onNavigate && onNavigate("/followups")}
                      >
                        View follow-ups
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={resetAll}>
                        <Mic className="h-3.5 w-3.5" />
                        New visit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-relaxed text-muted">
                  Nothing is stored until you confirm. The backend is at{" "}
                  <code className="font-semibold text-ink-700">{API_BASE}</code>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={speakReadBack}>
                    <Volume2 className="h-4 w-4" />
                    Read back aloud
                  </Button>
                  <Button
                    onClick={confirmAndSave}
                    loading={saveState === "saving"}
                  >
                    <Save className="h-4 w-4" />
                    {saveState === "saving" ? "Saving…" : "Confirm & save"}
                  </Button>
                </div>
              </div>
            )}

            {saveState === "error" && error && (
              <p className="mt-3 rounded-xl border border-coral-200 bg-coral-50 p-3 text-sm text-coral-700">
                {error}
              </p>
            )}
          </div>
        </Card>
      )}

      {!record && analysis === "done" && (
        <Card tone="sun" className="flex items-center gap-3 p-4">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12.5px] text-amber-700">
            Transcript screened. No structured record was returned — try a
            longer note with a weight, vaccine, or visit type.
          </p>
        </Card>
      )}

      {!record && (
        <Card
          tone="glass"
          className="flex flex-col items-start gap-3 border-dashed p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="icon-chip">
              <Baby className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="text-[12.5px] text-muted">
              Tip: mention the visit type, weight, and next visit to get a
              complete record.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate && onNavigate("/records")}
          >
            See saved records
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>
      )}
    </div>
  );
}
