// Shared types between frontend and backend

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketType = 'BUG' | 'FEATURE_REQUEST' | 'QUESTION' | 'INCIDENT' | 'TASK';
export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  dueDate?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
