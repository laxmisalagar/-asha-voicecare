import React from "react";
import {
  CalendarClock,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Mic,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import Background from "./components/background";
import Logo from "./components/logo";
import { Button } from "./components/ui/button";
import Toaster from "./components/ui/toaster";
import { cn } from "./lib/cn";
import { api } from "./lib/api";
import Dashboard from "./modules/Dashboard";
import VoiceAssistant from "./modules/VoiceAssistant";
import VisitRecords from "./modules/VisitRecords";
import FollowUps from "./modules/FollowUps";
import Settings from "./modules/Settings";
import LoginPage from "./modules/LoginPage";

const ROUTES = [
  {
    path: "/",
    label: "Dashboard",
    short: "Home",
    icon: LayoutDashboard,
    component: Dashboard,
    group: "Workspace",
  },
  {
    path: "/voice",
    label: "Voice visit",
    short: "Voice",
    icon: Mic,
    component: VoiceAssistant,
    group: "Workspace",
    badge: "AI",
  },
  {
    path: "/records",
    label: "Health records",
    short: "Records",
    icon: FileText,
    component: VisitRecords,
    group: "Workspace",
  },
  {
    path: "/followups",
    label: "Follow-ups",
    short: "Follow-ups",
    icon: CalendarClock,
    component: FollowUps,
    group: "Workspace",
  },
  {
    path: "/settings",
    label: "Settings",
    short: "Settings",
    icon: Settings2,
    component: Settings,
    group: "System",
  },
];

/* Mobile keeps the voice action in the centre of the tab bar. */
const MOBILE_ROUTES = [
  ROUTES[0],
  ROUTES[2],
  ROUTES[1],
  ROUTES[3],
  ROUTES[4],
];

function readRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  return ROUTES.some((route) => route.path === hash) ? hash : "/";
}

