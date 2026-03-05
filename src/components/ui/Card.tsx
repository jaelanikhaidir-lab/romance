import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function Card({ children, className = "", title, icon, action }: CardProps) {
  const hasHeader = title || icon || action;
  return (
    <div
      className={`rounded-xl border border-border bg-surface ${hasHeader ? "" : "p-6"} ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-accent">{icon}</span>}
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={hasHeader ? "p-6" : ""}>{children}</div>
    </div>
  );
}
