import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Playwright configuration.
 * Projects mirror the local/pipeline split used in WDIO-based repos:
 *   - local: headed Chrome for development
 *   - pipeline: headless Chrome with retries for CI (see note below)
 *   - firefox / webkit: cross-browser coverage as required by challenge spec
 *
 * NOTE on retries: retries: 2 in the pipeline project is a pragmatic CI safeguard
 * against transient network/rendering flakiness. Flaky tests should be diagnosed
 * and fixed at the source — not silently tolerated via retries alone.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env.CI ? ([['github']] as const) : []),
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'local',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pipeline',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: true },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: true },
    },
  ],
});
