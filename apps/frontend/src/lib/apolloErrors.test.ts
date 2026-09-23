import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldClearSessionOnGraphqlError, shouldSurfaceGraphqlError } from './apolloErrors';

describe('GraphQL client error policy', () => {
  it('only clears a session when a token was sent and the API says unauthenticated', () => {
    assert.equal(shouldClearSessionOnGraphqlError('UNAUTHENTICATED', true), true);
    assert.equal(shouldClearSessionOnGraphqlError('UNAUTHENTICATED', false), false);
    assert.equal(shouldClearSessionOnGraphqlError('FORBIDDEN', true), false);
  });

  it('does not treat expected RBAC and validation errors as console crashes', () => {
    assert.equal(shouldSurfaceGraphqlError('FORBIDDEN'), false);
    assert.equal(shouldSurfaceGraphqlError('UNAUTHENTICATED'), false);
    assert.equal(shouldSurfaceGraphqlError('BAD_USER_INPUT'), false);
    assert.equal(shouldSurfaceGraphqlError('INTERNAL_SERVER_ERROR'), false);
    assert.equal(shouldSurfaceGraphqlError('UNAUTHORIZED'), false);
    assert.equal(shouldSurfaceGraphqlError('GRAPHQL_VALIDATION_FAILED'), true);
  });
});
