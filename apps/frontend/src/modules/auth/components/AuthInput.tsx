// Single reusable input — used across all auth forms
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        ref={ref}
        className={cn(
          'w-full min-h-12 px-3 py-3 rounded-2xl text-sm border bg-background/70',
          'border-border placeholder-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-iris/50 focus:border-transparent',
          'transition-shadow',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
AuthInput.displayName = 'AuthInput';
