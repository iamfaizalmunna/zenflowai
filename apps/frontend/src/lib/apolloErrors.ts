export function shouldClearSessionOnGraphqlError(code: unknown, hasToken: boolean): boolean {
  return code === 'UNAUTHENTICATED' && hasToken;
}

export function shouldSurfaceGraphqlError(code: unknown): boolean {
  return code !== 'FORBIDDEN' && code !== 'UNAUTHENTICATED' && code !== 'BAD_USER_INPUT';
}
