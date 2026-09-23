export interface TicketReply {
  body: string;
  type: string;
  isStaff: boolean;
  isAi?: boolean;
}

export function buildKbDraftFromTicket(input: {
  ticketNumber: string;
  title: string;
  description: string;
  replies: TicketReply[];
}): { title: string; body: string } | null {
  const usable = input.replies.filter((m) => m.isStaff && m.type === 'REPLY' && m.body.trim().length >= 20);
  const human = usable.filter((m) => !m.isAi);
  const chosen = (human.length ? human : usable).at(-1);
  if (!chosen) return null;

  const title = `${input.ticketNumber}: ${input.title}`.slice(0, 180);
  const body = [
    `## Question`,
    input.description.trim().slice(0, 1500),
    ``,
    `## Resolution`,
    chosen.body.trim().slice(0, 4000),
    ``,
    `_Draft from ${input.ticketNumber}. Internal until an admin publishes._`,
  ].join('\n');

  return { title, body };
}
