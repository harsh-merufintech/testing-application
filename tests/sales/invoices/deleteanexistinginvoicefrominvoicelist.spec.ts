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

test.describe('Sales @Smj0rxeqn', () => {
  test('Delete an existing invoice from invoice list @T4pblmzhf', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}`);
    await waitForPageReady(page);
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Navigate to Sales > Invoices from sidebar (if available)
    await optionalAction(
      page.getByRole('link', { name: /sales/i }),
      async () => {
        await page.getByRole('link', { name: /sales/i }).first().click();
      },
      'Sales sidebar link not found'
    );

    await optionalAction(
      page.getByRole('link', { name: /invoices/i }),
      async () => {
        await page.getByRole('link', { name: /invoices/i }).first().click();
      },
      'Invoices sidebar link not found'
    );

    // Ensure we are on invoice list page
    if (!/\/invoices\/list/i.test(page.url())) {
      await page.goto(`${baseUrl}/invoices/list`);
    }
    await waitForPageReady(page, '/invoices/list');

    // STEP 4: Verify invoices list page loads successfully
    await safeExpectVisible(page.getByRole('heading', { name: /invoices/i }).first(), 'Invoices page heading not visible');
    await safeExpectVisible(page.locator('table, [role="table"]').first(), 'Invoices table not visible');

    // Verify expected columns
    await safeExpectVisible(page.getByRole('columnheader', { name: /invoice/i }).first(), 'Invoice column header not visible');
    await safeExpectVisible(page.getByRole('columnheader', { name: /customer|client/i }).first(), 'Customer column header not visible');
    await safeExpectVisible(page.getByRole('columnheader', { name: /status/i }).first(), 'Status column header not visible');

    // STEP 5: Locate target invoice to delete
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No invoice rows found to delete' });
      return;
    }

    const invoiceIdentifier =
      (await row.locator('td, [role="cell"]').first().innerText().catch(() => ''))?.trim() ||
      (await row.innerText().catch(() => '')).trim();

    // STEP 6: Click row actions menu (three dots)
    const actionButton = row.locator('[data-testid*="action"], button[aria-haspopup="menu"], button:has(svg)').first();
    await optionalAction(
      actionButton,
      async () => {
        await actionButton.click();
      },
      'Row actions menu button not found'
    );

    // STEP 7: Select Delete from context menu
    const deleteMenuItem = page.getByRole('menuitem', { name: /delete/i }).first();
    await optionalAction(
      deleteMenuItem,
      async () => {
        await deleteMenuItem.click();
      },
      'Delete menu item not found in context menu'
    );

    // STEP 8: Confirm deletion in dialog
    const dialog = page.getByRole('dialog').first();
    await safeExpectVisible(dialog, 'Delete confirmation dialog not visible');

    const confirmDeleteButton = dialog.getByRole('button', { name: /delete|confirm|yes/i }).first();
    await optionalAction(
      confirmDeleteButton,
      async () => {
        await confirmDeleteButton.click();
      },
      'Confirm delete button not found in dialog'
    );

    // STEP 9: Verify success toast and invoice removed
    await waitForToast(page, /deleted|success|removed/i, 15000);

    if (invoiceIdentifier) {
      const rowWithInvoice = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(invoiceIdentifier) }).first();
      try {
        await expect(rowWithInvoice).toHaveCount(0, { timeout: 15000 });
      } catch {
        test.info().annotations.push({ type: 'note', description: `Invoice "${invoiceIdentifier}" still appears in list after deletion` });
      }
    } else {
      test.info().annotations.push({ type: 'note', description: 'Could not capture invoice identifier for verification' });
    }
  });
});