// Role hierarchy (numeric — higher = more privilege)
export const ROLE_HIERARCHY: Record<string, number> = {
  CUSTOMER:    0,
  AGENT:       1,
  SUPERVISOR:  2,
  ADMIN:       3,
  SUPER_ADMIN: 4,
};

// Role → home route mapping
export function meetsMinRole(role: string | undefined, minRole: string): boolean {
  return (ROLE_HIERARCHY[role ?? ''] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

export const ROLE_HOME: Record<string, string> = {
  CUSTOMER:    '/dashboard',
  AGENT:       '/queue',
  SUPERVISOR:  '/supervisor',
  ADMIN:       '/admin/users',
  SUPER_ADMIN: '/admin/users',
};

// Ticket status display
export const STATUS_LABEL: Record<string, string> = {
  NEW:         'New',
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  ON_HOLD:     'On Hold',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
};

export const STATUS_COLOR: Record<string, string> = {
  NEW:         'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  OPEN:        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IN_PROGRESS: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  ON_HOLD:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  RESOLVED:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  CLOSED:      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export const PRIORITY_LABEL: Record<string, string> = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
  URGENT: 'Urgent',
};

export const PRIORITY_COLOR: Record<string, string> = {
  LOW:    'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH:   'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const ROLE_LABEL: Record<string, string> = {
  CUSTOMER:    'Customer',
  AGENT:       'Agent',
  SUPERVISOR:  'Supervisor',
  ADMIN:       'Admin',
  SUPER_ADMIN: 'Super Admin',
};

export const ROLE_COLOR: Record<string, string> = {
  CUSTOMER:    'bg-slate-100 text-slate-700',
  AGENT:       'bg-blue-100 text-blue-700',
  SUPERVISOR:  'bg-violet-100 text-violet-700',
  ADMIN:       'bg-amber-100 text-amber-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700' };
