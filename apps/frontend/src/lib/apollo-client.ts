'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// Auth link — attach JWT from localStorage
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zenflow_token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error link — global error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      if (extensions?.code === 'UNAUTHENTICATED') {
        localStorage.removeItem('zenflow_token');
        window.location.href = '/login';
      }
      console.error(`[GraphQL Error]: ${message}`);
    });
  }
  if (networkError) {
    console.error(`[Network Error]: ${networkError}`);
  }
});

// ─── Persisted Queries Link (APQ - saves tokens!) ───────────────────────────
// Instead of sending full query string each time, sends a SHA-256 hash.
// Server looks up the hash, returns 200 if found, or asks for the full query.
const persistedQueriesLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true, // Use GET for cache-friendly persisted queries
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, persistedQueriesLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tickets: {
            keyArgs: ['filter', 'orderBy'],
            merge(existing, incoming) {
              return incoming; // Simple replace strategy; use pagination merge for cursor-based
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
