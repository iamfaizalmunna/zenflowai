/**
 * Live GraphQL walk: login → me → tickets → notices.
 * Skips when the API is down so CI stays Prisma-free.
 */
const URL = process.env.E2E_GRAPHQL_URL || 'http://localhost:4000/graphql';
const EMAIL = process.env.E2E_EMAIL || 'customer@zenflowai.com';
const PASSWORD = process.env.E2E_PASSWORD || 'password123';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

interface GqlResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function gql<T>(query: string, variables?: Record<string, unknown>, token?: string): Promise<GqlResult<T>> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      'User-Agent': UA,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()) as GqlResult<T>;
}

async function main(): Promise<void> {
  let health: Response;
  try {
    health = await fetch(URL.replace(/\/graphql$/, '/health'), { headers: { 'User-Agent': UA } });
  } catch {
    console.log('e2e skip: API not running at', URL);
    return;
  }
  if (!health.ok) {
    console.log('e2e skip: health not ok');
    return;
  }

  const login = await gql<{ login: { accessToken: string; user: { role: string } } }>(
    `mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) { accessToken user { role } }
    }`,
    { email: EMAIL, password: PASSWORD }
  );
  const token = login.data?.login.accessToken;
  if (!token) {
    throw new Error(`login failed: ${JSON.stringify(login.errors ?? login)}`);
  }

  const me = await gql<{ me: { email: string } }>(`query { me { email } }`, undefined, token);
  if (me.data?.me?.email !== EMAIL) throw new Error('me mismatch');

  const tickets = await gql<{ tickets: { total: number } }>(
    `query { tickets(page: 1, pageSize: 5) { total } }`,
    undefined,
    token
  );
  if (typeof tickets.data?.tickets.total !== 'number') throw new Error('tickets failed');

  const notices = await gql<{ myNotifications: unknown[] }>(
    `query { myNotifications { id title } }`,
    undefined,
    token
  );
  if (!Array.isArray(notices.data?.myNotifications)) throw new Error('notices failed');

  console.log('e2e ok', {
    role: login.data?.login.user.role,
    tickets: tickets.data?.tickets.total,
    notices: notices.data?.myNotifications.length,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
