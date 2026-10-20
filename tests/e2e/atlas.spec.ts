import { expect, test, type Page } from '@playwright/test';
import { exercises } from '../../curriculum/index';
test('runtime diagnostics execute self-checks and show real installed versions', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Run self-check', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run self-check', exact: true })).toBeEnabled();
  await expect(
    page.locator('.runtime-list').getByText('Self-check passed', { exact: true }),
  ).toHaveCount(6);
  await expect(page.locator('.runtime-list')).toContainText(/go version go\d/);
  await expect(page.locator('.runtime-list')).toContainText(/rustc \d/);
  await page.locator('.runtime-list').screenshot({
    path: 'artifacts/v2-runtime-diagnostics.png',
    animations: 'disabled',
    timeout: 30000,
  });
});
async function edit(page: Page, id: string, source = exercises.find((e) => e.id === id)!.solution) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate((text) => navigator.clipboard.writeText(text), source);
  await page
    .locator('.monaco-editor')
    .first()
    .click({ position: { x: 170, y: 75 } });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+V');
  await expect
    .poll(() =>
      page.evaluate(
        ({ id, source }) =>
          JSON.parse(localStorage.getItem('forge.progress.v1')!).drafts[id] === source,
        { id, source },
      ),
    )
    .toBe(true);
}
test('map → concept → live timers → implementation → exact map viewport → reload', async ({
  page,
}) => {
  await page.goto('/explore/javascript');
  await expect(page.locator('.knowledge-node').first()).toBeVisible();
  await page.getByRole('button', { name: 'Zoom In', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('forge.map.javascript')))
    .not.toBeNull();
  const viewport = await page.evaluate(() => sessionStorage.getItem('forge.map.javascript'));
  await page.getByRole('link', { name: 'Open lesson', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Debounce.', exact: true })).toBeVisible();
  await page.clock.install();
  await page.getByLabel('Try debounce search').pressSequentially('forge', { delay: 40 });
  await expect(page.getByTestId('input-count')).toHaveText('5');
  await page.clock.fastForward(600);
  await expect(page.getByTestId('debounced-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Mark lesson as read', exact: true }).click();
  await page.getByRole('link', { name: /Debounce a search input/ }).click();
  await edit(page, 'js-debounce');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
  await page.locator('.back-link').click();
  await page.getByRole('link', { name: 'Return to map', exact: true }).first().click();
  expect(await page.evaluate(() => sessionStorage.getItem('forge.map.javascript'))).toBe(viewport);
  await expect(page.getByRole('complementary', { name: 'Selected concept' })).toContainText(
    'Practised',
  );
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('forge.progress.v1')!).completed['js-debounce'],
    ),
  ).toBeTruthy();
});
test('concept click and search select meaningful nodes; all seven tracks work', async ({
  page,
}) => {
  await page.goto('/explore/javascript');
  await page.getByLabel('Search concepts').fill('throttle');
  await expect(page.getByRole('status')).toContainText('1 matching concepts');
  await page
    .locator('.atlas-results')
    .getByRole('button', { name: 'Throttle', exact: true })
    .click();
  await expect(
    page
      .getByRole('complementary', { name: 'Selected concept' })
      .getByRole('heading', { name: 'Throttle', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear concept search' }).click();
  await page.locator('[data-id="js-throttle"]').click();
  await expect(page).toHaveURL(/concept=js-throttle/);
  for (const id of ['typescript', 'python', 'react', 'go', 'rust', 'engineering', 'javascript']) {
    await page.locator(`.atlas-tracks a[href="/explore/${id}"]`).click();
    await expect(page.locator('.knowledge-node').first()).toBeVisible();
    await expect(page.locator('.atlas-tracks .active')).toHaveAttribute('href', `/explore/${id}`);
  }
  await page.getByLabel('Concept difficulty').selectOption('Advanced');
  await expect(page.getByRole('status')).toContainText('matching concepts');
});
test('TypeScript union journey ends in real API state modelling', async ({ page }) => {
  await page.goto('/learn/ts-unions');
  await page.getByLabel('API response variant').selectOption('failure');
  await expect(page.locator('.union-flow')).toContainText('User not found');
  await page
    .getByRole('link', { name: /Type narrowing/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Type narrowing.', exact: true })).toBeVisible();
  await page
    .getByRole('link', { name: /Discriminated unions/ })
    .first()
    .click();
  await page
    .getByRole('link', { name: /API response modelling/ })
    .first()
    .click();
  await page.getByRole('link', { name: /Model an async API state machine/ }).click();
  await edit(page, 'ts-api-state');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
});
for (const id of ['go-pointer', 'rust-borrow'])
  test(`${id}: actual native starter fails and reference compiles`, async ({ page }) => {
    await page.goto(`/exercise/${id}`);
    await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText('Needs another look')).toBeVisible();
    await edit(page, id);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
  });
test('Rust move error is a genuine compiler diagnostic', async ({ page }) => {
  await page.goto('/exercise/rust-mutable');
  await edit(
    page,
    'rust-mutable',
    'fn add_offset(values:&mut [i32],offset:i32){let text=String::from("x");let moved=text;println!("{}",text);}',
  );
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText(/E0382/).first()).toBeVisible();
  await page.screenshot({
    path: 'artifacts/v2-rust-compiler-error.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 30000,
  });
});
test('debug exercises, production search and timer options execute', async ({ page }) => {
  await page.goto('/learn/js-debounce');
  await page.getByLabel('Debounce interval').selectOption('0');
  await page.getByLabel('Try debounce search').pressSequentially('abc');
  await expect(page.getByTestId('debounced-count')).toHaveText('3');
  await page.getByRole('button', { name: 'Reset timeline', exact: true }).click();
  await expect(page.getByTestId('debounced-count')).toHaveText('0');
  await page.getByLabel('Production concept search').fill('react');
  await expect(page.locator('.production-search')).toContainText('3 results for “react”');
  await page.getByRole('link', { name: 'Fix it in the coding workspace' }).first().click();
  await expect(page).toHaveURL(/js-debug-debounce-lifetime/);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('Needs another look')).toBeVisible();
  await edit(page, 'js-debug-debounce-lifetime');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('All tests passed · challenge complete')).toBeVisible();
});
test('inspect desktop, lesson, light theme and mobile without overflow or page errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/explore/javascript');
  await expect(page.locator('.knowledge-node').first()).toBeVisible();
  await page.screenshot({
    path: 'artifacts/v2-atlas-desktop.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 30000,
  });
  await page.goto('/learn/js-debounce');
  await page.getByRole('button', { name: 'Play a burst' }).click();
  await expect(page.getByRole('button', { name: 'Play a burst' })).toBeEnabled();
  await page.locator('#experiment').screenshot({ path: 'artifacts/v2-debounce-timeline.png' });
  await page.screenshot({
    path: 'artifacts/v2-debounce-lesson.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 30000,
  });
  await page.goto('/settings');
  await page.getByLabel('Appearance').selectOption('light');
  await page.goto('/explore/typescript');
  await expect(page.locator('.knowledge-node').first()).toBeVisible();
  await page.screenshot({
    path: 'artifacts/v2-atlas-light.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 30000,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explore/javascript');
  await expect(page.getByRole('region', { name: 'Concept list' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: 'artifacts/v2-atlas-mobile.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 30000,
  });
  await page.goto('/learn/js-debounce');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#experiment').screenshot({ path: 'artifacts/v2-debounce-mobile.png' });
  expect(errors).toEqual([]);
});
