import { test as base, expect, type Page } from '@playwright/test';
import { AUTH_SPLASH_KEY } from '../src/lib/splash';

/** Existing seeded demo users. No new sign-in path. */
export const DEMO = {
  email: 'agent@zenflowai.com',
  password: 'password123',
} as const;

export async function dismissSplash(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    sessionStorage.setItem(key, '1');
  }, AUTH_SPLASH_KEY);
}

export async function loginAsAgent(page: Page): Promise<void> {
  await dismissSplash(page);
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(DEMO.email);
  await page.getByPlaceholder('••••••••').fill(DEMO.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  await page.goto('/queue');
}

export const test = base.extend<{ skipIfAppDown: void }>({
  skipIfAppDown: [
    async ({ request }, use, testInfo) => {
      try {
        const res = await request.get('/', { timeout: 5_000 });
        if (!res.ok() && res.status() >= 500) {
          testInfo.skip(true, 'App is not up. Run pnpm dev then pnpm test:ui.');
        }
      } catch {
        testInfo.skip(true, 'App is not up. Run pnpm dev then pnpm test:ui.');
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };
