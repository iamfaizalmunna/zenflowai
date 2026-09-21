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
        'w-full min-h-12 py-3 px-4 rounded-2xl text-sm font-medium',
        'bg-primary text-primary-foreground shadow-lg shadow-iris/25',
        'hover:brightness-110 active:scale-[0.98] transition duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'flex items-center justify-center gap-2',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
