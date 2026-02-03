import { test, expect } from '@playwright/test';
import { ROUTES } from '@/e2e/helpers/routes';
import { expectLayout } from '@/e2e/helpers/expectLayout';

test.describe('Navigation', () => {
  test('Nav can reach Blog listing', async ({ page }) => {
    await page.goto(ROUTES.home);
    const mainNav = page.getByRole('navigation', {
      name: /Primary/i,
    });

    await mainNav.getByRole('link', { name: /blog/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await expectLayout(page, 'listing');
  });

  test('Nav can reach a text page', async ({ page }) => {
    await page.goto(ROUTES.home);
    const footerNav = page.getByRole('navigation', {
      name: /Footer/i,
    });

    await footerNav.getByRole('link', { name: /privacy/i }).click();
    await expectLayout(page, 'page');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
