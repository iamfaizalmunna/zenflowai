import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS = gql`
  query MyNotifications {
    myNotifications {
      id
      type
      title
      body
      ticketId
      isRead
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: Int!) {
    markNotificationRead(id: $id)
  }
`;
