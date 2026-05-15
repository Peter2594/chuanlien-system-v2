import { type ReactNode } from "react";

interface PageHeaderProps {
  tag?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ tag, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-7 pb-5 border-b border-slate-200">
      <div>
        {tag && (
          <div className="text-[10px] text-red-500 tracking-[0.25em] font-bold mb-2">
            {tag}
          </div>
        )}
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <div className="text-sm text-slate-500 mt-2 leading-relaxed">{subtitle}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface SectionTitleProps {
  children: ReactNode;
  hint?: ReactNode;
  color?: string;
}

export function SectionTitle({ children, hint, color = "bg-red-500" }: SectionTitleProps) {
  return (
    <div className="flex items-baseline gap-3 pb-2 mb-4 border-b border-slate-100">
      <span className={`w-0.5 h-3.5 ${color} self-center`} />
      <h3 className="text-sm font-bold text-slate-900 tracking-wide">{children}</h3>
      {hint && (
        <span className="text-xs text-slate-400 font-normal ml-auto">{hint}</span>
      )}
    </div>
  );
}
