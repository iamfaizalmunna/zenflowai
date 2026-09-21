import { gql } from 'graphql-tag';

export const ticketTypeDefs = gql`
  enum TicketStatus {
    NEW
    OPEN
    IN_PROGRESS
    ON_HOLD
    RESOLVED
    CLOSED
  }

  enum TicketPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum TicketType {
    BUG
    FEATURE
    QUESTION
    INCIDENT
    TASK
  }

  enum MessageType {
    REPLY
    INTERNAL_NOTE
    SYSTEM_EVENT
  }

  type Category {
    id: Int!
    name: String!
    color: String!
    description: String
  }

  type TeamSummary {
    id: Int!
    name: String!
  }

  type UserSummary {
    id: Int!
    name: String!
    email: String
    role: Role
  }

  type Ticket {
    id: Int!
    ticketNumber: String!
    title: String!
    description: String!
    status: TicketStatus!
    priority: TicketPriority!
    type: TicketType!
    slaResolutionDueAt: DateTime
    slaResponseDueAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    customer: UserSummary!
    assignedTo: UserSummary
    team: TeamSummary
    category: Category
    messages: [TicketMessage!]
  }

  type TicketMessage {
    id: Int!
    ticketId: Int!
    body: String!
    type: MessageType!
    createdAt: DateTime!
    sender: UserSummary!
  }

  type PaginatedTickets {
    tickets: [Ticket!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  type TicketCounts {
    open: Int!
    waiting: Int!
    resolved: Int!
  }

  input TicketFilter {
    status: TicketStatus
    priority: TicketPriority
    search: String
  }

  input CreateTicketInput {
    title: String!
    description: String!
    categoryId: Int
    priority: TicketPriority
    type: TicketType
  }

  input UpdateTicketInput {
    status: TicketStatus
    priority: TicketPriority
    assignedToId: Int
  }

  input AddMessageInput {
    ticketId: Int!
    body: String!
    type: MessageType
  }

  extend type Query {
    tickets(filter: TicketFilter, page: Int, pageSize: Int): PaginatedTickets!
    ticket(id: Int!): Ticket!
    ticketCounts: TicketCounts!
    categories: [Category!]!
  }

  extend type Mutation {
    createTicket(input: CreateTicketInput!): Ticket!
    updateTicket(id: Int!, input: UpdateTicketInput!): Ticket!
    addMessage(input: AddMessageInput!): TicketMessage!
  }

  extend type Subscription {
    messageAdded(ticketId: Int!): TicketMessage!
    ticketUpdated(ticketId: Int!): Ticket!
    ticketCreated: Ticket!
  }
`;
