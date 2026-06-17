import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  variant?: "pulse" | "shimmer";
}

export function Skeleton({ className, variant = "shimmer" }: SkeletonProps) {
  return (
    <div
      className={`${
        variant === "shimmer"
          ? "animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%]"
          : "animate-pulse"
      } rounded bg-zinc-800/50 ${className ?? ""}`}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  children?: ReactNode;
}

export function SkeletonCard({ className, children }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/50 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 4, columns = 6, className }: SkeletonTableProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <div className="flex gap-4 py-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === 0 ? "w-6" : "flex-1"}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 border-t border-zinc-800/50">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 ${c === 0 ? "w-6" : c === 1 ? "flex-[3]" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
