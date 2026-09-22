import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { buttonClass, controlClass, fieldLabelClass } from '@/components/ui/controlStyles';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block">
      <p className={fieldLabelClass}>{label}</p>
      {children}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlClass, className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlClass, 'min-h-28 py-3', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonClass }) {
  return <button className={cn(buttonClass[variant], className)} {...props} />;
}

export function PageTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <header className="space-y-1.5 max-w-2xl">
      <h1 className="font-display text-[1.75rem] app:text-[2rem] tracking-tight text-foreground">{title}</h1>
      {hint && <p className="text-sm leading-6 text-muted-foreground">{hint}</p>}
    </header>
  );
}
