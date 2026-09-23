import { cn } from '@/lib/utils';

export const fieldLabelClass = 'block text-[12px] font-medium text-muted-foreground mb-1.5';

export const controlClass = cn(
  'min-w-0 w-full max-w-full min-h-10 rounded-2xl border border-border bg-card px-3.5 text-sm text-foreground',
  'placeholder:text-muted-foreground/70',
  'transition-[box-shadow,border-color] duration-200',
  'hover:border-iris/45',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:border-iris/55',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

const btnBase = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 min-h-10 px-4 rounded-2xl text-sm font-medium whitespace-nowrap',
  'disabled:opacity-50 disabled:pointer-events-none',
);

export const buttonClass = {
  primary: cn(
    btnBase,
    'bg-primary text-primary-foreground shadow-sm',
    'hover:brightness-95 active:scale-[0.98] transition duration-200',
  ),
  outline: cn(
    btnBase,
    'border border-border bg-card text-foreground hover:bg-muted active:scale-[0.98] transition duration-200',
  ),
  ghost: cn(
    btnBase,
    'px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition',
  ),
  danger: cn(
    btnBase,
    'px-3 rounded-xl text-destructive hover:bg-destructive/10 transition',
  ),
};
