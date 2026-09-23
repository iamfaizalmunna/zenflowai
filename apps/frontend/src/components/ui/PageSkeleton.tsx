export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-8 w-52 animate-pulse rounded-xl bg-muted" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-muted/80" />
      <div className="h-36 animate-pulse rounded-2xl bg-muted/70" />
      <div className="h-36 animate-pulse rounded-2xl bg-muted/50" />
      <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
    </div>
  );
}
