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

test.describe('Accounting Masters @S4qjh5e7h', () => {
  test('Delete Vendor from Vendor List @Ta5lipycq', async ({ page }) => {
    // STEP 1: Login using seedLogin utility
    await seedLogin(page);
    
    // STEP 2: Navigate to Contacts (Payees)
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');

    // STEP 3: Ensure we are on the Vendors tab
    const vendorTab = page.getByRole('tab', { name: /vendors/i });
    if (await vendorTab.isVisible()) {
        await vendorTab.click();
    }

    // STEP 4: Check if a vendor exists, if not, create one to delete
    let row = await firstRow(page);
    
    if (!row) {
        test.info().annotations.push({ type: 'note', description: 'No vendor found, creating a temporary vendor' });
        await page.goto(`${baseUrl}/payees/create-vendor`);
        await waitForPageReady(page, '/create-vendor');
        
        const tempVendorName = `DeleteTest_${Date.now()}`;
        await fillField(page, 'input[name="name"], input[placeholder*="Vendor Name"]', tempVendorName, 'Vendor Name');
        await fillField(page, 'input[name="email"]', 'test@example.com', 'Email');
        await clickButton(page, /save|create/i, 'Save Vendor');
        
        await waitForPageReady(page, '/payees');
        row = await firstRow(page);
    }

    // STEP 5: Capture vendor name for verification later
    const vendorName = await row!.locator('td, [role="cell"]').first().innerText();
    test.info().annotations.push({ type: 'note', description: `Targeting vendor: ${vendorName}` });

    // STEP 6: Open Action Menu (Three dots)
    const actionMenu = row!.locator('button[aria-haspopup="menu"], .action-btn, [id^="radix-"]').last();
    await actionMenu.click();

    // STEP 7: Select 'Delete' from the menu
    const deleteOption = page.getByRole('menuitem', { name: /delete/i }).first();
    await deleteOption.waitFor({ state: 'visible' });
    await deleteOption.click();

    // STEP 8: Confirm Deletion in Dialog
    const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i }).filter({ hasNotText: /cancel/i }).first();
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();

    // STEP 9: Verify Success Toast
    const deletedSuccess = await waitForToast(page, /deleted|success/i);
    expect(deletedSuccess).toBeTruthy();

    // STEP 10: Verify vendor is no longer in the list
    await page.reload();
    await waitForPageReady(page);
    
    const remainingContent = await page.locator('table, [role="grid"]').innerText();
    expect(remainingContent).not.toContain(vendorName);
  });
});