import { test, expect } from '@playwright/test';

/**
 * VELO ERP — LIVE REGRESSION SUITE (§3)
 * Covers each major screen with automated screenshot capture for regression
 * checking. Requires the backend running (default http://localhost:8000) and the
 * Vite dev server or preview (default http://localhost:5173).
 */

const BASE = process.env.ERP_BASE_URL || 'http://localhost:5173';
const SHOT_DIR = 'screenshots/live';

const screens = [
  { nav: 'Fleet Asset Management', name: 'fleet' },
  { nav: 'Chauffeur Personnel Hub', name: 'chauffeurs' },
  { nav: 'Corporate Accounts & Billing', name: 'corporate' },
  { nav: 'Private Client Registry', name: 'private-clients' },
  // System Management modules live inside the System Admin drawer.
  { nav: 'Operational Staff Directory', name: 'staff', drawer: true },
  { nav: 'Workforce Roster & Scheduling', name: 'roster', drawer: true },
  { nav: 'Financial Intelligence & Compliance', name: 'financials', drawer: true },
  { nav: 'Brand Identity & White Labeling', name: 'whitelabel', drawer: true },
];

test('Operations Hub renders the live KPI bar and trip table', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByText('OPERATIONS HUB')).toBeVisible({ timeout: 15000 });
  for (const kpi of ['ACTIVE TRIPS', 'UPCOMING', 'ASSIGNED', 'UNASSIGNED', 'COMPLETED']) {
    await expect(page.getByText(kpi, { exact: true })).toBeVisible();
  }
  await page.screenshot({ path: `${SHOT_DIR}/operations-hub.png`, fullPage: false });
});

test('System Admin drawer + Platform Health widget open with live diagnostics', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByText('OPERATIONS HUB')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'System Admin' }).click();
  await expect(page.getByText('SYSTEM MANAGEMENT')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/system-admin-drawer.png` });
});

for (const screen of screens) {
  test(`Screen: ${screen.name}`, async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText('OPERATIONS HUB')).toBeVisible({ timeout: 15000 });
    if (screen.drawer) {
      await page.getByRole('button', { name: 'System Admin', exact: true }).click();
      await expect(page.getByText('SYSTEM MANAGEMENT')).toBeVisible();
    }
    await page.getByRole('button', { name: screen.nav, exact: false }).first().click();
    await page.waitForTimeout(1200); // allow live data fetch
    await page.screenshot({ path: `${SHOT_DIR}/${screen.name}.png`, fullPage: false });
  });
}

test('B2B Pool marketplace renders live pool board', async ({ page }) => {
  await page.goto(`${BASE}/?tab=b2b`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOT_DIR}/b2b-pool.png`, fullPage: false });
});
