import { Page, Locator } from '@playwright/test';
import { executeStep } from '../../lib/allureHelper';

/**
 * BasePage: shared utilities for all Page Objects.
 * Every page receives a `page` instance via the constructor (Playwright fixture pattern).
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path: string): Promise<void> {
    await executeStep(`Navigate to ${path}`, async () => {
      await this.page.goto(path);
    });
  }

  async clickElement(locator: Locator, label: string): Promise<void> {
    await executeStep(`Click: ${label}`, async () => {
      await locator.waitFor({ state: 'visible' });
      await locator.click();
    });
  }

  async fillField(locator: Locator, value: string, label: string): Promise<void> {
    await executeStep(`Fill ${label}: "${value}"`, async () => {
      await locator.waitFor({ state: 'visible' });
      await locator.fill(value);
    });
  }

  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }
}
