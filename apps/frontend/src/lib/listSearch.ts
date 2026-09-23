export function filterByQuery<T>(rows: T[], query: string, haystack: (row: T) => string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => haystack(row).toLowerCase().includes(q));
}
