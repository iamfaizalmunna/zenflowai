import { test, expect, loginAsAgent } from './helpers';
import type { Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function expectPanelInViewport(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Notifications' }).click();
  const panel = page.getByRole('dialog', { name: 'Notification list' });
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  const vp = page.viewportSize();
  expect(box).toBeTruthy();
  expect(vp).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp!.height);
}

test.describe('queue UI (existing demo agent)', () => {
  test('queue heading and notice panel stay on screen', async ({ page }) => {
    await loginAsAgent(page);
    await expect(page.getByRole('heading', { name: 'Ticket queue' })).toBeVisible();
    await expect(page.getByPlaceholder('Search this pack…')).toBeVisible();
    await expectPanelInViewport(page);
  });
});

test.describe('queue UI mobile notice panel', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('top notice popover stays inside the viewport', async ({ page }) => {
    await loginAsAgent(page);
    await expect(page.getByRole('heading', { name: 'Ticket queue' })).toBeVisible();
    await expectPanelInViewport(page);
  });
});
