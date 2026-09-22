import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $name: String!, $password: String!) {
    register(email: $email, name: $name, password: $password) {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
    }
  }
`;
