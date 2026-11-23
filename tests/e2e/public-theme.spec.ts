import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const slug = process.env.PRAYER_ROOM_SLUG || 'promised-land-christian-center';
const outDir = process.env.THEME_SHOTS || '/tmp/sanctum-theme';
const summary: Record<string, { count: number; detail: string }> = {};
const failures: string[] = [];

async function checkContrast(page: import('@playwright/test').Page, pageName: string, theme: string, selector = '.sanctum-screen') {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withRules(['color-contrast'])
    .analyze();
  const detail = results.violations.length
    ? results.violations
        .map((item) => {
          const sample = item.nodes.slice(0, 3).map((node) => node.html).join(' | ');
          return `${item.nodes.length} node(s): ${sample}`;
        })
        .join('\n')
    : 'no color-contrast violations';
  summary[`${pageName} / ${theme}`] = { count: results.violations.reduce((sum, item) => sum + item.nodes.length, 0), detail };
  if (results.violations.length) failures.push(`${pageName} / ${theme}\n${detail}`);
}

async function dismissToasts(page: import('@playwright/test').Page) {
  const close = page.getByRole('button', { name: 'Dismiss notification', exact: true }).first();
  if (await close.isVisible()) {
    const dismissed = await close.click({ timeout: 1_000 }).then(() => true, () => false);
    if (!dismissed) return;
    // Let the exit animation finish before looking for another toast.
    await close.waitFor({ state: 'hidden', timeout: 1_000 }).catch(() => undefined);
  }
}

async function shot(page: import('@playwright/test').Page, name: string) {
  await dismissToasts(page);
  mkdirSync(outDir, { recursive: true });
  await test.step(`Capture ${name}`, () => page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true, timeout: 10_000 }));
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sanctum_storage_version', '3');
    localStorage.setItem('sanctum_tour_complete_joinGate', '1');
    localStorage.setItem('sanctum_tour_complete_listenerRoom', '1');
  });
});

test('join screen themes and the listener room pass contrast', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sanctum_theme', 'dusk');
  });
  await page.goto(`/join/${slug}`);
  await expect(page.locator('.sanctum-screen')).toHaveAttribute('data-theme', 'dusk');
  await expect(page.getByRole('button', { name: 'Enter the sanctuary' })).toBeVisible();
  await expect(page.getByText('Sermon leader:')).toBeVisible();
  await shot(page, 'join-dusk');
  await checkContrast(page, 'join', 'dusk');

  await page.locator('#attendeeName').fill('Theme Contrast');
  const enter = page.getByRole('button', { name: 'Enter the sanctuary' });
  await expect(enter).toBeEnabled();
  await enter.click();
  const room = page.locator('.pr-shell');
  const leave = room.getByRole('button', { name: 'Leave Room', exact: true });
  await expect(leave).toBeVisible();
  await expect(room.getByText('WAITING', { exact: true })).toBeVisible();
  await expect(room.getByText('Overflow room led by Pastor GraceLove Hiire')).toBeVisible();
  await expect(room.getByRole('button', { name: 'Raise Hand' })).toBeEnabled();
  await shot(page, 'listener');
  await checkContrast(page, 'listener', 'room', '.pr-shell');

  await leave.click();
  await expect(page.getByRole('button', { name: 'Enter the sanctuary' })).toBeVisible();
  await expect(page.getByText('Sermon leader:')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('.sanctum-screen')).toHaveAttribute('data-theme', 'light');
  await shot(page, 'join-light');
  await checkContrast(page, 'join', 'light');

  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/axe-summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  expect(failures, failures.join('\n\n')).toEqual([]);
});

test('a first visit with no saved theme loads dusk', async ({ page }) => {
  await page.goto(`/join/${slug}`);
  await expect(page.locator('.sanctum-screen')).toHaveAttribute('data-theme', 'dusk');
  await expect(page.getByText('Sermon leader:')).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('sanctum_theme'));
  expect(saved).toBe('dusk');
});
