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
          'w-full px-3 py-2.5 rounded-xl text-sm border bg-slate-50 dark:bg-slate-800',
          'border-slate-200 dark:border-slate-700',
          'placeholder-slate-400 dark:placeholder-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent',
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
