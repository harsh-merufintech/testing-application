import { test, expect } from '@playwright/test';

//
// GLOBAL CONFIGURATION
//
test.setTimeout(5 * 60 * 1000); // 5 minutes per test

const ACTION_TIMEOUT = 3 * 60 * 1000;
const EXPECT_TIMEOUT = 3 * 60 * 1000;

//
// TEST SUITE
//
test.describe('Authentication @S0nr5n354', () => {

  test('@Tv518t9ff @login MODULE-001: Verify successful login with valid credentials', async ({ page }) => {

    //
    // STEP 1: Navigate to the login page (Login page loads successfully)
    //
    await page.goto('/login', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');
    const usernameField = page.getByRole('textbox', { name: /username|email/i });
    await usernameField.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(usernameField).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 2: Enter valid username in the username field (Username is accepted in the field)
    //
    await usernameField.fill('valid.user@example.com', { timeout: ACTION_TIMEOUT });
    await expect(usernameField).toHaveValue('valid.user@example.com', { timeout: EXPECT_TIMEOUT });

    //
    // STEP 3: Enter valid password in the password field (Password is masked and accepted)
    //
    const passwordField = page.getByRole('textbox', { name: /password/i });
    await passwordField.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await passwordField.fill('ValidPassword123!', { timeout: ACTION_TIMEOUT });
    await expect(passwordField).toHaveAttribute('type', 'password', { timeout: EXPECT_TIMEOUT });
    await expect(passwordField).toHaveValue('ValidPassword123!', { timeout: EXPECT_TIMEOUT });

    //
    // STEP 4: Click the Login button (User is redirected to the dashboard/home page and session is created)
    //
    const loginButton = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await loginButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');
    await page.waitForURL(/banking|dashboard|home/i, { timeout: ACTION_TIMEOUT });

    const dashboardHeading = page.getByRole('heading', { name: /dashboard|banking|home/i });
    await dashboardHeading.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(dashboardHeading).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});