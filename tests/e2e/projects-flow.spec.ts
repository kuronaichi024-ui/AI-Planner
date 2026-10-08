// @vitest-environment node
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const TEST_USER_A_EMAIL = process.env.TEST_USER_A_EMAIL ?? '';

const hasSupabase = SUPABASE_URL.endsWith('.supabase.co') && !!TEST_USER_A_EMAIL;

// Build a unique email from the A address with a plus tag
function buildUniqueEmail(): string {
  if (!TEST_USER_A_EMAIL) return '';
  const [local, domain] = TEST_USER_A_EMAIL.split('@');
  // if already has plus, strip and re-add
  const baseLocal = local.split('+')[0];
  const timestamp = Date.now();
  return `${baseLocal}+e2e${timestamp}@${domain}`;
}

const E2E_PASSWORD = 'TestPass123!';

test.skip(!hasSupabase, 'Needs a real Supabase URL and TEST_USER_A_EMAIL in env');

test.describe.serial('project flow', () => {
  let uniqueEmail: string;

  test.beforeAll(() => {
    uniqueEmail = buildUniqueEmail();
  });

  test('1. Sign up lands on /projects with empty state', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /create your account|creating account/i }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText(/no projects yet/i)).toBeVisible();
  });

  test('2. New project: idea flow', async ({ page }) => {
    // Sign in first
    await page.goto('/login');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /sign in|signing in/i }).click();
    await expect(page).toHaveURL(/\/projects$/);

    // Go to new project
    await page.getByRole('link', { name: /new project/i }).click();
    await expect(page).toHaveURL(/\/projects\/new$/);

    const idea = 'A music streaming app with playlists and social features';
    const textarea = page.getByRole('textbox', { name: /what do you want to build/i });
    await textarea.fill(idea.substring(0, 9));
    // button disabled before 10 chars
    await expect(page.getByRole('button', { name: /start planning/i })).toBeDisabled();

    await textarea.fill(idea);
    await expect(page.getByRole('button', { name: /start planning/i })).toBeEnabled();
    await page.getByRole('button', { name: /start planning/i }).click();

    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]{36}$/);
    // Header shows first 60 chars as name
    const expectedName = idea.substring(0, 60);
    await expect(page.locator('header')).toContainText(expectedName);
  });

  test('3. Project listed on dashboard and opens', async ({ page }) => {
    await signIn(page, uniqueEmail, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/projects$/);

    // The card should be listed
    const firstCard = page.locator('[data-testid="project-card"], a[href^="/projects/"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]{36}/);
  });

  test('4. All 11 nav sections open', async ({ page }) => {
    await signIn(page, uniqueEmail, E2E_PASSWORD);
    // Navigate to the first project
    const firstCard = page.locator('a[href^="/projects/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]{36}/);

    const projectId = page.url().match(/\/projects\/([a-f0-9-]{36})/)?.[1] ?? '';
    const sections = [
      '',
      'requirements',
      'features',
      'roles',
      'screens',
      'data-model',
      'rules',
      'decisions',
      'prd',
      'build-plan',
      'agent-prompt',
    ];

    for (const section of sections) {
      const url = section === '' ? `/projects/${projectId}` : `/projects/${projectId}/${section}`;
      await page.goto(url);
      // Overview shows idea; others show "Coming in a later phase"
      if (section === '') {
        await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
      } else {
        await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/${section}$`));
        await expect(page.getByText(/coming in a later phase/i)).toBeVisible();
      }
    }
  });

  test('5. Rename: new name persists after reload', async ({ page }) => {
    await signIn(page, uniqueEmail, E2E_PASSWORD);
    const firstCard = page.locator('a[href^="/projects/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]{36}/);

    // Click Rename
    await page.getByRole('button', { name: /rename/i }).click();
    const input = page.getByRole('textbox', { name: /project name|name/i });
    const newName = `Renamed Project ${Date.now()}`;
    await input.fill(newName);
    await page.getByRole('button', { name: /save/i }).click();

    // Reload and verify
    await page.reload();
    await expect(page.locator('header')).toContainText(newName);

    // Verify on dashboard card
    await page.goto('/projects');
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('6. Responsive: no overflow at multiple widths', async ({ page, browser }) => {
    await signIn(page, uniqueEmail, E2E_PASSWORD);
    const firstCard = page.locator('a[href^="/projects/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]{36}/);

    const projectId = page.url().match(/\/projects\/([a-f0-9-]{36})/)?.[1] ?? '';

    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 667 });
      await page.goto(`/projects/${projectId}`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);

      if (width >= 1024) {
        // nav and architect column visible
        await expect(page.getByRole('navigation', { name: /project sections/i })).toBeVisible();
        // Architect column visible
        await expect(page.getByText(/architect/i).first()).toBeVisible();
      } else {
        // menu button opens nav sheet
        await page.getByRole('button', { name: /menu|open menu/i }).click();
        await expect(page.getByRole('navigation', { name: /project sections/i })).toBeVisible();
        await page.keyboard.press('Escape');
        // floating button opens architect sheet
        const fab = page.getByRole('button', { name: /open architect/i });
        await fab.click();
        await expect(page.getByText(/architect/i).first()).toBeVisible();
        await page.keyboard.press('Escape');
      }
    }
  });

  test('7. 404: other user cannot access project; random UUID 404s', async ({ browser }) => {
    // First, capture the project URL from the primary user
    const primaryPage = await browser.newPage();
    await signIn(primaryPage, uniqueEmail, E2E_PASSWORD);
    const firstCard = primaryPage.locator('a[href^="/projects/"]').first();
    await firstCard.click();
    await expect(primaryPage).toHaveURL(/\/projects\/[a-f0-9-]{36}/);
    const projectUrl = primaryPage.url();
    const projectId = projectUrl.match(/\/projects\/([a-f0-9-]{36})/)?.[1] ?? '';
    await primaryPage.close();

    // Second user
    const secondEmail = buildUniqueEmail();
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await page2.goto('/signup');
    await page2.getByLabel('Email').fill(secondEmail);
    await page2.getByLabel('Password').fill(E2E_PASSWORD);
    await page2.getByRole('button', { name: /create your account|creating account/i }).click();
    await expect(page2).toHaveURL(/\/projects$/);

    // Request first user's project URL
    const response = await page2.goto(projectUrl);
    expect(response?.status()).toBe(404);

    // Random UUID also 404
    const randomUuid = '00000000-0000-0000-0000-000000000000';
    const resp2 = await page2.goto(`/projects/${randomUuid}`);
    expect(resp2?.status()).toBe(404);

    await ctx2.close();
  });

  test('8. Delete: wrong text disabled, exact name deletes', async ({ page }) => {
    await signIn(page, uniqueEmail, E2E_PASSWORD);
    const firstCard = page.locator('a[href^="/projects/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]{36}/);

    // Get the project name from the header
    const projectName = await page.locator('header').textContent();
    const name = projectName?.trim() ?? '';

    // Open delete dialog
    await page.getByRole('button', { name: /delete project/i }).click();
    const confirmInput = page.getByRole('textbox', { name: /type the project name/i });
    const deleteBtn = page.getByRole('button', { name: /delete project/i });

    // Wrong text keeps button disabled
    await confirmInput.fill('wrong text');
    await expect(deleteBtn).toBeDisabled();

    // Exact name enables and deletes
    await confirmInput.fill(name);
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText(/no projects yet/i)).toBeVisible();
  });

  test('9. Sign out lands on /login; /projects redirects to /login', async ({ page }) => {
    await signIn(page, uniqueEmail, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/projects$/);

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL('/login');

    // /projects redirects to /login
    await page.goto('/projects');
    await expect(page).toHaveURL('/login');
  });
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  test.info(); // touch
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in|signing in/i }).click();
}