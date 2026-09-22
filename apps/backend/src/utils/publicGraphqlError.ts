import { GraphQLFormattedError } from 'graphql';

export function publicGraphqlError(formattedError: GraphQLFormattedError): GraphQLFormattedError {
  const message = formattedError.message ?? '';
  const isSchemaDrift =
    message.includes('does not exist in the current database') ||
    message.includes('prisma.') ||
    formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR';

  if (!isSchemaDrift) return formattedError;

  return {
    message: 'Sign-in could not reach a matching database schema. Refresh the local database, then try again.',
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}
