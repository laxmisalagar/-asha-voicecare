import React from "react";
import { useScrollY } from "../hooks/useScrollY";

const GLOWS = [
  {
    key: "mint",
    className: "left-[-14%] top-[-16%] h-[40rem] w-[40rem] animate-drift",
    from: "rgba(22, 214, 176, 0.20)",
    factor: 0.08,
    delay: "0s",
  },
  {
    key: "violet",
    className: "right-[-18%] top-[-6%] h-[38rem] w-[38rem] animate-drift",
    from: "rgba(115, 87, 246, 0.14)",
    factor: 0.14,
    delay: "-9s",
  },
  {
    key: "cyan",
    className: "bottom-[-24%] left-[24%] h-[34rem] w-[34rem] animate-drift",
    from: "rgba(54, 207, 201, 0.13)",
    factor: 0.05,
    delay: "-15s",
  },
];

export default function Background() {
  const scrollY = useScrollY();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas"
    >
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]" />

      {GLOWS.map((glow) => (
        <div
          key={glow.key}
          className={`absolute rounded-full blur-3xl ${glow.className}`}
          style={{
            background: `radial-gradient(circle at 35% 35%, ${glow.from}, transparent 68%)`,
            transform: `translate3d(0, ${scrollY * glow.factor}px, 0)`,
            animationDelay: glow.delay,
          }}
        />
      ))}

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
    </div>
  );
}
