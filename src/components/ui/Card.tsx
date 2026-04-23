import type { CSSProperties, ReactNode } from "react";

export function Card({
  className = "",
  children,
  title,
  action,
  style,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-app-card p-5 shadow-sm transition duration-200 hover:shadow-md ${className}`}
      style={style}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
