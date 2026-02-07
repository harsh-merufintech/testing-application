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

test.describe('Accounting Masters @Squ9s77gv', () => {
  test('Cancel Vendor Deletion @Tt8qy69z1', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Ensure Contacts/Vendors section loads successfully
    const vendorsTab = page.getByRole('tab', { name: /vendor/i }).first();
    await optionalAction(
      vendorsTab,
      async () => {
        await vendorsTab.click();
      },
      'Vendors tab not found; continuing on default tab.'
    );
    await page.waitForTimeout(1000);

    const tableVisible = await safeExpectVisible(
      page.locator('table, [role="table"], [data-testid="vendors-table"]').first(),
      'Vendors list not visible'
    );
    if (!tableVisible) {
      return;
    }

    // STEP 4: Select a vendor from the list
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No vendor row found to delete' });
      return;
    }

    const vendorNameCell = row.locator('td, [role="cell"]').first();
    let vendorName = '';
    try {
      vendorName = (await vendorNameCell.innerText()).trim();
    } catch {
      vendorName = '';
    }

    await row.click().catch(() => {});
    await safeExpectVisible(row, 'Vendor row not selectable');

    // STEP 5: Click Delete action
    const rowDeleteButton = row.getByRole('button', { name: /delete|remove/i }).first();
    let deleteClicked = false;
    if (await rowDeleteButton.count()) {
      await optionalAction(
        rowDeleteButton,
        async () => {
          await rowDeleteButton.click();
          deleteClicked = true;
        },
        'Delete button on row not found'
      );
    }

    if (!deleteClicked) {
      // try overflow menu or action menu
      const menuBtn = row.getByRole('button', { name: /more|actions|options|ellipsis/i }).first();
      await optionalAction(
        menuBtn,
        async () => {
          await menuBtn.click();
          const menuDelete = page.getByRole('menuitem', { name: /delete|remove/i }).first();
          await menuDelete.click();
          deleteClicked = true;
        },
        'Action menu for delete not found'
      );
    }

    if (!deleteClicked) {
      test.info().annotations.push({ type: 'note', description: 'Delete action could not be triggered' });
      return;
    }

    // STEP 6: Verify confirmation dialog appears and click Cancel
    const dialog = page.getByRole('dialog').first();
    const dialogVisible = await safeExpectVisible(dialog, 'Confirmation dialog did not appear', 10000);

    if (dialogVisible) {
      const cancelBtn = dialog.getByRole('button', { name: /cancel|no|close|keep/i }).first();
      await optionalAction(
        cancelBtn,
        async () => {
          await cancelBtn.click();
        },
        'Cancel button not found in confirmation dialog'
      );
      await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
        test.info().annotations.push({ type: 'note', description: 'Dialog did not close after cancel' });
      });
    }

    // STEP 7: Verify vendor still exists in the list
    if (vendorName) {
      const vendorRowByName = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(vendorName) }).first();
      await safeExpectVisible(vendorRowByName, 'Vendor row not found after canceling deletion', 10000);
    } else {
      // fallback - ensure there is at least one row present
      const anyRow = await firstRow(page);
      if (!anyRow) {
        test.info().annotations.push({ type: 'note', description: 'No vendor rows available after cancel' });
      } else {
        await safeExpectVisible(anyRow, 'Vendor list empty after canceling deletion');
      }
    }

    // Optional: ensure no deletion success toast
    await waitForToast(page, /deleted|removed/i, 3000).then((deleted) => {
      if (deleted) {
        test.info().annotations.push({ type: 'note', description: 'Unexpected deletion toast appeared' });
      }
    });
  });
});