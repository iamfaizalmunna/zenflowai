import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label ? <label className="block text-sm font-medium text-white/70">{label}</label> : null}
      <input
        ref={ref}
        className={cn(
          'w-full min-h-12 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm text-white',
          'placeholder:text-white/35',
          'focus:border-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/35',
          'transition-shadow',
          error && 'border-red-400 focus:ring-red-400',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  ),
);
AuthInput.displayName = 'AuthInput';
