import type { HTMLAttributes } from "react";

const clsx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

export function Skeleton({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("animate-pulse rounded-lg bg-slate-200/80", className)}
      {...rest}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-2/3 max-w-md" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
