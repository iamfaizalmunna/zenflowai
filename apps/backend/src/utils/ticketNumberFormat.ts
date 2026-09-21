export function formatTicketNumber(id: number): string {
  return `#ZEN-${String(id).padStart(4, '0')}`;
}
