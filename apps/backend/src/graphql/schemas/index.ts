import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ─── Enums ────────────────────────────────────────────────────────────

  enum Role {
    ADMIN
    AGENT
    CUSTOMER
  }

  enum TicketStatus {
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
    CRITICAL
  }

  enum TicketType {
    BUG
    FEATURE_REQUEST
    QUESTION
    INCIDENT
    TASK
  }

  # ─── Types ────────────────────────────────────────────────────────────

  type User {
    id: Int!
    email: String!
    name: String!
    role: Role!
    avatar: String
    createdAt: DateTime!
    updatedAt: DateTime!
    createdTickets: [Ticket!]!
    assignedTickets: [Ticket!]!
    savedQueries: [SavedQuery!]!
  }

  type Team {
    id: Int!
    name: String!
    description: String
    createdAt: DateTime!
    tickets: [Ticket!]!
  }

  type Category {
    id: Int!
    name: String!
    description: String
    color: String
    tickets: [Ticket!]!
  }

  type Tag {
    id: Int!
    name: String!
    color: String
  }

  type Ticket {
    id: Int!
    title: String!
    description: String!
    status: TicketStatus!
    priority: TicketPriority!
    type: TicketType!
    dueDate: DateTime
    resolvedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: User!
    assignedTo: User
    team: Team
    category: Category
    comments: [Comment!]!
    tags: [Tag!]!
    attachments: [Attachment!]!
    activities: [Activity!]!
    isBookmarked: Boolean
  }

  type Comment {
    id: Int!
    body: String!
    isInternal: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    author: User!
    ticket: Ticket!
  }

  type Attachment {
    id: Int!
    filename: String!
    url: String!
    mimeType: String!
    size: Int!
    createdAt: DateTime!
  }

  type Activity {
    id: Int!
    action: String!
    description: String!
    metadata: JSON
    createdAt: DateTime!
  }

  type Notification {
    id: Int!
    title: String!
    body: String!
    read: Boolean!
    createdAt: DateTime!
  }

  # ─── GraphQL Superpowers ───────────────────────────────────────────────

  type SavedQuery {
    id: Int!
    name: String!
    description: String
    query: String!
    hash: String!
    variables: JSON
    isBookmarked: Boolean!
    tags: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BookmarkedNode {
    id: Int!
    nodeType: String!
    nodeId: Int!
    label: String
    color: String
    createdAt: DateTime!
  }

  # ─── Inputs ───────────────────────────────────────────────────────────

  input TicketFilter {
    status: TicketStatus
    priority: TicketPriority
    type: TicketType
    assignedToId: Int
    categoryId: Int
    search: String
  }

  input TicketOrderBy {
    field: String!
    direction: String! # ASC | DESC
  }

  input CreateTicketInput {
    title: String!
    description: String!
    priority: TicketPriority
    type: TicketType
    dueDate: DateTime
    assignedToId: Int
    teamId: Int
    categoryId: Int
    tagIds: [Int!]
  }

  input UpdateTicketInput {
    title: String
    description: String
    status: TicketStatus
    priority: TicketPriority
    type: TicketType
    dueDate: DateTime
    assignedToId: Int
    teamId: Int
    categoryId: Int
    tagIds: [Int!]
  }

  input CreateCommentInput {
    ticketId: Int!
    body: String!
    isInternal: Boolean
  }

  input SaveQueryInput {
    name: String!
    description: String
    query: String!
    variables: JSON
    tags: String
  }

  input BookmarkNodeInput {
    nodeType: String!
    nodeId: Int!
    label: String
    color: String
  }

  # ─── Pagination ───────────────────────────────────────────────────────

  type PaginatedTickets {
    tickets: [Ticket!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  # ─── Auth ─────────────────────────────────────────────────────────────

  type AuthPayload {
    token: String!
    user: User!
  }

  # ─── Stats ────────────────────────────────────────────────────────────

  type TicketStats {
    total: Int!
    open: Int!
    inProgress: Int!
    resolved: Int!
    closed: Int!
    byPriority: JSON!
    byType: JSON!
  }

  # ─── Queries ──────────────────────────────────────────────────────────

  type Query {
    # Tickets
    tickets(
      filter: TicketFilter
      orderBy: TicketOrderBy
      page: Int
      pageSize: Int
    ): PaginatedTickets!

    ticket(id: Int!): Ticket

    ticketStats: TicketStats!

    # Users
    me: User
    users(role: Role): [User!]!
    user(id: Int!): User

    # Categories & Tags
    categories: [Category!]!
    tags: [Tag!]!

    # Notifications
    notifications: [Notification!]!

    # GraphQL Superpowers
    savedQueries: [SavedQuery!]!
    savedQuery(id: Int!): SavedQuery
    bookmarkedNodes(nodeType: String): [BookmarkedNode!]!
  }

  # ─── Mutations ────────────────────────────────────────────────────────

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, name: String!, password: String!, role: Role): AuthPayload!

    # Tickets
    createTicket(input: CreateTicketInput!): Ticket!
    updateTicket(id: Int!, input: UpdateTicketInput!): Ticket!
    deleteTicket(id: Int!): Boolean!
    assignTicket(ticketId: Int!, userId: Int!): Ticket!
    resolveTicket(id: Int!): Ticket!

    # Comments
    addComment(input: CreateCommentInput!): Comment!
    deleteComment(id: Int!): Boolean!

    # GraphQL Superpowers: Save & Bookmark
    saveQuery(input: SaveQueryInput!): SavedQuery!
    deleteQuery(id: Int!): Boolean!
    toggleQueryBookmark(id: Int!): SavedQuery!

    bookmarkNode(input: BookmarkNodeInput!): BookmarkedNode!
    removeBookmark(nodeType: String!, nodeId: Int!): Boolean!

    # Notifications
    markNotificationRead(id: Int!): Notification!
    markAllNotificationsRead: Boolean!
  }

  # ─── Subscriptions ────────────────────────────────────────────────────

  type Subscription {
    ticketUpdated(id: Int): Ticket!
    ticketCreated: Ticket!
    commentAdded(ticketId: Int!): Comment!
  }
`;
