import * as React from "react";
import { cn } from "../../lib/utils";

type Tone = "neutral" | "blue" | "teal" | "warn" | "danger" | "purple" | "highlight";

interface PillProps {
  tone?: Tone;
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export function Pill({ tone = "neutral", size = "sm", children, className }: PillProps) {
  const tones: Record<Tone, string> = {
    neutral: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    purple: "bg-violet-50 text-violet-700",
    highlight: "bg-red-50 text-red-700",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-wider whitespace-nowrap rounded",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
