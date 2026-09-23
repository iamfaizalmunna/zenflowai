import { test, expect, dismissSplash } from './helpers';

test.describe('public UI (no sign-in)', () => {
  test('login form is on screen', async ({ page }) => {
    await dismissSplash(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('QA report v1 renders', async ({ page }) => {
    await page.goto('/qa/v1');
    await expect(page.getByRole('heading', { name: /what the test pack covers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /phase charts/i })).toBeVisible();
  });

  test('phase gallery renders', async ({ page }) => {
    await page.goto('/qa/phases');
    await expect(page.getByRole('heading', { name: /phases 1/i })).toBeVisible();
    await expect(page.getByRole('link', { name: '7 Nova' }).first()).toBeVisible();
  });
});
