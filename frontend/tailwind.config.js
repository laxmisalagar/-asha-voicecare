/** @type {import('tailwindcss').Config} */

const mint = {
  50: "#E5FAF4",
  100: "#CCF6EC",
  200: "#9EEDD9",
  300: "#63E2C6",
  400: "#2FDAB8",
  500: "#16D6B0",
  600: "#0FB99A",
  700: "#0C947D",
  800: "#0B7564",
};

const cyan = {
  50: "#E8FBFA",
  100: "#CBF6F4",
  200: "#9DEDEA",
  300: "#63E0DC",
  400: "#45D6D1",
  500: "#36CFC9",
  600: "#25B3AE",
  700: "#1E8F8B",
};

const violet = {
  50: "#F0EDFF",
  100: "#E6E1FF",
  200: "#D2C9FF",
  300: "#B6A7FC",
  400: "#9884F9",
  500: "#7357F6",
  600: "#5C40E0",
  700: "#4A31BA",
};

const amber = {
  50: "#FFF7EA",
  100: "#FFEDD0",
  200: "#FFDDA8",
  300: "#FFCB80",
  400: "#FFC266",
  500: "#FFB84D",
  600: "#E89A2E",
  700: "#C27C18",
};

const coral = {
  50: "#FEF2F3",
  100: "#FDE2E5",
  200: "#FBC8CE",
  300: "#F7A1AA",
  400: "#F37A86",
  500: "#EF5261",
  600: "#D93A4A",
  700: "#B62C3A",
};

module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0A1526",
          900: "#101D32",
          850: "#0D1829",
          800: "#172B49",
          700: "#1E3657",
          600: "#2A476B",
          500: "#3A5A82",
        },
        ink: {
          950: "#0A1526",
          900: "#101D32",
          800: "#172B49",
          700: "#223A59",
          600: "#334F70",
        },
        canvas: "#F5F7FB",
        surface: "#FFFFFF",
        line: "#E7ECF3",
        muted: "#778399",
        text: "#18243A",
        mint,
        cyan,
        violet,
        amber,
        coral,
        success: {
          50: "#E9F8F1",
          100: "#CFF0E0",
          500: "#16A36A",
          600: "#118656",
          700: "#0D6B45",
        },
        /* Backwards-compatible aliases so every existing class adopts the
           new identity without touching component logic. */
        jade: mint,
        iris: violet,
        sun: amber,
        rose: coral,
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,29,50,0.04), 0 8px 24px -14px rgba(16,29,50,0.12)",
        card: "0 1px 3px rgba(16,29,50,0.04), 0 14px 34px -22px rgba(16,29,50,0.22)",
        float:
          "0 24px 60px -32px rgba(16,29,50,0.36), 0 2px 8px rgba(16,29,50,0.04)",
        lift:
          "0 32px 70px -34px rgba(16,29,50,0.42), 0 6px 16px rgba(16,29,50,0.06)",
        glow: "0 0 0 1px rgba(22,214,176,0.28), 0 18px 45px -18px rgba(22,214,176,0.55)",
        "glow-violet":
          "0 0 0 1px rgba(115,87,246,0.24), 0 18px 45px -20px rgba(115,87,246,0.55)",
        "glow-coral":
          "0 0 0 1px rgba(239,82,97,0.24), 0 18px 45px -18px rgba(239,82,97,0.5)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.7)",
        "inner-line": "inset 0 0 0 1px rgba(255,255,255,0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      keyframes: {
        floatY: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-12px,0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(22px,-16px,0) scale(1.03)" },
          "66%": { transform: "translate3d(-16px,12px,0) scale(0.99)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.92)", opacity: "0.5" },
          "70%": { transform: "scale(1.55)", opacity: "0" },
          "100%": { transform: "scale(1.55)", opacity: "0" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.24)" },
          "50%": { transform: "scaleY(1)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translate3d(0,12px,0)" },
          "100%": { opacity: "1", transform: "translate3d(0,0,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-480px 0" },
          "100%": { backgroundPosition: "480px 0" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scan: {
          "0%": { transform: "translateX(-110%)" },
          "100%": { transform: "translateX(110%)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translate3d(0,16px,0) scale(0.98)" },
          "100%": { opacity: "1", transform: "translate3d(0,0,0) scale(1)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.04)" },
        },
      },
      animation: {
        "float-y": "floatY 7s ease-in-out infinite",
        "float-y-slow": "floatY 11s ease-in-out infinite",
        drift: "drift 28s ease-in-out infinite",
        "pulse-ring": "pulseRing 2.4s cubic-bezier(0.2,0.6,0.4,1) infinite",
        wave: "wave 1.1s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "spin-slow": "spinSlow 22s linear infinite",
        "pop-in": "popIn 0.32s cubic-bezier(0.16,1,0.3,1) both",
        scan: "scan 1.8s ease-in-out infinite",
        "toast-in": "toastIn 0.32s cubic-bezier(0.16,1,0.3,1) both",
        breathe: "breathe 4.5s ease-in-out infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(16,29,50,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,29,50,0.045) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "mint-fade":
          "radial-gradient(ellipse at top left, rgba(22,214,176,0.18), transparent 55%)",
      },
      backgroundSize: {
        grid: "56px 56px",
      },
    },
  },
  plugins: [],
};
