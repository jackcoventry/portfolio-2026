import { test, expect } from '@playwright/test';

test('homepage renders and has a main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading').first()).toBeVisible();
});
