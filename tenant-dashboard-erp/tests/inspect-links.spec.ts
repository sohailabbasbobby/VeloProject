import { test } from '@playwright/test';

test('Find my buttons', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // This will print all buttons and their text to the terminal
  const buttons = await page.locator('button, div[role="button"]').allInnerTexts();
  console.log('Found these buttons:', buttons);
});
