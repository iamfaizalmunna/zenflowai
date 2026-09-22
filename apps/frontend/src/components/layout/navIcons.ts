import {
  BookOpen,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
  Ticket,
  Timer,
  UserCog,
  Users,
  BarChart3,
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
  chart: BarChart3,
  shield: Shield,
  timer: Timer,
  route: GitBranch,
  usercog: UserCog,
};
