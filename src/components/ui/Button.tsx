import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  icon,
  children,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
