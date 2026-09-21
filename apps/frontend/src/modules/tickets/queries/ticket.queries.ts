import { gql } from '@apollo/client';

export const TICKET_FIELDS = gql`
  fragment TicketFields on Ticket {
    id
    ticketNumber
    title
    description
    status
    priority
    type
    slaResolutionDueAt
    createdAt
    customer { id name email }
    assignedTo { id name }
    team { id name }
    category { id name color }
  }
`;

export const GET_TICKETS = gql`
  ${TICKET_FIELDS}
  query GetTickets($filter: TicketFilter, $page: Int, $pageSize: Int) {
    tickets(filter: $filter, page: $page, pageSize: $pageSize) {
      tickets { ...TicketFields }
      total
      page
      totalPages
    }
  }
`;

export const GET_TICKET = gql`
  ${TICKET_FIELDS}
  query GetTicket($id: Int!) {
    ticket(id: $id) {
      ...TicketFields
      slaResponseDueAt
      messages {
        id
        body
        type
        createdAt
        sender { id name role }
      }
    }
  }
`;

export const TICKET_COUNTS = gql`
  query TicketCounts {
    ticketCounts { open waiting resolved }
  }
`;

export const CATEGORIES = gql`
  query Categories {
    categories { id name color }
  }
`;

export const CREATE_TICKET = gql`
  ${TICKET_FIELDS}
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) { ...TicketFields }
  }
`;

export const UPDATE_TICKET = gql`
  ${TICKET_FIELDS}
  mutation UpdateTicket($id: Int!, $input: UpdateTicketInput!) {
    updateTicket(id: $id, input: $input) { ...TicketFields }
  }
`;

export const ADD_MESSAGE = gql`
  mutation AddMessage($input: AddMessageInput!) {
    addMessage(input: $input) {
      id
      body
      type
      createdAt
      sender { id name role }
    }
  }
`;

export const KNOWLEDGE_ARTICLES = gql`
  query KnowledgeArticles($search: String, $internal: Boolean) {
    knowledgeArticles(search: $search, internal: $internal) {
      id
      title
      body
      visibility
      updatedAt
      category { id name color }
    }
  }
`;

export const KNOWLEDGE_ARTICLE = gql`
  query KnowledgeArticle($id: Int!) {
    knowledgeArticle(id: $id) {
      id
      title
      body
      visibility
      viewCount
      updatedAt
      category { id name color }
    }
  }
`;
