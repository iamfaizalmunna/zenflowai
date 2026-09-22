import Link from 'next/link';

export interface LeaderboardPerson {
  id: number;
  rank: number;
  name: string;
  teams: string[];
  resolvedCount: number;
  csatAverage: number;
  csatCount: number;
  detractors: number;
  promoters: number;
  assessmentIndex: number;
}

export function LeaderboardTable({ rows }: { rows: LeaderboardPerson[] }) {
  return (
    <div className="overflow-x-auto dash-card">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="text-left text-xs text-muted-foreground bg-muted/40">
          <tr>
            <th className="px-5 py-3.5 font-medium">Rank</th>
            <th className="px-5 py-3.5 font-medium">Consultant</th>
            <th className="px-5 py-3.5 font-medium">Solved</th>
            <th className="px-5 py-3.5 font-medium">CSAT</th>
            <th className="px-5 py-3.5 font-medium">Loved</th>
            <th className="px-5 py-3.5 font-medium">Poor</th>
            <th className="px-5 py-3.5 font-medium">Index</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/50">
              <td className="px-5 py-3.5 tabular-nums font-semibold">{row.rank}</td>
              <td className="px-5 py-3.5">
                <Link href={`/admin/consultants/${row.id}`} className="font-medium hover:text-iris">
                  {row.name}
                </Link>
                <p className="text-xs text-muted-foreground">{row.teams.join(', ') || '—'}</p>
              </td>
              <td className="px-5 py-3.5 tabular-nums">{row.resolvedCount}</td>
              <td className="px-5 py-3.5 tabular-nums">{row.csatCount ? row.csatAverage : '—'}</td>
              <td className="px-5 py-3.5 tabular-nums">{row.promoters}</td>
              <td className="px-5 py-3.5 tabular-nums">{row.detractors}</td>
              <td className="px-5 py-3.5 tabular-nums font-semibold">{row.assessmentIndex}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
