/**
 * @suite Authentication
 * @risk Critical — login is the entry gate to all revenue-generating flows.
 *                  A broken login = 0% conversion.
 *
 * Covers:
 *  - Happy path: standard_user logs in successfully           @smoke @challenge
 *  - Access control: locked_out_user is blocked               @challenge
 *  - Error handling: invalid credentials show error message   @challenge
 *  - Input validation: missing username / password            @challenge
 */

import { test, expect } from '../../src/fixtures/index';
import { config } from '../../src/config/environment';
import { addFeature, addStory, setSeverity, executeStep, applyAllureLabels } from '../../lib/allureHelper';
import { assertionUtils } from '../../lib/assertionUtils';

test.describe('@smoke @challenge Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await applyAllureLabels(__filename);
    await addFeature('Authentication');
    await loginPage.goto();
  });

  test('standard_user logs in and reaches the inventory page', async ({ loginPage, page }) => {
    await addStory('Successful login');
    await setSeverity('blocker');

    await loginPage.login(
      config.credentials.standard.username,
      config.credentials.standard.password
    );

    await executeStep('Verify redirect to inventory page', async () => {
      await page.waitForURL('**/inventory.html');
    });

    const assertions = assertionUtils.initialize('Post-login assertions');
    assertions
      .expect('URL contains inventory path', /inventory\.html/.test(page.url()), true, 'toBe')
      .expect('Page title', await page.title(), 'Swag Labs');
    await assertions.finalize();
  });

  test('locked_out_user is blocked with a descriptive error message', async ({ loginPage }) => {
    await addStory('Locked out user access control');
    await setSeverity('critical');

    await loginPage.login(
      config.credentials.lockedOut.username,
      config.credentials.lockedOut.password
    );

    const assertions = assertionUtils.initialize('Locked-out error assertions');
    assertions
      .expect('Error is visible', await loginPage.isErrorVisible(), true, 'toBe')
      .expect(
        'Error message text',
        await loginPage.getErrorMessage(),
        loginPage.messages.errorLocked,
        'toContain'
      );
    await assertions.finalize();
  });

  test('invalid credentials show error and do not redirect', async ({ loginPage, page }) => {
    await addStory('Invalid credentials rejection');
    await setSeverity('critical');

    await loginPage.login(
      config.credentials.invalid.username,
      config.credentials.invalid.password
    );

    const assertions = assertionUtils.initialize('Invalid credentials assertions');
    assertions
      .expect('Error is visible', await loginPage.isErrorVisible(), true, 'toBe')
      .expect(
        'Error message text',
        await loginPage.getErrorMessage(),
        loginPage.messages.errorInvalidCredentials,
        'toContain'
      )
      .expect('Stays on login page', page.url().includes('inventory'), false, 'toBe');
    await assertions.finalize();
  });

  test('submitting empty form shows username-required error', async ({ loginPage }) => {
    await addStory('Empty form validation');
    await setSeverity('normal');

    await loginPage.locators.loginForm.loginButton.click();

    const assertions = assertionUtils.initialize('Empty form error assertions');
    assertions
      .expect('Error is visible', await loginPage.isErrorVisible(), true, 'toBe')
      .expect(
        'Username required message',
        await loginPage.getErrorMessage(),
        loginPage.messages.errorUsernameRequired,
        'toContain'
      );
    await assertions.finalize();
  });
});
