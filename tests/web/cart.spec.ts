/**
 * @suite Cart Management
 * @risk High — cart accuracy directly affects order correctness.
 *              Wrong items or wrong quantities = wrong fulfillment = revenue/trust loss.
 *
 * Covers:
 *  - Add multiple items and verify cart count + contents       @smoke @challenge
 *  - Remove an item and verify cart updates                    @challenge
 *  - Cart persists across navigation (session integrity)       @challenge
 *  - Empty cart behavior                                       @challenge
 *  - Accessibility scan on inventory page                      @accessibility
 */

import { test, expect } from '../../src/fixtures/index';
import { addFeature, addStory, setSeverity, addIssue, executeStep, applyAllureLabels } from '../../lib/allureHelper';
import { assertionUtils } from '../../lib/assertionUtils';
import AxeBuilder from '@axe-core/playwright';

test.describe('@smoke @challenge Cart Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await applyAllureLabels(__filename);
    await addFeature('Cart');
    await loginPage.goto();
  });

  test('adding multiple items updates the cart badge and cart contents', async ({
    loginPage,
    inventoryPage,
    cartPage,
    page,
  }) => {
    await addStory('Add multiple items to cart');
    await setSeverity('critical');

    await loginPage.login('standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');

    const itemsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

    for (const item of itemsToAdd) {
      await inventoryPage.addItemToCart(item);
    }

    const assertions = assertionUtils.initialize('Cart badge assertions');
    assertions.expect(
      'Cart badge shows 2 items',
      await inventoryPage.getCartBadgeCount(),
      2,
      'toBe'
    );
    await assertions.finalize();

    await inventoryPage.goToCart();
    await page.waitForURL('**/cart.html');

    const cartItems = await cartPage.getItemNames();
    const cartAssertions = assertionUtils.initialize('Cart contents assertions');
    cartAssertions
      .expect('Cart contains 2 items', cartItems.length, 2, 'toBe')
      .expect('Backpack is in cart', cartItems.some((n) => n.includes('Backpack')), true, 'toBe')
      .expect('Bike Light is in cart', cartItems.some((n) => n.includes('Bike Light')), true, 'toBe');
    await cartAssertions.finalize();
  });

  test('removing an item from the cart updates cart count correctly', async ({
    loginPage,
    inventoryPage,
    cartPage,
    page,
  }) => {
    await addStory('Remove item from cart');
    await setSeverity('critical');

    await loginPage.login('standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');

    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await inventoryPage.goToCart();
    await page.waitForURL('**/cart.html');

    await cartPage.removeItem('Sauce Labs Backpack');

    const assertions = assertionUtils.initialize('After-remove assertions');
    assertions
      .expect('Cart has 1 item remaining', await cartPage.getItemCount(), 1, 'toBe')
      .expect(
        'Removed item is gone',
        (await cartPage.getItemNames()).some((n) => n.includes('Backpack')),
        false,
        'toBe'
      );
    await assertions.finalize();
  });

  test('cart contents persist after navigating back to inventory', async ({
    loginPage,
    inventoryPage,
    cartPage,
    page,
  }) => {
    await addStory('Cart session persistence');
    await setSeverity('high' as any);

    await loginPage.login('standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');

    await inventoryPage.addItemToCart('Sauce Labs Fleece Jacket');
    await inventoryPage.goToCart();
    await page.waitForURL('**/cart.html');

    await cartPage.continueShopping();
    await page.waitForURL('**/inventory.html');

    await executeStep('Navigate back to cart', async () => {
      await inventoryPage.goToCart();
      await page.waitForURL('**/cart.html');
    });

    const assertions = assertionUtils.initialize('Cart persistence assertions');
    assertions.expect(
      'Fleece Jacket still in cart after navigation',
      (await cartPage.getItemNames()).some((n) => n.includes('Fleece Jacket')),
      true,
      'toBe'
    );
    await assertions.finalize();
  });

  test('empty cart has no items and shows checkout option', async ({
    loginPage,
    cartPage,
    page,
  }) => {
    await addStory('Empty cart behavior');
    await setSeverity('normal');

    await loginPage.login('standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');
    await page.goto('/cart.html');

    const assertions = assertionUtils.initialize('Empty cart assertions');
    assertions
      .expect('Cart is empty', await cartPage.isEmpty(), true, 'toBe')
      .expect(
        'Checkout button exists',
        await cartPage.locators.footer.checkoutButton.isVisible(),
        true,
        'toBe'
      );
    await assertions.finalize();
  });

  /**
   * Accessibility scan of the inventory page.
   * Even a single axe scan demonstrates awareness of inclusive design and catches
   * low-hanging a11y issues (missing ARIA labels, insufficient contrast, etc.)
   * that are easy to miss in functional-only test suites.
   *
   * Known defect in saucedemo: the sort <select> element is missing an accessible
   * label (axe rule: select-name). This is a real WCAG 2 / Section 508 violation
   * in the demo application. It is documented here with addIssue() and excluded
   * from the failing assertion because we cannot modify the AUT.
   * In a real project this would be filed as a bug and tracked to resolution.
   */
  test('@accessibility inventory page has no critical accessibility violations', async ({
    loginPage,
    page,
  }) => {
    await addStory('Accessibility — inventory page');
    await setSeverity('normal');

    await loginPage.login('standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');

    const accessibilityScanResults = await executeStep(
      'Run axe accessibility scan',
      async () => new AxeBuilder({ page }).analyze()
    );

    const KNOWN_APP_VIOLATIONS = ['select-name'];

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' && !KNOWN_APP_VIOLATIONS.includes(v.id)
    );

    const knownFound = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' && KNOWN_APP_VIOLATIONS.includes(v.id)
    );
    if (knownFound.length > 0) {
      await addIssue('A11Y-SELECT-NAME', 'https://dequeuniversity.com/rules/axe/4.11/select-name');
      await executeStep(
        `Known a11y violation present: ${knownFound.map((v) => v.id).join(', ')}`,
        async () => {
          // Violation is documented — not failing the test but surfaced for triage
        }
      );
    }

    expect(
      criticalViolations,
      `Unexpected critical a11y violations:\n${JSON.stringify(criticalViolations, null, 2)}`
    ).toHaveLength(0);
  });
});
