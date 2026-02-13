import { test, expect } from '@playwright/test';

//
// GLOBAL CONFIGURATION
//
test.setTimeout(5 * 60 * 1000); // 5 minutes per test

const ACTION_TIMEOUT = 3 * 60 * 1000;
const EXPECT_TIMEOUT = 3 * 60 * 1000;

// Inline login helper — credentials from Test Environment settings
async function seedLogin(page) {
  await page.goto('/login', { timeout: ACTION_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
  await page.getByLabel(/email/i).fill('harshpadaliya@merufintech.net', { timeout: ACTION_TIMEOUT });
  await page.getByLabel(/password/i).fill('Harsh@12345', { timeout: ACTION_TIMEOUT });
  await page.getByRole('button', { name: /sign in|log in|login|submit/i }).click({ timeout: ACTION_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
}

//
// TEST SUITE
//
test.describe('Sales @S02222ku1', () => {

  test('@Tlknr5ziq @invoice MODULE-001: Create a new invoice with valid details', async ({ page }) => {

    //
    // STEP 0: Login
    //
    await seedLogin(page);

    //
    // STEP 1: Navigate to Sales > Invoices from the sidebar
    //
    await page.goto('https://dev.hellobooks.ai/invoices/list', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
    const invoicesNav = page.getByRole('link', { name: /invoices/i });
    await invoicesNav.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await invoicesNav.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 2: Click on 'New Invoice' button
    //
    const newInvoiceButton = page.getByRole('button', { name: /new invoice/i });
    await newInvoiceButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await newInvoiceButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    //
    // STEP 3: Select a customer from the dropdown
    //
    const customerDropdown = page.getByRole('combobox', { name: /customer/i });
    await customerDropdown.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await customerDropdown.click({ timeout: ACTION_TIMEOUT });
    const firstCustomerOption = page.getByRole('option').first();
    await firstCustomerOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await firstCustomerOption.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Add a line item with description, quantity, and rate
    //
    const suffix = Date.now().toString(36);
    const itemDescription = "Auto Line Item " + suffix;
    const quantityValue = "2";
    const rateValue = "50";
    const descriptionInput = page.getByLabel(/description/i).first();
    await descriptionInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await descriptionInput.fill(itemDescription, { timeout: ACTION_TIMEOUT });
    const quantityInput = page.getByLabel(/quantity/i).first();
    await quantityInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await quantityInput.fill(quantityValue, { timeout: ACTION_TIMEOUT });
    const rateInput = page.getByLabel(/rate/i).first();
    await rateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await rateInput.fill(rateValue, { timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Set the invoice date and due date
    //
    const invoiceDate = "2024-01-15";
    const dueDate = "2024-02-15";
    const invoiceDateInput = page.getByLabel(/invoice date/i);
    await invoiceDateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await invoiceDateInput.fill(invoiceDate, { timeout: ACTION_TIMEOUT });
    const dueDateInput = page.getByLabel(/due date/i);
    await dueDateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dueDateInput.fill(dueDate, { timeout: ACTION_TIMEOUT });

    //
    // STEP 6: Click 'Save' button
    //
    const referenceValue = "AUTO-INV-" + suffix;
    const referenceInput = page.getByLabel(/reference/i);
    await referenceInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await referenceInput.fill(referenceValue, { timeout: ACTION_TIMEOUT });
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    //
    // STEP 7: Verify invoice creation form opens successfully
    //
    const createInvoiceHeading = page.getByRole('heading', { name: /create invoice|new invoice/i });
    await expect(createInvoiceHeading).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 8: Verify customer is selected and details are populated
    //
    await expect(customerDropdown).toHaveValue(/.+/, { timeout: EXPECT_TIMEOUT });

    //
    // STEP 9: Verify line item is added with calculated total
    //
    const totalCell = page.getByRole('cell', { name: /100/ });
    await expect(totalCell).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 10: Verify invoice is saved successfully
    //
    const successAlert = page.getByRole('alert').first();
    await expect(successAlert).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 11: Verify user is redirected to invoice list or preview
    //
    await page.waitForURL(/\/invoices\/(list|preview)/, { timeout: ACTION_TIMEOUT });

    //
    // STEP 12: Verify new invoice appears in the invoice list
    //
    await page.goto('https://dev.hellobooks.ai/invoices/list', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
    const referenceCell = page.getByRole('cell', { name: referenceValue });
    await expect(referenceCell).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});