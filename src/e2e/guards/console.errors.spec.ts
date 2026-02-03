/***
 * Console Errors
 * This file is to test for any console errors
 ***/

import { test, expect } from '@playwright/test';
import { ROUTES } from '@/e2e/helpers/routes';

test('No console errors on key pages', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  for (const path of [ROUTES.home, ROUTES.listing, ROUTES.page, ROUTES.post]) {
    await page.goto(path);
  }

  expect(errors, errors.join('\n')).toEqual([]);
});
