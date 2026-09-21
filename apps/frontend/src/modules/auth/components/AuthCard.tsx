// Shared card shell for all auth screens — keeps them visually consistent
import { Zap } from 'lucide-react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center">
            <Zap className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <span className="text-xl font-bold tracking-tight">ZenFlowAI</span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-lg font-semibold mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </div>
  );
}
