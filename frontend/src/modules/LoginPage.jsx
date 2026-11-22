import React from "react";
import { cn } from "../lib/cn";
import { Button } from "../components/ui/button";
import { Mail, Lock, LogOut, Users, RefreshCw, } from "lucide-react";

/* ============================================================
   Login Page — client-side only, uses localStorage session.
   Designed to integrate with the existing ASHA VoiceCare navy/mint
   visual language. Zero backend changes. Replace with real auth later.
   ============================================================ */

const STORAGE_KEY = "asha-voicecare-user";

function LoginForm({ onLogin, isLoading, error }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    // Simulate login — set session in localStorage
    const user = { email, loggedInAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    onLogin();
  };

  return (
    <form
      className="space-y-4 p-8 sm:p-12 max-w-md w-full bg-navy-900/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
      onSubmit={handleSubmit}
    >
      <div className="text-center mb-6">
        <Mail
          className="mx-auto h-12 w-12 text-mint-400 mb-3 text-3xl"
          strokeWidth={2}
        />
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          ASHA VoiceCare
        </h1>
        <p className="text-white/60 text-sm leading-relaxed">
          AI Field Register
        </p>
      </div>

      {error && (
        <div className="bg-coral-500/10 border border-coral-500/40 rounded-xl p-4 text-coral-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label
            className="block text-sm font-medium text-white/60 mb-2"
          >
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@healthcare.org"
            className="bg-navy-900/50 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 transition-colors focus:border-mint-400 focus:outline-none w-full"
            aria-describedby="email-help"
          />
          <p className="text-xs text-white/40" id="email-help">
            We'll never share your email.
          </p>
        </div>

        {/* Password Input */}
        <div>
          <label
            className="block text-sm font-medium text-white/60 mb-2"
          >
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-navy-900/50 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 transition-colors focus:border-mint-400 focus:outline-none w-full"
            aria-describedby="password-help"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-mint-400 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "eye" : "eye-off"}
          </button>
          <p className="text-xs text-white/40" id="password-help">
            Minimum 6 characters.
          </p>
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            className="rounded border border-white/20 w-4 h-4 bg-navy-900/50 focus-visible:outline focus-visible:ring-2 focus-mint-400"
          />
          <span className="text-white/60 text-sm">
            Remember me
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex justify-center py-2.5 px-4 text-sm font-medium transition-colors"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            // Clear session & redirect to signup
            localStorage.removeItem(STORAGE_KEY);
            window.location.hash = "#/settings";
          }}
          className="flex-1 flex justify-center py-2.5 px-4 text-sm font-medium text-coral-400 hover:text-coral-200 transition-colors"
        >
          Create account
        </Button>
      </div>

      {/* Forgot password link */}
      <p className="mt-4 text-xs text-white/40 text-center">
        <a
          href="#"
          onClick={() => {
            // TODO: trigger password reset flow
            window.alert("Password reset feature coming soon.");
          }}
        >
          Forgot password?
        </a>
      </p>
    </form>
  );
}

/* ============================================================
   Login Wrapper — checks localStorage session, redirects if active.
   ============================================================ */

function LoginPage({ onAuthChanged }) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Check for existing session on mount
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Notify parent of auth state change
  React.useEffect(() => {
    onAuthChanged(isLoggedIn);
  }, [isLoggedIn]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Signing in…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900">
      <LoginForm
        onLogin={() => setIsLoggedIn(true)}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

/* ============================================================
   Export — used by App.jsx routing
   ============================================================ */

export default LoginPage;
export { LoginForm, STORAGE_KEY };