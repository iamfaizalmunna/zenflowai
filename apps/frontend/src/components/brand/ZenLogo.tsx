import { cn } from '@/lib/utils';

export function ZenLogo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="shrink-0 drop-shadow-[0_8px_18px_rgba(124,92,255,0.35)]"
      >
        <rect width="48" height="48" rx="14" fill="url(#zenMark)" />
        <path
          d="M14 16.5h20l-16 15H34"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="34.5" cy="14.5" r="3.2" fill="#F6C96B" />
        <defs>
          <linearGradient id="zenMark" x1="6" y1="4" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B6CFF" />
            <stop offset="1" stopColor="#3D2A8F" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-display text-lg tracking-tight leading-none">
        ZenFlow<span className="text-iris">AI</span>
      </span>
    </span>
  );
}
