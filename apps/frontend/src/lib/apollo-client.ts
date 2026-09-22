'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { createClient } from 'graphql-ws';
import { sha256 } from 'crypto-hash';
import { shouldClearSessionOnGraphqlError, shouldSurfaceGraphqlError } from '@/lib/apolloErrors';

const graphqlHttp = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
const graphqlWs = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';

const httpLink = createHttpLink({
  uri: graphqlHttp,
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zenflow_token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      const code = extensions?.code;
      const hasToken = Boolean(typeof window !== 'undefined' && localStorage.getItem('zenflow_token'));
      if (shouldClearSessionOnGraphqlError(code, hasToken)) {
        localStorage.removeItem('zenflow_token');
        localStorage.removeItem('zenflow-auth');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      if (shouldSurfaceGraphqlError(code)) {
        console.error(`[GraphQL Error]: ${message}`);
      }
    });
  }
  if (networkError && !('statusCode' in networkError && networkError.statusCode === 429)) {
    console.error(`[Network Error]: ${networkError}`);
  }
});

const persistedQueriesLink = createPersistedQueryLink({
  sha256,
});

const httpChain = from([errorLink, persistedQueriesLink, authLink, httpLink]);

function makeWsLink() {
  return new GraphQLWsLink(
    createClient({
      url: graphqlWs,
      connectionParams: () => {
        const token = localStorage.getItem('zenflow_token');
        return { authorization: token ? `Bearer ${token}` : '' };
      },
    })
  );
}

const splitLink =
  typeof window === 'undefined'
    ? httpChain
    : split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return def.kind === 'OperationDefinition' && def.operation === 'subscription';
        },
        makeWsLink(),
        httpChain
      );

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tickets: {
            keyArgs: ['filter', 'orderBy'],
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
  },
});
