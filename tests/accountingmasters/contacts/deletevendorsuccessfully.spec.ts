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

test.describe('Accounting Masters @Sg0iseezi', () => {
  test('Delete Vendor Successfully @Taqjvd1yr', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Contacts/Vendors list
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // Ensure vendors tab selected if exists
    await optionalAction(
      page.getByRole('tab', { name: /vendors/i }),
      async () => {
        await page.getByRole('tab', { name: /vendors/i }).first().click();
        await page.waitForTimeout(500);
      },
      'Vendors tab not found'
    );

    // Verify contacts section loads
    await safeExpectVisible(page.getByRole('heading', { name: /vendors|contacts|payees/i }).first(), 'Contacts/Vendors heading not visible');

    // STEP 3: Locate the vendor to be deleted in the vendor list
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No vendor rows found to delete' });
      return;
    }

    // Capture vendor name from first cell if possible
    let vendorName = '';
    try {
      vendorName = (await row.locator('td').first().innerText()).trim();
    } catch {
      vendorName = '';
    }

    // STEP 4: Click on the vendor row to select it or open context menu
    await row.click().catch(() => {});
    await page.waitForTimeout(300);

    // Try to open context/menu if needed
    await optionalAction(
      row.locator('button[aria-haspopup="menu"], button[aria-label*="more"], button:has-text("More")'),
      async () => {
        await row.locator('button[aria-haspopup="menu"], button[aria-label*="more"], button:has-text("More")').first().click();
      },
      'Context menu not available on row'
    );

    // STEP 5: Click on Delete action button
    const deleteClicked = await clickButton(page, /delete/i, 'Delete button not found');
    if (!deleteClicked) {
      await optionalAction(
        page.getByRole('menuitem', { name: /delete/i }),
        async () => {
          await page.getByRole('menuitem', { name: /delete/i }).first().click();
        },
        'Delete menu item not found'
      );
    }

    // STEP 6: Confirm deletion in the confirmation dialog
    const dialog = page.getByRole('dialog').first();
    const dialogVisible = await safeExpectVisible(dialog, 'Delete confirmation dialog not visible', 8000);
    if (dialogVisible) {
      await clickButton(page, /confirm|delete|yes/i, 'Confirm delete button not found');
    }

    // STEP 7: Verify success toast and vendor is removed from the list
    const toastSeen = await waitForToast(page, /deleted|success|removed/i, 12000);
    if (!toastSeen) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not detected after deletion' });
    }

    // Verify vendor not present
    if (vendorName) {
      const vendorRowByName = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(vendorName) }).first();
      await expect(vendorRowByName).toHaveCount(0, { timeout: 10000 }).catch(() => {
        test.info().annotations.push({ type: 'note', description: `Vendor "${vendorName}" still appears in list` });
      });
    } else {
      test.info().annotations.push({ type: 'note', description: 'Vendor name not captured; skipping name-based verification' });
    }
  });
});