/**
 * @suite Checkout Flow
 * @risk Critical — this is the revenue-completion path.
 *                  Bugs here directly prevent purchase completion and/or charge the wrong amount.
 *
 * Covers:
 *  - Full checkout with price accuracy assertion               @smoke @challenge
 *    (item total on overview MUST equal sum of cart item prices)
 *  - Checkout blocked on missing required contact fields       @challenge
 *  - problem_user: broken remove button prevents cart cleanup  @challenge
 *
 * NOTE on problem_user:
 *  saucedemo's problem_user has a JavaScript bug where the "Remove" button
 *  does not decrement the cart count — users cannot undo an add-to-cart.
 *  This test documents that known defect.
 */

import { test, expect } from '../../src/fixtures/index';
import { config } from '../../src/config/environment';
import { addFeature, addStory, setSeverity, addIssue, executeStep, applyAllureLabels } from '../../lib/allureHelper';
import { assertionUtils } from '../../lib/assertionUtils';
import { PoLogin } from '../../src/pages/PoLogin';
import { PoInventory } from '../../src/pages/PoInventory';

test.describe('@smoke @challenge Checkout Flow', () => {
  test.beforeEach(async () => {
    await applyAllureLabels(__filename);
    await addFeature('Checkout');
  });

  test('complete checkout — item total on overview matches sum of cart item prices', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await addStory('Full checkout with price accuracy');
    await setSeverity('blocker');

    await loginPage.goto();
    await loginPage.login(
      config.credentials.standard.username,
      config.credentials.standard.password
    );
    await page.waitForURL('**/inventory.html');

    const itemsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
    for (const item of itemsToAdd) {
      await inventoryPage.addItemToCart(item);
    }

    await inventoryPage.goToCart();
    await page.waitForURL('**/cart.html');

    // Capture cart prices before checkout — these are the source of truth
    const cartPrices = await cartPage.getItemPrices();
    const expectedSubtotal = parseFloat(
      cartPrices.reduce((sum, p) => sum + p, 0).toFixed(2)
    );

    await cartPage.proceedToCheckout();
    await page.waitForURL('**/checkout-step-one.html');

    await checkoutPage.fillContactInfo('Jane', 'Doe', '10001');
    await checkoutPage.continueToOverview();
    await page.waitForURL('**/checkout-step-two.html');

    const displayedSubtotal = await checkoutPage.getItemTotal();
    const grandTotal = await checkoutPage.getGrandTotal();
    const taxAmount = await checkoutPage.getTaxAmount();

    const assertions = assertionUtils.initialize('Checkout price accuracy assertions');
    assertions
      .expect(
        'Item subtotal matches sum of cart prices',
        displayedSubtotal,
        expectedSubtotal,
        'toBeCloseTo',
        2
      )
      .expect(
        'Grand total = subtotal + tax',
        grandTotal,
        parseFloat((displayedSubtotal + taxAmount).toFixed(2)),
        'toBeCloseTo',
        2
      );
    await assertions.finalize();

    await checkoutPage.finishOrder();
    await page.waitForURL('**/checkout-complete.html');

    const completionAssertions = assertionUtils.initialize('Order completion assertions');
    completionAssertions.expect(
      'Completion header displayed',
      await checkoutPage.getCompleteHeader(),
      checkoutPage.messages.completeHeader
    );
    await completionAssertions.finalize();
  });

  test('checkout is blocked when required contact fields are missing', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await addStory('Checkout form validation — missing fields');
    await setSeverity('critical');

    await loginPage.goto();
    await loginPage.login(
      config.credentials.standard.username,
      config.credentials.standard.password
    );
    await page.waitForURL('**/inventory.html');

    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.goToCart();
    await page.waitForURL('**/cart.html');
    await cartPage.proceedToCheckout();
    await page.waitForURL('**/checkout-step-one.html');

    // Submit without filling any fields
    await checkoutPage.continueToOverview();

    const assertions = assertionUtils.initialize('Missing fields error assertions');
    assertions
      .expect('Error is visible', await checkoutPage.isErrorVisible(), true, 'toBe')
      .expect(
        'Error mentions first name',
        await checkoutPage.getErrorMessage(),
        'First Name is required',
        'toContain'
      );
    await assertions.finalize();
  });

  /**
   * Defect documentation test: problem_user's Remove button is broken on specific items.
   *
   * Expected (correct) behavior: clicking Remove decreases cart count to 0.
   * Actual (defect) behavior: clicking Remove does not decrement the cart —
   *   the item remains (or the count increases). The user cannot undo an add-to-cart.
   *
   * Revenue impact: user adds an item they don't want, cannot remove it before checkout.
   *
   * This test asserts the DEFECTIVE behavior so CI will detect if/when it is fixed.
   * addIssue() links it for Allure traceability.
   */
  test('problem_user: remove button does not remove item from cart (known defect)', async ({
    page,
  }) => {
    await addStory('problem_user broken remove button');
    await setSeverity('critical');
    await addIssue('SAUCEDEMO-PROBLEM-USER-REMOVE', 'https://www.saucedemo.com');

    const loginPage = new PoLogin(page);
    await loginPage.goto();
    await loginPage.login(
      config.credentials.problem.username,
      config.credentials.problem.password
    );
    await page.waitForURL('**/inventory.html');

    const inventoryPage = new PoInventory(page);

    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    await executeStep('Verify item was added to cart', async () => {
      const countAfterAdd = await inventoryPage.getCartBadgeCount();
      expect(countAfterAdd).toBe(1);
    });

    // Attempt to remove the item
    await inventoryPage.removeItemFromCart('Sauce Labs Backpack');

    const countAfterRemove = await inventoryPage.getCartBadgeCount();

    await executeStep('Document defect: cart count after Remove click for problem_user', async () => {
      // problem_user: Remove button does not decrement the cart.
      // Expected (correct): 0. Actual (defect): 1 or more.
      // If this assertion fails (count IS 0), the bug has been fixed.
      expect(countAfterRemove).toBeGreaterThan(0);
    });
  });
});
