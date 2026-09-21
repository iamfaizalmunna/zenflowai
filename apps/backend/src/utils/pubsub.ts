import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub<Record<string, unknown>>();

export function messageAddedTopic(ticketId: number): string {
  return `MESSAGE_ADDED:${ticketId}`;
}

export function ticketUpdatedTopic(ticketId: number): string {
  return `TICKET_UPDATED:${ticketId}`;
}

export const TICKET_CREATED_TOPIC = 'TICKET_CREATED';
