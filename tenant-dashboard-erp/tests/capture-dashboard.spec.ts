import { test } from '@playwright/test';

const itemsToCapture = [
  'Fleet Asset Management',
  'Chauffeur Personnel Hub',
  'Corporate Accounts & Billing',
  'Private Client Registry',
  'System Admin',
  'New Dispatch',
  'Operational Staff Directory'
];

test('Capture specific states', async ({ page }) => {
  for (const item of itemsToCapture) {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Use a try/catch so one failing button doesn't stop the whole scan
    try {
      await page.getByRole('button', { name: item, exact: false }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const filename = item.toLowerCase().replace(/\s+/g, '-');
      await page.screenshot({ path: `screenshots/${filename}.png`, fullPage: true });
    } catch (e) {
      console.log(`Skipping ${item}: button not found`);
    }
  }
});
