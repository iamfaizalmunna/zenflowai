export function scheduleAiConsult(ticketId: number): void {
  void import('./consultTicket.service')
    .then((mod) => mod.applyAiConsult(ticketId))
    .catch(() => undefined);
}
