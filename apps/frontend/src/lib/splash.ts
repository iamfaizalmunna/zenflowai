export const AUTH_SPLASH_KEY = 'zenflow-auth-splash-v5';

export const SPLASH_SCENES = [
  {
    id: 'saas',
    kicker: 'SaaS',
    title: 'Customer desk',
    ticket: '#ZEN-1042',
    status: 'Open',
    glow: 'from-[#A78BFA] via-[#7C5CFF] to-[#F59E3B]',
    lines: ['#ZEN-1042 VPN drops', 'Status  Open', 'You · waiting on Nova'],
    thread: [
      { who: 'You', body: 'VPN drops every 20 minutes on the office mesh.' },
      { who: 'Nova', body: 'Matched Help Center: split-tunnel on guest SSIDs.' },
      { who: 'Desk', body: 'If it still flakes, a person picks it up live.' },
    ],
  },
  {
    id: 'nova',
    kicker: 'AI',
    title: 'Nova first reply',
    ticket: '#ZEN-1042',
    status: 'Grounded',
    glow: 'from-[#FDE68A] via-[#F59E0B] to-[#FB7185]',
    lines: ['Grounded in Help Center', 'Handoff if unsure', 'Still need a person'],
    thread: [
      { who: 'Nova', body: 'I only answer from published articles — no guesses.' },
      { who: 'You', body: 'Still need a person after that.' },
      { who: 'Nova', body: 'Handoff is on. An agent sees the full thread.' },
    ],
  },
  {
    id: 'paas',
    kicker: 'PaaS',
    title: 'GraphQL platform',
    ticket: 'mutation',
    status: 'Live',
    glow: 'from-[#67E8F9] via-[#C084FC] to-[#F0ABFC]',
    lines: ['createTicket', 'messageAdded  live', 'Same RBAC as the UI'],
    thread: [
      { who: 'API', body: 'createTicket · same RBAC as this UI.' },
      { who: 'WS', body: 'messageAdded streams over graphql-ws.' },
      { who: 'Audit', body: 'Every write is logged. No silent mutation.' },
    ],
  },
] as const;

export const SPLASH_TRANSITIONS = [
  { initial: { opacity: 0, x: 56 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
  { initial: { opacity: 0, scale: 0.86, rotate: -6 }, animate: { opacity: 1, scale: 1, rotate: 0 } },
] as const;

export function shouldShowAuthSplash(seen: string | null, reduceMotion: boolean): boolean {
  if (reduceMotion) return false;
  return seen !== '1';
}

export function pickSplashTransition(seed: number): (typeof SPLASH_TRANSITIONS)[number] {
  return SPLASH_TRANSITIONS[Math.abs(seed) % SPLASH_TRANSITIONS.length];
}

export const SHADE_PALETTES = [
  ['#7C5CFF', '#F59E0B', '#E11D48'],
  ['#22D3EE', '#A78BFA', '#F472B6'],
  ['#34D399', '#818CF8', '#FBBF24'],
  ['#F97316', '#C084FC', '#38BDF8'],
  ['#FB7185', '#6366F1', '#2DD4BF'],
] as const;

export function pickShadePalette(seed: number): (typeof SHADE_PALETTES)[number] {
  return SHADE_PALETTES[Math.abs(seed) % SHADE_PALETTES.length];
}

export function nextSceneIndex(current: number, roll: number): number {
  const n = SPLASH_SCENES.length;
  if (n < 2) return 0;
  return (current + 1 + (Math.abs(roll) % (n - 1))) % n;
}

