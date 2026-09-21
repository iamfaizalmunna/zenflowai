import {
  BookOpen,
  Inbox,
  LayoutDashboard,
  Plus,
  Settings,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { AppNavIcon } from '@/lib/nav';

export const NAV_ICONS: Record<AppNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  ticket: Ticket,
  plus: Plus,
  book: BookOpen,
  inbox: Inbox,
  users: Users,
  settings: Settings,
};
