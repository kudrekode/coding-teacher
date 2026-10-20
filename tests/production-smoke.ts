import { chromium, expect } from '@playwright/test';
import { exercises } from '../curriculum/index';

const base = process.env.FORGE_BASE_URL ?? 'http://127.0.0.1:4318';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of [
    '/',
    '/explore/typescript',
    '/learn/js-debounce',
    '/practice',
    '/projects',
    '/visualizations',
    '/settings',
  ]) {
    const response = await page.goto(base + route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    if (route === '/learn/js-debounce')
      await page.screenshot({
        path: 'artifacts/v2-lesson-desktop.png',
        animations: 'disabled',
        timeout: 30000,
      });
  }
  await page.getByLabel('Appearance').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto(base);
  await page.screenshot({
    path: 'artifacts/v2-production-light.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 30000,
  });
  await page.goto(base + '/exercise/js-debounce');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.getByRole('button', { name: 'Run tests', exact: true }).click();
  await expect(page.getByText('Needs another look')).toBeVisible();
  const source = exercises.find((exercise) => exercise.id === 'js-debounce')!.solution;
  await page.evaluate((text) => navigator.clipboard.writeText(text), source);
  await page.locator('.monaco-editor').click({ position: { x: 170, y: 75 } });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+V');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
  await page.reload();
  await expect(page.locator('.exercise-header .success')).toBeVisible();
  expect(errors).toEqual([]);
  console.log(
    'PASS production: atlas/lesson/practice SPA routes, light theme, Monaco, real submission, reload persistence, no browser errors',
  );
} finally {
  await browser.close();
}
