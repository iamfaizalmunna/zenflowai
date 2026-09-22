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
    <div className="dash-card px-3 py-2.5">
      <p className="text-[12px] text-muted-foreground leading-none">{label}</p>
      <p className="mt-1.5 text-xl font-semibold leading-none tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1.5 text-[11px] text-muted-foreground leading-none">{hint}</p> : null}
    </div>
  );
}
