import { expect, type Page } from '@playwright/test';

export async function expectLayout(page: Page, layout: string) {
  await expect(page.getByTestId('main')).toHaveAttribute('data-layout', layout);
}
