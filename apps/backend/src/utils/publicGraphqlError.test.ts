import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { publicGraphqlError } from './publicGraphqlError';

describe('public GraphQL errors', () => {
  it('hides Prisma schema-drift stack traces from the login screen', () => {
    const result = publicGraphqlError({
      message: "The column `zenflowai.users.isAiConsultant` does not exist in the current database.",
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
    assert.equal(result.extensions?.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(result.message.includes('does not exist'), false);
    assert.equal(result.message.includes('isAiConsultant'), false);
    assert.match(result.message, /database schema/i);
  });
});
