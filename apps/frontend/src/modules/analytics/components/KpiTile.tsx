export function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="dash-card px-3 py-3">
      <p className="type-meta">{label}</p>
      <p className="mt-1.5 text-xl font-semibold leading-none tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="type-meta mt-1.5">{hint}</p> : null}
    </div>
  );
}
