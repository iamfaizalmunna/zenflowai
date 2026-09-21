export function calculateDueAt(from: Date, responseHours: number, resolutionHours: number) {
  return {
    slaResponseDueAt: new Date(from.getTime() + responseHours * 60 * 60 * 1000),
    slaResolutionDueAt: new Date(from.getTime() + resolutionHours * 60 * 60 * 1000),
  };
}
