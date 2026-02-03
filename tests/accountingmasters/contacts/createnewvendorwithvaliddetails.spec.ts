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

test.describe('Accounting Masters @S6gns5bk4', () => {
  test('Create New Vendor with Valid Details @Trejg6gxs', async ({ page }) => {
    const uniqueId = Date.now();
    const vendorName = `ABC Supplies Ltd ${uniqueId}`;
    const vendorEmail = `contact_${uniqueId}@abcsupplies.com`;

    // STEP 1: Login using seedLogin utility
    await seedLogin(page);
    
    // STEP 2: Navigate to the starting point (Payees/Contacts)
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    
    // Ensure we are on the Vendors tab if there are multiple tabs
    const vendorTab = page.getByRole('tab', { name: /vendors/i });
    if (await vendorTab.isVisible()) {
        await vendorTab.click();
    }

    // STEP 3: Click "Add Vendor" or "Create Vendor" button
    const createBtn = page.locator('button').filter({ hasText: /add vendor|create vendor/i }).first();
    await createBtn.click();
    await waitForPageReady(page, '/payees/create-vendor');

    // STEP 4: Fill ALL form fields
    // Vendor Name (Required)
    await fillField(page, 'input[name="name"], input[placeholder*="Vendor Name"]', vendorName, 'Vendor Name');
    
    // Display Name
    await fillField(page, 'input[name="displayName"], input[placeholder*="Display Name"]', vendorName, 'Display Name');
    
    // Email
    await fillField(page, 'input[name="email"], input[type="email"]', vendorEmail, 'Email');
    
    // Phone
    await fillField(page, 'input[name="phone"], input[type="tel"]', '1234567890', 'Phone');

    // Address Fields
    await fillField(page, 'input[name="address.street"], [placeholder*="Street"]', '123 Business Way', 'Street');
    await fillField(page, 'input[name="address.city"], [placeholder*="City"]', 'New York', 'City');
    await fillField(page, 'input[name="address.state"], [placeholder*="State"]', 'NY', 'State');
    await fillField(page, 'input[name="address.zip"], [placeholder*="ZIP"]', '10001', 'ZIP');

    // Payment Terms (Dropdown)
    // Using a generic selector for the trigger, often a button or div with specific text
    await selectOption(page, '[data-testid*="terms"], .select-trigger, #paymentTerms', 'Net 30', 'Payment Terms');

    // Tax Identification Number
    await fillField(page, 'input[name="taxId"], input[name="gstNumber"], [placeholder*="Tax"]', 'TAX123456789', 'Tax ID');

    // STEP 5: Click Save button
    const saveSuccess = await clickButton(page, /save|create|submit/i, 'Save Vendor Button');
    
    // STEP 6: Verify the operation completed successfully
    if (saveSuccess) {
        // Check for success toast
        const toastFound = await waitForToast(page, /success|created|saved/i);
        
        // Verify redirect to vendor info or back to list
        await expect(page).toHaveURL(new RegExp(`/vendor-info/|/payees`), { timeout: 15000 });

        // Verify the new vendor appears in the list if redirected to list
        if (page.url().includes('/payees')) {
            const searchInput = page.locator('input[placeholder*="Search"]').first();
            if (await searchInput.isVisible()) {
                await searchInput.fill(vendorName);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(1000);
            }
            await expect(page.getByText(vendorName).first()).toBeVisible();
        } else {
            // If on info page, verify name is displayed
            await expect(page.locator('h1, h2, .vendor-name').filter({ hasText: vendorName }).first()).toBeVisible();
        }
    } else {
        throw new Error('Failed to click the Save button or button was not found');
    }
  });
});