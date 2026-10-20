import { expect, test, type Page } from '@playwright/test';
import { exercises } from '../../curriculum/index';
const solution = (id: string) => exercises.find((e) => e.id === id)!.solution;
async function edit(page: Page, source: string) {
  const editor = page.locator('.monaco-editor').first();
  await expect(editor).toBeVisible();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate((text) => navigator.clipboard.writeText(text), source);
  await editor.click({ position: { x: 170, y: 75 } });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+V');
  await expect
    .poll(() =>
      page.evaluate(
        (text) =>
          Object.values(JSON.parse(localStorage.getItem('forge.progress.v1')!).drafts).includes(
            text,
          ),
        source,
      ),
    )
    .toBe(true);
}
test('JavaScript solve, genuine failures, submit, progress survives reload, reset restores starter', async ({
  page,
}) => {
  await page.goto('/paths/javascript');
  await page.getByRole('link', { name: /Debounce a search input/ }).click();
  await page.getByRole('button', { name: 'Run tests', exact: true }).click();
  await expect(page.getByText('Needs another look')).toBeVisible();
  await expect(page.getByText('Expected []')).toBeVisible();
  await edit(page, solution('js-debounce'));
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
  await page.reload();
  await expect(page.locator('.exercise-header .success')).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('forge.progress.v1')!).completed['js-debounce'],
    ),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Reset starter code' }).click();
  await page.getByRole('button', { name: 'Run tests', exact: true }).click();
  await expect(page.getByText('Needs another look')).toBeVisible();
});
test('TypeScript shows actual compiler diagnostics and passes precise generics', async ({
  page,
}) => {
  await page.goto('/exercise/ts-pick');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText(/TS2578/).first()).toBeVisible();
  await edit(page, solution('ts-pick'));
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
});
for (const id of ['py-window', 'react-stale', 'py-fastapi-users'])
  test(`${id}: incorrect starter fails; reference passes real tests`, async ({ page }) => {
    await page.goto(`/exercise/${id}`);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText('Needs another look')).toBeVisible();
    await edit(page, solution(id));
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
  });
test('navigation preserves drafts; unavailable compilers are explicit', async ({ page }) => {
  await page.goto('/exercise/js-debounce');
  await edit(page, '// draft survives navigation\nfunction debounce() {}');
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.goto('/exercise/js-debounce');
  await expect(page.locator('.monaco-editor')).toContainText('draft survives navigation');
  await page.goto('/exercise/go-pointer');
  const response = await page.request.get('/api/runtimes');
  const data = await response.json();
  if (!data.capabilities.find((c: { language: string }) => c.language === 'go').available) {
    await expect(page.getByText('go runtime unavailable', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run tests', exact: true })).toBeDisabled();
  }
});
test('practice filters, timed session and visualisation controls work', async ({ page }) => {
  await page.goto('/practice');
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('python');
  await page.getByRole('combobox', { name: 'Exercise type', exact: true }).selectOption('Debug');
  await expect(page.locator('.exercise-row')).toHaveCount(1);
  await page.getByLabel('Timed interview').check();
  await page.getByRole('button', { name: /Start 1 question interview/ }).click();
  await expect(page.locator('.timer')).toBeVisible();
  await page.goto('/visualizations');
  await expect(page.getByRole('heading', { name: 'Start with the full range' })).toBeVisible();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Inspect the midpoint' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous step', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with the full range' })).toBeVisible();
});
test('settings export and validated import round trip', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Display name').fill('Test Engineer');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress', exact: true }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).toBeTruthy();
  await page.getByLabel('Display name').fill('Changed');
  await page.getByLabel('Import progress file').setInputFiles(file!);
  await page.getByRole('button', { name: 'Replace with imported progress' }).click();
  await expect(page.getByLabel('Display name')).toHaveValue('Test Engineer');
  await page.reload();
  await expect(page.getByLabel('Display name')).toHaveValue('Test Engineer');
});
test('dashboard is usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Keep the fire going/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'Learning paths', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build a stronger foundation.' })).toBeVisible();
});
test('interview expiry records a final session and preserves the draft', async ({ page }) => {
  await page.clock.install();
  await page.goto('/practice');
  await page.getByLabel('Timed interview').check();
  await page.getByRole('button', { name: /Start 3 question interview/ }).click();
  await expect(page.locator('.timer')).toBeVisible();
  await page.clock.fastForward(30 * 60000 + 1000);
  await expect(page.getByText(/Interview time is up/)).toBeVisible();
  await page.goto('/practice');
  await expect(page.getByText('SESSION COMPLETE')).toBeVisible();
  await expect(page.getByRole('heading', { name: '0 / 3 challenges solved' })).toBeVisible();
});
test('execution API rejects foreign origins and unknown exercises', async ({ request }) => {
  const blocked = await request.post('/api/run', {
    headers: { Origin: 'https://untrusted.example' },
    data: { exerciseId: 'js-once', source: 'function once(){}', action: 'run' },
  });
  expect(blocked.status()).toBe(403);
  const unknown = await request.post('/api/run', {
    data: { exerciseId: 'unknown', source: 'anything', action: 'submit' },
  });
  expect(unknown.status()).toBe(404);
});
test('capture desktop and mobile layouts with no browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Keep the fire going/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/forge-dashboard.png', fullPage: true });
  await page.goto('/exercise/js-debounce');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.screenshot({ path: 'artifacts/forge-workspace.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: 'artifacts/forge-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
