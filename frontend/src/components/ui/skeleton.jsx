import React from "react";
import { cn } from "../../lib/cn";

export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton h-4 w-full", className)}
    />
  );
}
