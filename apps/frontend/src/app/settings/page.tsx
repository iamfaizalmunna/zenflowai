'use client';

import { type ReactNode, useRef } from 'react';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { Button, PageTitle } from '@/components/ui/Field';
import { useAppearance } from '@/hooks/useAppearance';
import { cn } from '@/lib/utils';
import {
  ACCENT_PRESETS,
  isReadableAccent,
  normalizeHex,
  type AppearancePrefs,
  type ColorMode,
  type Density,
  type Finish,
  type FontFamily,
  type FontSize,
} from '@/lib/appearance';

function ChipRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, minmax(0, 1fr))` }}>
      {options.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'min-h-12 rounded-2xl border text-sm font-medium transition-all',
            value === item.id ? 'border-iris bg-iris/10 text-iris shadow-sm' : 'border-border bg-background/60 text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="surface rounded-3xl border border-border/70 p-5 space-y-4">
      <div>
        <h2 className="font-display text-lg tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function AppearanceSettingsPage() {
  const { prefs, update } = useAppearance();
  const fileRef = useRef<HTMLInputElement>(null);

  const setHex = (raw: string) => {
    const hex = normalizeHex(raw);
    if (!hex) return;
    if (!isReadableAccent(hex, prefs.shade)) return;
    update({ accentHex: hex });
  };

  const onLogo = (file: File | null) => {
    if (!file) {
      update({ logoDataUrl: null });
      return;
    }
    if (file.size > 120_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') update({ logoDataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <RoleGuard>
        <div className="max-w-2xl space-y-6">
          <PageTitle
            title="Appearance"
            hint="Yours only — saved to your account. Login and public pages always stay the default ZenFlow look."
          />

          <div className="surface rounded-3xl border border-iris/20 p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Live preview</p>
            <p className="font-display text-2xl mt-1 tracking-tight">
              ZenFlow<span className="text-iris">AI</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">Buttons, cards, and type follow the choices below.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button">Primary</Button>
              <Button type="button" variant="outline">Cancel</Button>
            </div>
          </div>

          <Section title="Interface sounds" hint="Clicks on buttons, checkboxes, radios, and switches only.">
            <ChipRow
              value={prefs.soundsMuted ? 'off' : 'on'}
              onChange={(id) => update({ soundsMuted: id === 'off' })}
              options={[
                { id: 'on', label: 'Sounds on' },
                { id: 'off', label: 'Sounds off' },
              ]}
            />
          </Section>

          <Section title="Color mode">
            <ChipRow<ColorMode>
              value={prefs.colorMode}
              onChange={(id) => update({ colorMode: id })}
              options={[
                { id: 'SYSTEM', label: 'System' },
                { id: 'LIGHT', label: 'Light' },
                { id: 'DARK', label: 'Dark' },
              ]}
            />
          </Section>

          <Section title="Accent color" hint="Presets or any hex. Washed-out colors are blocked so text stays readable.">
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={preset.label}
                  onClick={() => update({ accentHex: preset.hex })}
                  className={cn(
                    'h-11 w-11 rounded-2xl border-2 transition-transform active:scale-95',
                    prefs.accentHex === preset.hex ? 'border-foreground scale-105' : 'border-transparent',
                  )}
                  style={{ backgroundColor: preset.hex }}
                />
              ))}
              <label className="h-11 min-w-11 rounded-2xl border border-dashed border-border overflow-hidden">
                <input
                  type="color"
                  aria-label="Custom accent"
                  value={prefs.accentHex}
                  onChange={(e) => setHex(e.target.value)}
                  className="h-14 w-14 -m-1 cursor-pointer bg-transparent"
                />
              </label>
            </div>
            <label className="block text-sm text-muted-foreground">
              Shade
              <input
                type="range"
                min={-24}
                max={24}
                value={prefs.shade}
                onChange={(e) => update({ shade: Number(e.target.value) })}
                className="w-full mt-2 accent-[hsl(var(--iris))]"
              />
            </label>
          </Section>

          <Section title="Surface finish">
            <ChipRow<Finish>
              value={prefs.finish}
              onChange={(id) => update({ finish: id })}
              options={[
                { id: 'MATTE', label: 'Matte' },
                { id: 'GLOSSY', label: 'Glossy' },
                { id: 'GLASS', label: 'Glass' },
              ]}
            />
          </Section>

          <Section title="Typography">
            <ChipRow<FontFamily>
              value={prefs.fontFamily}
              onChange={(id) => update({ fontFamily: id })}
              options={[
                { id: 'OUTFIT', label: 'Outfit' },
                { id: 'FRAUNCES', label: 'Fraunces' },
                { id: 'SYSTEM', label: 'System' },
                { id: 'SERIF', label: 'Serif' },
                { id: 'MONO', label: 'Mono' },
              ]}
            />
            <ChipRow<FontSize>
              value={prefs.fontSize}
              onChange={(id) => update({ fontSize: id })}
              options={[
                { id: 'S', label: 'Small' },
                { id: 'M', label: 'Medium' },
                { id: 'L', label: 'Large' },
              ]}
            />
          </Section>

          <Section title="Density">
            <ChipRow<Density>
              value={prefs.density}
              onChange={(id) => update({ density: id })}
              options={[
                { id: 'COMFORTABLE', label: 'Comfortable' },
                { id: 'COMPACT', label: 'Compact' },
              ]}
            />
          </Section>

          <Section title="Logo" hint="Personal mark in the header. PNG, JPEG, or WebP, under 120 KB.">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                Upload logo
              </Button>
              {prefs.logoDataUrl && (
                <Button type="button" variant="ghost" onClick={() => update({ logoDataUrl: null })}>
                  Remove
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => onLogo(e.target.files?.[0] ?? null)}
              />
            </div>
          </Section>

          <Section title="Ticket browsing" hint="Default view and sort for queues and my tickets.">
            <ChipRow<AppearancePrefs['ticketView']>
              value={prefs.ticketView}
              onChange={(id) => update({ ticketView: id })}
              options={[
                { id: 'LIST', label: 'List' },
                { id: 'COMPACT', label: 'Compact' },
                { id: 'CARD', label: 'Cards' },
                { id: 'ICON', label: 'Icons' },
              ]}
            />
          </Section>
        </div>
    </RoleGuard>
  );
}
