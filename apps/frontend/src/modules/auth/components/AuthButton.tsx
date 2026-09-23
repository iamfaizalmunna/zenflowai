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
        'w-full min-h-12 py-3 px-4 rounded-2xl text-sm font-semibold',
        'bg-gradient-to-r from-[#7C5CFF] to-[#F59E0B] text-white shadow-[0_12px_32px_rgba(124,92,255,0.4)]',
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
