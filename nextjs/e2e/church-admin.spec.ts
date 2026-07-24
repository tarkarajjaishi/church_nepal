import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo, seedChurchAndAdmin, createTemporaryPng } from './admin-utils';

const BASE_URL = 'http://localhost:3000';
let ADMIN_EMAIL = '';
let ADMIN_PASSWORD = '';

const newSermon = (idx: number) => ({
  title: `E2E Sermon ${idx}`,
  speaker: `Speaker ${idx}`,
  date: 'July 20, 2026',
  duration: `${30 + idx} min`,
  series: 'E2E Series',
  topic: 'Testing',
  image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400',
  description: `Test sermon description for sermon ${idx}.`,
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
});

const newEvent = (idx: number) => ({
  title: `E2E Event ${idx}`,
  displayDate: `Aug ${10 + idx}, 2026`,
  date: `2026-08-${10 + idx < 10 ? '0' + (10 + idx) : 10 + idx}T10:00:00`,
  time: '10:00 AM',
  location: `Test Venue ${idx}`,
  image: 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?w=400',
  description: `Test event description for event ${idx}.`,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openSermonCreateForm(page: Page) {
  await navigateTo(page, '/admin/sermons');
  await page.waitForSelector('h1:has-text("Sermons")', { timeout: 10000 });
  await page.getByRole('button', { name: /Add Sermon/i }).click();
  await page.waitForSelector('input[name="title"]', { timeout: 5000 });
}

async function openEventCreateForm(page: Page) {
  await navigateTo(page, '/admin/events');
  await page.waitForSelector('h1:has-text("Events")', { timeout: 10000 });
  await page.getByRole('button', { name: /Add Event/i }).click();
  await page.waitForSelector('input[name="title"]', { timeout: 5000 });
}

async function fillSermonForm(page: Page, s: ReturnType<typeof newSermon>) {
  await page.getByLabel('Title').fill(s.title);
  await page.getByLabel('Speaker').fill(s.speaker);
  await page.getByLabel('Date').fill(s.date);
  await page.getByLabel('Duration').fill(s.duration);
  await page.getByLabel('Series').fill(s.series);
  await page.getByLabel('Topic').fill(s.topic);
  await page.getByLabel('Image URL').fill(s.image);

  const descField = page.locator('[data-testid="rich-text-editor"]').or(
    page.locator('.ProseMirror').first(),
  );
  await descField.click();
  await descField.fill(s.description);

  await page.getByLabel('Video URL').fill(s.videoUrl);
}

async function fillEventForm(page: Page, e: ReturnType<typeof newEvent>) {
  await page.getByLabel('Title').fill(e.title);
  await page.getByLabel('Display Date').fill(e.displayDate);
  await page.getByLabel('Date (ISO)').fill(e.date);
  await page.getByLabel('Time').fill(e.time);
  await page.getByLabel('Location').fill(e.location);
  await page.getByLabel('Image URL').fill(e.image);
}

async function submitForm(page: Page) {
  await page.getByRole('button', { name: /Save/i }).click();
  await page.waitForTimeout(1500);
}

async function openBroadcastForm(page: Page) {
  await navigateTo(page, '/admin/broadcasts');
  await page.waitForSelector('h1:has-text("Broadcasts")', { timeout: 10000 });
  await page.getByRole('button', { name: /New Broadcast/i }).click();
  await page.waitForSelector('input[name="subject"]', { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Global setup: provision church + get credentials
// ---------------------------------------------------------------------------

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    const seed = await seedChurchAndAdmin(page.request);
    ADMIN_EMAIL = seed.email;
    ADMIN_PASSWORD = seed.password;
    console.log(`Seeded church: slug=${seed.slug}, email=${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('Failed to seed church via control plane:', err);
    throw err;
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe('Church Admin E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await loginAsAdmin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  // ---------------------------------------------------------------------------
  // Signup / Church provisioning (via control plane API — covered in beforeAll)
  // ---------------------------------------------------------------------------

  test.describe('Seeded church + admin', () => {
    test('admin can log in and reach the dashboard', async ({ page }) => {
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
      await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
    });

    test('seeded admin email is a valid role admin account', async ({ page }) => {
      await navigateTo(page, '/admin/profile');
      await expect(page.getByText(/Admin/i)).toBeVisible({ timeout: 5000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Sermons CRUD
  // ---------------------------------------------------------------------------

  test.describe('Sermons CRUD', () => {
    let createdSermonTitle: string;

    test('create a sermon', async ({ page }) => {
      await navigateTo(page, '/admin/sermons');
      await openSermonCreateForm(page);

      createdSermonTitle = `E2E Sermon ${Date.now()}`;
      const s = { ...newSermon(Date.now()), title: createdSermonTitle };
      await fillSermonForm(page, s);
      await submitForm(page);

      await expect(page.getByText(createdSermonTitle)).toBeVisible({ timeout: 10000 });
    });

    test('edit the sermon', async ({ page }) => {
      await navigateTo(page, '/admin/sermons');
      await page.waitForSelector('table', { timeout: 10000 });

      const row = page.locator('table tbody tr').filter({ hasText: createdSermonTitle });
      if ((await row.count()) === 0) {
        createdSermonTitle = `E2E Sermon ${Date.now()}`;
      }

      const target = page.locator('table tbody tr').filter({ hasText: createdSermonTitle });
      const editBtn = target.getByRole('button', { name: /Edit/i });
      if (await editBtn.count() === 0) {
        await openSermonCreateForm(page);
        const s = { ...newSermon(Date.now()), title: createdSermonTitle };
        await fillSermonForm(page, s);
        await submitForm(page);
      }

      const editRow = page.locator('table tbody tr').filter({ hasText: createdSermonTitle });
      await editRow.getByRole('button', { name: /Edit/i }).click();
      await page.waitForSelector('input[name="title"]', { timeout: 5000 });

      const updatedTitle = `${createdSermonTitle} (edited)`;
      await page.getByLabel('Title').fill(updatedTitle);
      await submitForm(page);

      await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
      createdSermonTitle = updatedTitle;
    });

    test('delete the sermon', async ({ page }) => {
      await navigateTo(page, '/admin/sermons');
      await page.waitForSelector('table', { timeout: 10000 });

      const row = page.locator('table tbody tr').filter({ hasText: createdSermonTitle });
      if ((await row.count()) === 0) {
        await openSermonCreateForm(page);
        const s = { ...newSermon(Date.now()), title: createdSermonTitle };
        await fillSermonForm(page, s);
        await submitForm(page);
      }

      await page.once('dialog', d => d.accept());
      const targetRow = page.locator('table tbody tr').filter({ hasText: createdSermonTitle });
      await targetRow.getByRole('button', { name: /Delete/i }).click();
      await page.waitForTimeout(1500);

      await expect(page.getByText(createdSermonTitle)).not.toBeVisible({ timeout: 5000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Events CRUD
  // ---------------------------------------------------------------------------

  test.describe('Events CRUD', () => {
    let createdEventTitle: string;

    test('create an event', async ({ page }) => {
      await navigateTo(page, '/admin/events');
      await openEventCreateForm(page);

      createdEventTitle = `E2E Event ${Date.now()}`;
      const ev = { ...newEvent(Date.now()), title: createdEventTitle };
      await fillEventForm(page, ev);
      await submitForm(page);

      await expect(page.getByText(createdEventTitle)).toBeVisible({ timeout: 10000 });
    });

    test('edit the event', async ({ page }) => {
      await navigateTo(page, '/admin/events');
      await page.waitForSelector('table', { timeout: 10000 });

      const target = page.locator('table tbody tr').filter({ hasText: createdEventTitle });
      if ((await target.count()) === 0) {
        await openEventCreateForm(page);
        const ev = { ...newEvent(Date.now()), title: createdEventTitle };
        await fillEventForm(page, ev);
        await submitForm(page);
      }

      const editRow = page.locator('table tbody tr').filter({ hasText: createdEventTitle });
      await editRow.getByRole('button', { name: /Edit/i }).click();
      await page.waitForSelector('input[name="title"]', { timeout: 5000 });

      const updatedTitle = `${createdEventTitle} (edited)`;
      await page.getByLabel('Title').fill(updatedTitle);
      await submitForm(page);

      await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
      createdEventTitle = updatedTitle;
    });

    test('delete the event', async ({ page }) => {
      await navigateTo(page, '/admin/events');
      await page.waitForSelector('table', { timeout: 10000 });

      const row = page.locator('table tbody tr').filter({ hasText: createdEventTitle });
      if ((await row.count()) === 0) {
        await openEventCreateForm(page);
        const ev = { ...newEvent(Date.now()), title: createdEventTitle };
        await fillEventForm(page, ev);
        await submitForm(page);
      }

      await page.once('dialog', d => d.accept());
      const targetRow = page.locator('table tbody tr').filter({ hasText: createdEventTitle });
      await targetRow.getByRole('button', { name: /Delete/i }).click();
      await page.waitForTimeout(1500);

      await expect(page.getByText(createdEventTitle)).not.toBeVisible({ timeout: 5000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Media / Image upload
  // ---------------------------------------------------------------------------

  test.describe('Media upload', () => {
    test('upload an image via the image manager', async ({ page }) => {
      await navigateTo(page, '/admin/images');
      await page.waitForSelector('text=Site Image Manager', { timeout: 10000 });

      const imagePath = await createTemporaryPng('test-hero.png');
      const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
      await fileInput.setInputFiles(imagePath);
      await page.waitForTimeout(4000);

      await expect(page.locator('text=/saved|success/i').first().or(page.getByText(/Image saved/i))).toBeVisible({ timeout: 15000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Broadcasts – create a draft
  // ---------------------------------------------------------------------------

  test.describe('Broadcasts', () => {
    test('create a broadcast draft', async ({ page }) => {
      await navigateTo(page, '/admin/broadcasts');
      await page.waitForSelector('h1:has-text("Broadcasts")', { timeout: 10000 });

      await page.getByRole('button', { name: /New Broadcast/i }).click();
      await page.waitForSelector('input[name="subject"]', { timeout: 5000 });

      const subject = `E2E Broadcast ${Date.now()}`;
      await page.getByLabel('Subject').fill(subject);
      await page.getByLabel('Type').selectOption('email');
      await page.getByLabel('Recipient Group').selectOption('all');

      const editor = page.locator('[data-testid="rich-text-editor"]').or(
        page.locator('.ProseMirror').first(),
      );
      await editor.click();
      await editor.fill('E2E test broadcast body.');

      await page.getByRole('button', { name: /Create Broadcast/i }).click();
      await page.waitForTimeout(2000);

      await expect(page.getByText(subject)).toBeVisible({ timeout: 10000 });
      const draftBadge = page.locator('table tbody tr').filter({ hasText: subject }).locator('text=/draft/i');
      await expect(draftBadge).toBeVisible({ timeout: 5000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Theme – change and verify
  // ---------------------------------------------------------------------------

  test.describe('Theme change', () => {
    test('select a color preset and verify it takes effect', async ({ page }) => {
      await navigateTo(page, '/admin/theme');
      await page.waitForSelector('text=Theme & Layout', { timeout: 10000 });

      const presets = page.locator('[data-testid="theme-preset"], button:has-text("Modern Minimal"), button:has-text("Classic Church"), button:has-text("Elegant Worship")');
      const count = await presets.count();
      expect(count).toBeGreaterThan(0);

      const presetToSelect = presets.nth(0);
      await presetToSelect.click();
      await page.waitForTimeout(1000);

      await expect(page.getByText(/Editing draft/)).toBeVisible({ timeout: 5000 });
    });

    test('change the custom primary color', async ({ page }) => {
      await navigateTo(page, '/admin/theme');
      await page.waitForSelector('text=Theme & Layout', { timeout: 10000 });

      const colorInput = page.locator('input[type="color"]').first();
      if ((await colorInput.count()) === 0) {
        await page.getByText('Custom Color').scrollIntoViewIfNeeded();
      }

      const colorPicker = page.locator('input[type="color"]').first();
      await colorPicker.fill('#8B0000');
      await page.waitForTimeout(1000);

      await expect(page.getByText(/Saving/).or(page.getByText(/Editing draft/))).toBeVisible({ timeout: 5000 });
    });
  });
});
