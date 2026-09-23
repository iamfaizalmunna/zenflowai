export const COLOR_MODES = ['SYSTEM', 'LIGHT', 'DARK'] as const;
export const FINISHES = ['MATTE', 'GLOSSY', 'GLASS'] as const;
export const FONT_FAMILIES = ['OUTFIT', 'FRAUNCES', 'SYSTEM', 'SERIF', 'MONO'] as const;
export const FONT_SIZES = ['S', 'M', 'L'] as const;
export const DENSITIES = ['COMFORTABLE', 'COMPACT'] as const;
export const TICKET_VIEWS = ['LIST', 'COMPACT', 'CARD', 'ICON'] as const;
export const TICKET_SORTS = ['UPDATED', 'CREATED', 'SLA', 'PRIORITY'] as const;

export type ColorMode = (typeof COLOR_MODES)[number];
export type Finish = (typeof FINISHES)[number];
export type FontFamily = (typeof FONT_FAMILIES)[number];
export type FontSize = (typeof FONT_SIZES)[number];
export type Density = (typeof DENSITIES)[number];
export type TicketView = (typeof TICKET_VIEWS)[number];
export type TicketSort = (typeof TICKET_SORTS)[number];

export interface AppearancePrefs {
  colorMode: ColorMode;
  accentHex: string;
  shade: number;
  finish: Finish;
  fontFamily: FontFamily;
  fontSize: FontSize;
  density: Density;
  ticketView: TicketView;
  ticketSort: TicketSort;
  soundsMuted: boolean;
  logoDataUrl: string | null;
}

export const DEFAULT_ACCENT_HEX = '#7C5CFC';

export const DEFAULT_APPEARANCE: AppearancePrefs = {
  colorMode: 'SYSTEM',
  accentHex: DEFAULT_ACCENT_HEX,
  shade: 0,
  finish: 'GLOSSY',
  fontFamily: 'OUTFIT',
  fontSize: 'M',
  density: 'COMFORTABLE',
  ticketView: 'LIST',
  ticketSort: 'UPDATED',
  soundsMuted: false,
  logoDataUrl: null,
};

export const ACCENT_PRESETS = [
  { id: 'iris', hex: '#7C5CFC', label: 'Iris' },
  { id: 'ocean', hex: '#2B8CEE', label: 'Ocean' },
  { id: 'forest', hex: '#1F9D6B', label: 'Forest' },
  { id: 'amber', hex: '#E8A317', label: 'Amber' },
  { id: 'rose', hex: '#E11D6A', label: 'Rose' },
  { id: 'slate', hex: '#5B6B82', label: 'Slate' },
] as const;

const HEX = /^#([0-9a-fA-F]{6})$/;
const LOGO_MAX = 180_000;

export function normalizeHex(raw: string): string | null {
  const value = raw.trim();
  if (!HEX.test(value)) return null;
  return `#${value.slice(1).toUpperCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  if (a === null || b === null) return null;
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function shadeHex(hex: string, shade: number): string | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const l = Math.min(78, Math.max(18, hsl.l + shade));
  return hslToHex(hsl.h, hsl.s, l);
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function accentForeground(hex: string): '#FFFFFF' | '#111111' {
  const white = contrastRatio(hex, '#FFFFFF') ?? 0;
  const black = contrastRatio(hex, '#111111') ?? 0;
  return white >= black ? '#FFFFFF' : '#111111';
}

export function isReadableAccent(hex: string, shade = 0): boolean {
  const shaded = shadeHex(hex, shade);
  if (!shaded) return false;
  const white = contrastRatio(shaded, '#FFFFFF') ?? 0;
  const black = contrastRatio(shaded, '#111111') ?? 0;
  return Math.max(white, black) >= 3;
}

export function clampShade(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(24, Math.max(-24, Math.round(value)));
}

export function isAllowedLogo(dataUrl: string | null): boolean {
  if (dataUrl === null) return true;
  if (dataUrl.length > LOGO_MAX) return false;
  return /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(dataUrl);
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function mergeAppearance(input: Partial<AppearancePrefs> | Record<string, unknown> | null | undefined): AppearancePrefs {
  const raw = (input ?? {}) as Partial<AppearancePrefs>;
  const next: AppearancePrefs = { ...DEFAULT_APPEARANCE, ...raw };
  const hex = normalizeHex(next.accentHex) ?? DEFAULT_ACCENT_HEX;
  const shade = clampShade(next.shade);
  const accent = isReadableAccent(hex, shade) ? hex : DEFAULT_ACCENT_HEX;
  const safeShade = isReadableAccent(accent, shade) ? shade : 0;
  return {
    colorMode: pick(next.colorMode, COLOR_MODES, 'SYSTEM'),
    accentHex: accent,
    shade: safeShade,
    finish: pick(next.finish, FINISHES, 'GLOSSY'),
    fontFamily: pick(next.fontFamily, FONT_FAMILIES, 'OUTFIT'),
    fontSize: pick(next.fontSize, FONT_SIZES, 'M'),
    density: pick(next.density, DENSITIES, 'COMFORTABLE'),
    ticketView: pick(next.ticketView, TICKET_VIEWS, 'LIST'),
    ticketSort: pick(next.ticketSort, TICKET_SORTS, 'UPDATED'),
    soundsMuted: Boolean(next.soundsMuted),
    logoDataUrl: isAllowedLogo(next.logoDataUrl ?? null) ? next.logoDataUrl ?? null : null,
  };
}

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function sortTickets<T extends {
  createdAt: string;
  updatedAt?: string | null;
  slaResolutionDueAt?: string | null;
  priority: string;
}>(tickets: T[], sort: TicketSort): T[] {
  const copy = [...tickets];
  copy.sort((a, b) => {
    if (sort === 'PRIORITY') {
      return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    }
    if (sort === 'SLA') {
      const aDue = a.slaResolutionDueAt ? Date.parse(a.slaResolutionDueAt) : Number.POSITIVE_INFINITY;
      const bDue = b.slaResolutionDueAt ? Date.parse(b.slaResolutionDueAt) : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    }
    if (sort === 'CREATED') {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    return Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt);
  });
  return copy;
}

export function hslChannels(hex: string, shade: number): string | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const l = Math.min(78, Math.max(18, hsl.l + shade));
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(l)}%`;
}

export const FONT_SIZE_PX: Record<FontSize, string> = { S: '15px', M: '16px', L: '18px' };

export const FONT_STACK: Record<FontFamily, string> = {
  OUTFIT: 'var(--font-outfit), system-ui, sans-serif',
  FRAUNCES: 'var(--font-fraunces), Georgia, serif',
  SYSTEM: 'system-ui, -apple-system, sans-serif',
  SERIF: 'Georgia, "Times New Roman", ui-serif, serif',
  MONO: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

