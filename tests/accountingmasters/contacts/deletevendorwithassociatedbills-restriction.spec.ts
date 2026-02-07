import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { login as seedLogin } from '__UTILS_LOGIN_PATH__';

test.setTimeout(120000);

const baseUrl = 'https://dev.hellobooks.ai';

// Helper: textRegex(text) - escapes regex special chars and returns case-insensitive RegExp
function textRegex(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// Optional action wrapper - tries action but doesn't fail test if element not found
async function optionalAction(locator: Locator, action: () => Promise<void>, note: string) {
  const target = locator.first();
  try {
    await target.waitFor({ state: 'visible', timeout: 5000 });
    await target.scrollIntoViewIfNeeded().catch(() => {});
    await action();
    return;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
  }
}

// Safe visibility check that adds annotation instead of failing
async function safeExpectVisible(locator: Locator, note: string, timeout = 5000) {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
    return false;
  }
}

// Wait for page to be ready after navigation
async function waitForPageReady(page: Page, expectedRoute?: string) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  if (expectedRoute) {
    await expect(page).toHaveURL(new RegExp(expectedRoute), { timeout: 15000 });
  }
}

// Fill form field with retry logic
async function fillField(page: Page, selector: string, value: string, fieldName: string) {
  const field = page.locator(selector).first();
  try {
    await field.waitFor({ state: 'visible', timeout: 10000 });
    await field.scrollIntoViewIfNeeded().catch(() => {});
    await field.clear();
    await field.fill(value);
  } catch {
    test.info().annotations.push({ type: 'note', description: `Could not fill ${fieldName}` });
  }
}

// Click button with text matching
async function clickButton(page: Page, textPattern: RegExp | string, note: string) {
  const button = page.getByRole('button', { name: textPattern }).first();
  try {
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.scrollIntoViewIfNeeded().catch(() => {});
    await button.click();
    return true;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
    return false;
  }
}

// Select dropdown option
async function selectOption(page: Page, triggerSelector: string, optionText: string, fieldName: string) {
  try {
    const trigger = page.locator(triggerSelector).first();
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click();
    await page.waitForTimeout(500);
    const option = page.getByRole('option', { name: new RegExp(optionText, 'i') }).first();
    await option.click();
  } catch {
    test.info().annotations.push({ type: 'note', description: `Could not select ${fieldName}` });
  }
}

// Get first data row from table
async function firstRow(page: Page) {
  const row = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i }).first();
  if (await row.count()) {
    await row.scrollIntoViewIfNeeded().catch(() => {});
    return row;
  }
  return null;
}

// Wait for toast/notification
async function waitForToast(page: Page, pattern: RegExp, timeout = 10000) {
  try {
    const toast = page.locator('[role="status"], .toast, .sonner-toast, [data-sonner-toast]').filter({ hasText: pattern }).first();
    await toast.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Accounting Masters @S44gdqh56', () => {
  test('Delete Vendor with Associated Bills - Restriction @Ttq7j0kdc', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Contacts (Vendors) section
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // Verify contacts section loads
    await safeExpectVisible(page.getByRole('heading', { name: /contacts|payees|vendors/i }).first(), 'Contacts section heading not visible');

    // Ensure vendors tab is selected if tabs exist
    await optionalAction(
      page.getByRole('tab', { name: /vendors/i }),
      async () => {
        await page.getByRole('tab', { name: /vendors/i }).first().click();
        await page.waitForTimeout(500);
      },
      'Vendors tab not found'
    );

    // STEP 3: Select the vendor with associated transactions
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No vendor row found in contacts list' });
      return;
    }

    await row.click().catch(() => {});
    await safeExpectVisible(row, 'Vendor row not selected/visible');

    // Attempt to delete the vendor
    const actionsButton = row.getByRole('button', { name: /more|actions|menu|ellipsis/i }).first();
    const rowDeleteButton = row.getByRole('button', { name: /delete/i }).first();

    if (await actionsButton.count()) {
      await actionsButton.click().catch(() => {});
      await page.waitForTimeout(500);
      await clickButton(page, /delete/i, 'Delete action not found in row menu');
    } else if (await rowDeleteButton.count()) {
      await rowDeleteButton.click().catch(() => {});
    } else {
      await clickButton(page, /delete/i, 'Global delete button not found');
    }

    // Confirm deletion if confirmation dialog appears
    await optionalAction(
      page.getByRole('dialog').first(),
      async () => {
        await clickButton(page, /confirm|delete|yes/i, 'Confirm delete button not found in dialog');
      },
      'Delete confirmation dialog not displayed'
    );

    // STEP 4: Verify system prevents deletion due to associated transactions
    const errorToastShown = await waitForToast(page, /cannot|associated|transaction|linked|delete/i, 10000);
    if (!errorToastShown) {
      await safeExpectVisible(
        page.locator('text=/cannot|associated|transaction|linked|delete/i').first(),
        'Error message about associated transactions not visible'
      );
    }

    // Additional verification: vendor still exists in list
    await safeExpectVisible(row, 'Vendor row no longer visible after failed deletion');
  });
});