// @vitest-environment node
import { test, expect } from '@playwright/test';

test.describe('signed-out flows', () => {
  test('/projects redirects to /login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL('/login');
  });

  test('/projects/new redirects to /login', async ({ page }) => {
    await page.goto('/projects/new');
    await expect(page).toHaveURL('/login');
  });

  test('/projects/<random uuid> redirects to /login', async ({ page }) => {
    // generate a random UUID-like string
    const randomId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await page.goto(`/projects/${randomId}`);
    await expect(page).toHaveURL('/login');
  });

  test('/login and /signup render headings', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
    await page.goto('/signup');
    await expect(page.locator('h1')).toContainText('Create your account');
  });

  test.describe('responsive no horizontal overflow', () => {
    const widths = [375, 768, 1280];
    for (const width of widths) {
      test(`at width ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 667 });
        await page.goto('/login');
        // Check that the page width does not exceed viewport width
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });
    }
  });
});