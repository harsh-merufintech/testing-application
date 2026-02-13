import { test, expect } from '@playwright/test';

//
// GLOBAL CONFIGURATION
//
test.setTimeout(5 * 60 * 1000); // 5 minutes per test

const ACTION_TIMEOUT = 3 * 60 * 1000;
const EXPECT_TIMEOUT = 3 * 60 * 1000;

// Inline login helper — credentials from Test Environment settings
async function seedLogin(page) {
  await page.goto('https://dev.hellobooks.ai/login', { timeout: ACTION_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

  const emailInput = page.getByLabel(/email/i);
  await emailInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
  await emailInput.fill('harshpadaliya@merufintech.net', { timeout: ACTION_TIMEOUT });

  const passwordInput = page.getByLabel(/password/i);
  await passwordInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
  await passwordInput.fill('Harsh@12345', { timeout: ACTION_TIMEOUT });

  const loginButton = page.getByRole('button', { name: /sign in|log in|login|submit/i });
  await loginButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
  await loginButton.click({ timeout: ACTION_TIMEOUT });

  await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
}

//
// TEST SUITE
//
test.describe('Authentication @Seq5isj07', () => {

  test('@T54o1e5ro @login @authentication @positive-test @smoke-test Successful login with valid credentials', async ({ page }) => {

    //
    // STEP 0: Login
    //
    await seedLogin(page);

    //
    // STEP 1: Navigate to the login page
    //
    await page.context().clearCookies();
    await page.goto('https://dev.hellobooks.ai/login', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const emailField = page.getByLabel(/email/i);
    await emailField.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(emailField).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 2: Enter valid username in the username field
    //
    await emailField.fill('harshpadaliya@merufintech.net', { timeout: ACTION_TIMEOUT });
    await expect(emailField).toHaveValue('harshpadaliya@merufintech.net', { timeout: EXPECT_TIMEOUT });

    //
    // STEP 3: Enter valid password in the password field
    //
    const passwordField = page.getByLabel(/password/i);
    await passwordField.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(passwordField).toHaveAttribute('type', 'password', { timeout: EXPECT_TIMEOUT });
    await passwordField.fill('Harsh@12345', { timeout: ACTION_TIMEOUT });
    await expect(passwordField).toHaveValue('Harsh@12345', { timeout: EXPECT_TIMEOUT });

    //
    // STEP 4: Click the Login button
    //
    const loginBtn = page.getByRole('button', { name: /sign in|log in|login|submit/i });
    await loginBtn.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await loginBtn.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
    await page.waitForURL(/https:\/\/dev\.hellobooks\.ai\/(banking|dashboard|home).*/, { timeout: ACTION_TIMEOUT });

    await expect(page).toHaveURL(/https:\/\/dev\.hellobooks\.ai\/(banking|dashboard|home).*/, { timeout: EXPECT_TIMEOUT });

  });

});