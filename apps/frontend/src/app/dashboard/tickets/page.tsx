'use client';

import { useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatRelativeTime, priorityColors, statusColors } from '@/lib/utils';
import { cn } from '@/lib/utils';

const GET_TICKETS = gql`
  query GetTickets($filter: TicketFilter, $page: Int, $pageSize: Int) {
    tickets(filter: $filter, page: $page, pageSize: $pageSize) {
      tickets {
        id
        title
        status
        priority
        type
        createdAt
        isBookmarked
        createdBy {
          name
          avatar
        }
        assignedTo {
          name
          avatar
        }
        category {
          name
          color
        }
        tags {
          id
          name
          color
        }
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading } = useQuery(GET_TICKETS, {
    variables: {
      filter: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      },
      page: 1,
      pageSize: 20,
    },
  });

  const tickets = data?.tickets?.tickets ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.tickets?.total ?? 0} total tickets
          </p>
        </div>
        <Link
          href="/dashboard/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Tickets list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border bg-muted/30 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket: any, i: number) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/dashboard/tickets/${ticket.id}`}>
                <div className="group p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    {/* Bookmark indicator */}
                    {ticket.isBookmarked && (
                      <Bookmark className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0 fill-current" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          #{ticket.id} · {ticket.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(ticket.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', statusColors[ticket.status])}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[ticket.priority])}>
                          {ticket.priority}
                        </span>
                        {ticket.category && (
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: ticket.category.color }}
                          >
                            {ticket.category.name}
                          </span>
                        )}
                        {ticket.tags?.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="inline-flex px-2 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>

                      {(ticket.createdBy || ticket.assignedTo) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>By: {ticket.createdBy?.name}</span>
                          {ticket.assignedTo && <span>Assigned: {ticket.assignedTo.name}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {tickets.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tickets found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
