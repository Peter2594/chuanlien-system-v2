import * as React from "react";
import { cn } from "../../lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200/60",
        hover && "hover:shadow-md transition-all",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
