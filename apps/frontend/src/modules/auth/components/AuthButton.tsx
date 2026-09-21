import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function AuthButton({ loading, children, className, disabled, ...props }: AuthButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        'w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-opacity',
        'bg-slate-900 dark:bg-white text-white dark:text-slate-900',
        'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
