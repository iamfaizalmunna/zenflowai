'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ListSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={cn('relative block min-w-0 w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-h-10 rounded-2xl border border-border bg-card py-2 pl-9 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-iris/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-iris/40"
      />
    </label>
  );
}
