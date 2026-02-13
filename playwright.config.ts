import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'json' : 'html',
  timeout: 5 * 60 * 1000,
  expect: {
    timeout: 3 * 60 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'https://dev.hellobooks.ai',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 3 * 60 * 1000,
    navigationTimeout: 3 * 60 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
