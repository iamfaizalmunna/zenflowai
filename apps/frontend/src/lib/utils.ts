import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export const statusColors: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ON_HOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  RESOLVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
