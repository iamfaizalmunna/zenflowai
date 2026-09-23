'use client';

import { ApolloClient, InMemoryCache, Observable, createHttpLink, from, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createClient } from 'graphql-ws';
import { shouldSurfaceGraphqlError } from '@/lib/apolloErrors';

const graphqlHttp = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
const graphqlWs = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessFromCookie(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const res = await fetch(graphqlHttp, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation RefreshToken { refreshToken { accessToken } }',
      }),
    });
    const json = (await res.json()) as { data?: { refreshToken?: { accessToken?: string } } };
    const accessToken = json?.data?.refreshToken?.accessToken;
    if (!accessToken) return false;
    localStorage.setItem('zenflow_token', accessToken);
    return true;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function kickToLogin(): void {
  localStorage.removeItem('zenflow_token');
  localStorage.removeItem('zenflow-auth');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

const httpLink = createHttpLink({
  uri: graphqlHttp,
  credentials: 'include',
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

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      if (shouldSurfaceGraphqlError(extensions?.code)) {
        console.error(`[GraphQL Error]: ${message}`);
      }
    });
    const unauth = graphQLErrors.some((err) => err.extensions?.code === 'UNAUTHENTICATED');
    const hasToken = Boolean(typeof window !== 'undefined' && localStorage.getItem('zenflow_token'));
    if (unauth && hasToken && operation.operationName !== 'RefreshToken') {
      return new Observable((observer) => {
        let inner: { unsubscribe: () => void } | undefined;
        void refreshAccessFromCookie()
          .then((ok) => {
            if (!ok) {
              kickToLogin();
              observer.error(graphQLErrors[0]);
              return;
            }
            inner = forward(operation).subscribe({
              next: (value) => observer.next(value),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          })
          .catch((err) => {
            kickToLogin();
            observer.error(err);
          });
        return () => inner?.unsubscribe();
      });
    }
  }
  if (networkError && !('statusCode' in networkError && networkError.statusCode === 429)) {
    console.error(`[Network Error]: ${networkError}`);
  }
});

const httpChain = from([errorLink, authLink, httpLink]);

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
    watchQuery: { fetchPolicy: 'cache-first', errorPolicy: 'all' },
    query: { fetchPolicy: 'cache-first', errorPolicy: 'all' },
  },
});
