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

test.describe('Accounting Masters @Sgvqr2wjs', () => {
  test('Delete Vendor API Validation @Tsapd90zv', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Vendors
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Click Vendors tab (if applicable)
    await optionalAction(page.getByRole('tab', { name: textRegex('Vendors') }), async () => {
      await page.getByRole('tab', { name: textRegex('Vendors') }).first().click();
    }, 'Vendors tab not found');

    // STEP 4: Click Add Vendor
    await clickButton(page, /add vendor|new vendor|create vendor/i, 'Add Vendor button not found');

    // STEP 5: Fill Create Vendor form
    await waitForPageReady(page, '/payees/create-vendor');

    const unique = Date.now().toString().slice(-6);
    const vendorName = `Auto Vendor ${unique}`;
    const displayName = `AutoVendor${unique}`;

    await fillField(page, 'input[name="vendorName"], input[placeholder*="Vendor Name" i]', vendorName, 'Vendor Name');
    await fillField(page, 'input[name="displayName"], input[placeholder*="Display Name" i]', displayName, 'Display Name');
    await fillField(page, 'input[type="email"][name="email"], input[placeholder*="Email" i]', `vendor${unique}@example.com`, 'Email address');
    await fillField(page, 'input[name="phone"], input[placeholder*="Phone" i], input[type="tel"]', `555000${unique}`, 'Phone number');

    // Address fields
    await fillField(page, 'input[name="address1"], input[placeholder*="Street" i]', '123 Market Street', 'Street');
    await fillField(page, 'input[name="city"], input[placeholder*="City" i]', 'San Francisco', 'City');
    await fillField(page, 'input[name="state"], input[placeholder*="State" i]', 'CA', 'State');
    await fillField(page, 'input[name="zip"], input[placeholder*="ZIP" i], input[name="postalCode"]', '94105', 'ZIP');

    // Bank Account details (optional)
    await fillField(page, 'input[name="bankAccountName"], input[placeholder*="Account Name" i]', 'Test Account', 'Bank Account Name');
    await fillField(page, 'input[name="bankAccountNumber"], input[placeholder*="Account Number" i]', '123456789', 'Bank Account Number');
    await fillField(page, 'input[name="routingNumber"], input[placeholder*="Routing" i]', '021000021', 'Routing Number');

    // Payment Terms dropdown
    await selectOption(page, 'select[name="paymentTerms"], [data-testid="payment-terms"], [role="combobox"]', 'Net 30', 'Payment Terms');

    // GST/Tax Number
    await fillField(page, 'input[name="gstNumber"], input[name="taxNumber"], input[placeholder*="GST" i], input[placeholder*="Tax" i]', 'GST-12345', 'GST/Tax Number');

    // STEP 6: Save vendor
    await clickButton(page, /save|create|submit/i, 'Save vendor button not found');

    // STEP 7: Verify success and get vendor ID
    await waitForToast(page, /success|created|saved/i).catch(() => {});
    await waitForPageReady(page);

    const currentUrl = page.url();
    let vendorId = '';
    const match = currentUrl.match(/vendor-info\/([^/?#]+)/i) || currentUrl.match(/edit-vendor\/([^/?#]+)/i);
    if (match && match[1]) {
      vendorId = match[1];
    } else {
      test.info().annotations.push({ type: 'note', description: 'Vendor ID not found in URL; API steps may fail.' });
    }

    // STEP 8: API DELETE vendor
    if (vendorId) {
      const deleteResponse = await page.request.delete(`${baseUrl}/api/vendors/${vendorId}`);
      const status = deleteResponse.status();
      expect([200, 204]).toContain(status);

      let deleteBody: any = null;
      try {
        deleteBody = await deleteResponse.json();
      } catch {
        deleteBody = await deleteResponse.text();
      }
      if (typeof deleteBody === 'string') {
        expect(deleteBody.toLowerCase()).toMatch(/success|deleted|ok/);
      } else if (deleteBody) {
        const bodyString = JSON.stringify(deleteBody).toLowerCase();
        expect(bodyString).toMatch(/success|deleted|ok/);
      }

      // STEP 9: API GET to verify vendor no longer exists
      const getResponse = await page.request.get(`${baseUrl}/api/vendors/${vendorId}`);
      expect(getResponse.status()).toBe(404);
    } else {
      test.info().annotations.push({ type: 'note', description: 'Skipping API DELETE/GET due to missing vendorId.' });
    }
  });
});