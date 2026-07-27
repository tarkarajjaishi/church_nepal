import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3200';

test.describe('Marketing flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation', () => {
    test('renders the main nav links', async ({ page }) => {
      const links = ['Home', 'Features', 'How it works', 'Pricing', 'Blog', 'About', 'Contact'];
      for (const label of links) {
        await expect(page.getByRole('link', { name: label })).toBeVisible();
      }
    });

    test('navigates to pricing through the nav', async ({ page }) => {
      await page.getByRole('link', { name: 'Pricing' }).click();
      await expect(page).toHaveURL(`${BASE_URL}/pricing`);
    });

    test('opens and closes mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /open menu/i }).click();
      await expect(page.getByRole('link', { name: 'Home' }).last()).toBeVisible();

      await page.getByRole('button', { name: /close menu/i }).click();
      await expect(page.getByRole('link', { name: 'Home' }).last()).not.toBeVisible();
    });
  });

  test.describe('Pricing', () => {
    test('shows pricing plans', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Simple, transparent pricing' })).toBeVisible();
      await expect(page.getByText('Free')).toBeVisible();
      await expect(page.getByText('Standard')).toBeVisible();
      await expect(page.getByText('Pro')).toBeVisible();
    });
  });

  test.describe('Signup wizard', () => {
    test('completes the 4-step signup flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
      await page.waitForLoadState('networkidle');

      // Step 1: Church details
      await expect(page.getByText('Step 1 of 4')).toBeVisible();
      await page.getByLabel('Church name').fill('Grace Community Church');
      await page.getByRole('button', { name: 'Next' }).click();

      // Step 2: Admin account
      await expect(page.getByText('Step 2 of 4')).toBeVisible();
      await page.getByLabel('Full name').fill('John Doe');
      await page.getByLabel('Email').fill('john@example.com');
      await page.getByLabel('Password').fill('securepass123');
      await page.getByLabel('Confirm password').fill('securepass123');
      await page.getByRole('button', { name: 'Next' }).click();

      // Step 3: Plan
      await expect(page.getByText('Step 3 of 4')).toBeVisible();
      await page.getByText('Standard').click();
      await page.getByRole('button', { name: 'Next' }).click();

      // Step 4: Review and submit
      await expect(page.getByText('Step 4 of 4')).toBeVisible();
      await page.locator('#terms').check();
      await page.getByRole('button', { name: 'Create my church' }).click();

      // Success
      await expect(page.getByText('Your church site is being provisioning')).toBeVisible();
      await expect(page.getByText('grace-community-church.churchnepal.com')).toBeVisible();
    });
  });

  test.describe('Blog', () => {
    test('lists posts and navigates to detail', async ({ page }) => {
      await page.goto(`${BASE_URL}/blog`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'ChurchNepal Blog' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Getting Started with ChurchNepal/ })).toBeVisible();

      await page.getByRole('link', { name: /Getting Started with ChurchNepal/ }).click();
      await expect(page).toHaveURL(`${BASE_URL}/blog/getting-started-with-churchnepal`);
      await expect(page.getByRole('heading', { name: 'Getting Started with ChurchNepal' })).toBeVisible();
    });
  });

  test.describe('Language switch', () => {
    test('switches to Nepali and persists after reload', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`);
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /EN/ }).click();
      await page.getByRole('menuitem', { name: 'नेपाली' }).click();

      await expect(page.getByRole('button', { name: /ने/ })).toBeVisible();

      await page.reload();
      await expect(page.getByRole('button', { name: /ने/ })).toBeVisible();
    });
  });

  test.describe('Contact', () => {
    test('renders form fields and shows validation errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /Request a Demo/ })).toBeVisible();
      await expect(page.getByLabel('Name *')).toBeVisible();
      await expect(page.getByLabel('Email *')).toBeVisible();
      await expect(page.getByLabel('Church Name *')).toBeVisible();
      await expect(page.getByLabel('Message *')).toBeVisible();

      await page.getByRole('button', { name: /Send Message/ }).click();
      await expect(page.getByText('Name is required')).toBeVisible();
      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Church name is required')).toBeVisible();
      await expect(page.getByText('Message is required')).toBeVisible();
    });
  });
});
