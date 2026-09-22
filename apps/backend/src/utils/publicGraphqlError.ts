import { GraphQLFormattedError } from 'graphql';

export function publicGraphqlError(formattedError: GraphQLFormattedError): GraphQLFormattedError {
  const message = formattedError.message ?? '';
  const isSchemaDrift =
    /does not exist in the current database/i.test(message) ||
    /the table [`']?\w+[.`']?\w*[`']? does not exist/i.test(message) ||
    /unknown column/i.test(message);

  if (!isSchemaDrift) return formattedError;

  return {
    message: 'Sign-in could not reach a matching database schema. Refresh the local database, then try again.',
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}
