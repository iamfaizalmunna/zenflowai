'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/components/ui/controlStyles';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  disabled,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        data-ui-hover
        className={cn(controlClass, 'flex items-center justify-between gap-2 text-left', className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1.5rem)] max-h-[min(24rem,var(--radix-select-content-available-height))] overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-iris/10"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-iris/10 data-[state=checked]:text-iris"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto">
                  <Check className="h-3.5 w-3.5" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
