import { cn } from '@/lib/utils';

export const fieldLabelClass = 'block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2';

export const controlClass = cn(
  'w-full min-h-12 rounded-2xl border border-border bg-card px-3.5 text-sm text-foreground',
  'shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]',
  'placeholder:text-muted-foreground/70',
  'transition-[box-shadow,border-color,transform] duration-200',
  'hover:border-iris/45',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:border-iris/55',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

export const buttonClass = {
  primary: cn(
    'inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-2xl text-sm font-medium',
    'bg-primary text-primary-foreground shadow-lg shadow-iris/20',
    'hover:brightness-110 active:scale-[0.98] transition duration-200',
    'disabled:opacity-50 disabled:pointer-events-none',
  ),
  outline: cn(
    'inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-2xl text-sm font-medium',
    'border border-border bg-card/80 hover:bg-muted/60 active:scale-[0.98] transition duration-200',
  ),
  ghost: cn(
    'inline-flex items-center justify-center gap-2 min-h-10 px-3 rounded-xl text-sm',
    'text-muted-foreground hover:text-foreground hover:bg-muted/70 transition',
  ),
  danger: cn(
    'inline-flex items-center justify-center gap-2 min-h-10 px-3 rounded-xl text-sm font-medium',
    'text-destructive hover:bg-destructive/10 transition',
  ),
};