export default function App() {
  /* --- Authentication State --- */
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);

  /* Check localStorage session on mount */
  React.useEffect(() => {
    const userStr = localStorage.getItem("asha-voicecare-user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem("asha-voicecare-user");
      }
    }
    setIsLoadingAuth(false);
  }, []);

  /* Notify all parts of auth state changes */
  React.useEffect(() => {
    // Could broadcast to context, but for now just console-log
    // In a real app: set context value, persist session, etc.
  }, [isLoggedIn]);

  /* --- End Authentication State --- */

  /* --- Routing state: re-render whenever the hash changes --- */
  const [, setRoute] = React.useState(readRoute());

  React.useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const navigate = (path) => {
    if (window.location.hash !== `#${path}`) {
      window.history.pushState(null, "", `#${path}`);
    }
    setRoute(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  /* --- End routing state --- */

  /* Deep navy sidebar (desktop + large tablet) */
  const current = ROUTES.find((item) => item.path === readRoute()) || ROUTES[0];
  const ActivePage = current.component;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const statusTone = isLoggedIn
    ? "border-mint-200 bg-mint-50 text-mint-700"
    : isLoadingAuth
      ? "border-line bg-white text-muted"
      : "border-coral-200 bg-coral-50 text-coral-600";

  /* --- Render login page when not authenticated --- */
  if (!isLoggedIn && !isLoadingAuth) {
    return <LoginPage onAuthChanged={setIsLoggedIn} />;
  }
  /* --- End render login page --- */

  /* Render the full app shell when authenticated */
  return (
    <div className="relative min-h-screen">
      <Background />

      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-mint-400 via-cyan-400 to-violet-500"
        style={{ transform: `scaleX(0)` }}
      />

      {/* Deep navy sidebar (desktop + large tablet) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/[0.06] bg-navy-900 lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
          <Logo />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold leading-none tracking-[-0.01em] text-white">
              ASHA VoiceCare
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
              AI field register
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
            Workspace
          </p>
          <div className="space-y-1">
            {ROUTES.filter((item) => item.group === "Workspace").map(
              (item) => {
                const Icon = item.icon;
                const active = readRoute() === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "sidebar-link",
                      active && "sidebar-link-active"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-mint-400 shadow-[0_0_14px_rgba(22,214,176,0.9)]" />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] transition-colors",
                        active ? "text-mint-400" : "text-white/35 group-hover:text-white/70"
                      )}
                      strokeWidth={1.9}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-md bg-mint-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-mint-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          <p className="mt-7 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
            System
          </p>
          <div className="space-y-1">
            {ROUTES.filter((item) => item.group === "System").map((item) => {
              const Icon = item.icon;
              const active = readRoute() === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "sidebar-link",
                    active && "sidebar-link-active"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-mint-400 shadow-[0_0_14px_rgba(22,214,176,0.9)]" />
                  )}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] transition-colors",
                      active ? "text-mint-400" : "text-white/35 group-hover:text-white/70"
                    )}
                    strokeWidth={1.9}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> AI screening active
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
              Rule-based danger signs, read-back, and human confirmation before
              any record is saved.
            </p>
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                API status
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-semibold",
                  isLoggedIn
                    ? "text-mint-300"
                    : isLoadingAuth
                      ? "text-coral-400"
                      : "text-white/50"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isLoggedIn ? "bg-mint-400" : isLoadingAuth ? "bg-coral-500" : "bg-white/40"
                  )}
                />
                {isLoggedIn
                  ? "Connected"
                  : isLoadingAuth
                    ? "Checking"
                    : "Offline"}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-white/30">
              Demo · synthetic data · in-memory store
            </p>
          </div>

          <div className="mt-2 flex items-center gap-2.5 rounded-2xl px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white ring-2 ring-white/10">
              AW
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white">
                ASHA worker
              </p>
              <p className="truncate text-[10px] text-white/35">
                Demo session
              </p>
            </div>
            <button
              type="button"
              aria-label="Open settings"
              onClick={() => navigate("/settings")}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/35 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <Logo compact />
              <div className="min-w-0">
                <p className="truncate font-display text-[14px] font-semibold leading-none tracking-[-0.01em]">
                  ASHA VoiceCare
                </p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-muted">
                  AI field register
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-[12px] lg:flex">
              <span className="text-muted">Workspace</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
              <span className="font-semibold text-ink-900">{current.label}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span
                className="hidden rounded-full border border-line bg-white px-3 py-1 text-[11px] font-medium text-muted md:inline-flex"
              >
                {today}
              </span>

              <Button
                size="sm"
                onClick={() => navigate("/voice")}
                className="hidden sm:inline-flex"
              >
                <Mic className="h-4 w-4" />
                New voice visit
              </Button>

              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-[11px] font-bold text-white lg:hidden">
                AW
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7">
          <div key={readRoute()} className="animate-fade-up">
            <ActivePage onNavigate={navigate} />
          </div>

          <footer className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line/80 pt-6 text-[11px] text-muted sm:flex-row sm:items-center">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-mint-600" />
              Demo build · synthetic data only · rule-based alerts, not a
              diagnosis
            </p>
            <p className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Voice-first field register · v1.0
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile tab bar with a raised voice action */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/95 backdrop-blur-xl lg:hidden"
      >
        <div className="safe-bottom mx-auto flex max-w-md items-end justify-between px-2 pt-1.5">
          {MOBILE_ROUTES.map((item) => {
            const Icon = item.icon;
            const active = readRoute() === item.path;

            if (item.path === "/voice") {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={active ? "page" : undefined}
                  aria-label="Voice visit"
                  className="relative -mt-6 flex flex-1 flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "grid h-14 w-14 place-items-center rounded-full border-4 border-canvas bg-mint-500 text-navy-950 shadow-glow transition-transform duration-300 ease-spring active:scale-95",
                      active && "ring-2 ring-mint-300 ring-offset-2 ring-offset-white"
                    )}
                  >
                    <Mic className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      active ? "text-navy-900" : "text-muted"
                    )}
                  >
                    Voice
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={active ? "page" : undefined}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5"
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg transition-colors duration-300",
                    isLoggedIn ? "bg-mint-50 text-mint-700" : "text-muted"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span
                  className={cn(
                    "truncate text-[10px] font-semibold",
                    isLoggedIn ? "text-navy-900" : "text-muted"
                  )}
                >
                  {item.short}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}
