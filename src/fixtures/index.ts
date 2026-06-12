import { test as base } from '@playwright/test';
import { parentSuite as allureParentSuite, suite as allureSuite } from 'allure-js-commons';
import { PoLogin } from '../pages/PoLogin';
import { PoInventory } from '../pages/PoInventory';
import { PoCart } from '../pages/PoCart';
import { PoCheckout } from '../pages/PoCheckout';
import { ApiService } from '../api/ApiServices';
import { config } from '../config/environment';
import { labelFromPath } from '../../lib/allureHelper';

/**
 * Extended fixtures providing typed page objects and an API service to every test.
 * Tests import `test` from this file instead of directly from `@playwright/test`.
 *
 * Why fixtures instead of singletons (like conserv-automation's `export default new PoLogin()`)?
 * Playwright gives each test an isolated `page` instance — a shared singleton would leak state
 * between tests. Fixtures solve this: each test receives a fresh PO bound to its own page.
 */

type ExtendedFixtures = {
  loginPage: PoLogin;
  inventoryPage: PoInventory;
  cartPage: PoCart;
  checkoutPage: PoCheckout;
  apiService: ApiService;
  loggedInPage: PoInventory;
};

export const test = base.extend<ExtendedFixtures>({
  loginPage: async ({ page }, use, testInfo) => {
    const { parentSuite, suite } = labelFromPath(testInfo.file);
    await allureParentSuite(parentSuite);
    await allureSuite(suite);
    await use(new PoLogin(page));
  },

  inventoryPage: async ({ page }, use, testInfo) => {
    const { parentSuite, suite } = labelFromPath(testInfo.file);
    await allureParentSuite(parentSuite);
    await allureSuite(suite);
    await use(new PoInventory(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new PoCart(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new PoCheckout(page));
  },

  apiService: async ({ request }, use) => {
    await use(new ApiService(request));
  },

  /**
   * Pre-authenticated inventory page fixture.
   * Navigates to login and authenticates as standard_user before yielding.
   */
  loggedInPage: async ({ page }, use, testInfo) => {
    const { parentSuite, suite } = labelFromPath(testInfo.file);
    await allureParentSuite(parentSuite);
    await allureSuite(suite);

    const loginPage = new PoLogin(page);
    await loginPage.goto();
    await loginPage.login(
      config.credentials.standard.username,
      config.credentials.standard.password
    );
    await page.waitForURL('**/inventory.html');

    await use(new PoInventory(page));
  },
});

export { expect } from '@playwright/test';
