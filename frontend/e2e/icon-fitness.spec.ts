import { test, expect } from '@playwright/test';

test.describe('Icon Fitness Gym — Ashkona Platform E2E Suite', () => {
  test('Public Website Home, Membership, Trainers, Programs, Schedule, and Contact pages render', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/ICON FITNESS|UNCOMPROMISING/i);

    await page.goto('/membership');
    await expect(page.locator('h1')).toContainText(/MEMBERSHIP/i);

    await page.goto('/trainers');
    await expect(page.locator('h1')).toContainText(/COACHES|TRAINERS/i);

    await page.goto('/programs');
    await expect(page.locator('h1')).toContainText(/PROGRAMS/i);

    await page.goto('/schedule');
    await expect(page.locator('h1')).toContainText(/SCHEDULE/i);

    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText(/ASHKONA|CONTACT|VISIT/i);
  });

  test('Protected portals redirect unauthenticated visitors to Login', async ({ page }) => {
    await page.goto('/member/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/trainer/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login page renders role-based authentication form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

